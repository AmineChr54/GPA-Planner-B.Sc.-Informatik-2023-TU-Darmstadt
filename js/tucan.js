/* ==========================================================================
   TUCaN Leistungsspiegel import.
   1) PDF from TUCaN's print button → pdf.js (lazy-loaded from vendor/) → positioned
      text items → rows by y → columns by the header's x positions.
   2) Fallback: text copied from the TUCaN web page.
   Nothing leaves the browser.
   ========================================================================== */
"use strict";

const Tucan = (() => {
  const CODE_RE = /^(\d{2}-[0-9a-z]{2}-\d{4})(\/[a-z]{2})?$/i;
  const NUM_RE = /^\d{1,3},\d{1,3}$/;
  const DATE_RE = /^\d{2}\.\d{2}\.\d{4}$/;
  const SKIP_RE = /^(summe|es sind|maximal|in diesem|erforderliche|leistungsspiegel|datum|gesamt-gpa|hauptfach-gpa|seite|\(summe)/i;

  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const num = (s) => parseFloat(String(s).replace(",", "."));
  const baseCode = (c) => (c || "").replace(/\/[a-z]{2}$/i, "").toUpperCase();

  /* section headers → area (and group inside B112 / B12) */
  const AREA_H = [
    [/^pflichtbereich$/, "A"],
    [/^wahlpflichtbereich$/, "B111"],
    [/^informatik[- ]?wahlbereiche?$|^wahlbereiche? (des fachbereichs )?informatik$/, "B112"],
    [/^studienbegleitende leistungen$/, "B12"],
    [/^studium generale/, "B2"],
    [/^bachelorarbeit|^abschlussarbeit|^thesis/, "C"],
    [/^zusatz|zusatzliche leistungen/, "X"],
  ];
  const GROUP_H = {
    B112: [[/kunstliche intelligenz|artificial/, "KI"], [/cyber|privatheit|security/, "CYB"], [/vernetzte|networked/, "KVS"], [/software|hardware/, "SWHW"], [/theorie|theory/, "THEO"]],
    B12: [[/seminar/, "SEM"], [/praktikum in der lehre/, "PIL"], [/studienarbeit/, "SA"], [/praktik|projekt/, "PRAK"]],
  };

  function guessGroup(area, code, name, cp) {
    const cat = (window.CATALOG || []).find((c) => baseCode(c.code) === baseCode(code) && c.a === area);
    if (cat && cat.g) return cat.g;
    const n = norm(name);
    if (area === "B12") {
      if (/praktikum in der lehre/.test(n)) return "PIL";
      if (/studienarbeit/.test(n)) return "SA";
      if (/praktikum|projekt|lab\b|praktika/.test(n)) return "PRAK";
      if (/seminar|ausgewahlte themen|proseminar/.test(n)) return "SEM";
      return cp >= 6 ? "PRAK" : "SEM";
    }
    return null;
  }

  /* ---------------- shared: rows → modules ---------------- */
  // row: {code, name, credits, anger, note, status, date, header, gpa}
  function rowsToResult(rows) {
    const out = [], warnings = [];
    let area = null, group = null, tucanGpa = null;
    for (const r of rows) {
      if (r.gpa != null) { if (tucanGpa == null) tucanGpa = r.gpa; continue; }
      if (r.header) {
        const h = norm(r.header);
        const ah = AREA_H.find(([re]) => re.test(h));
        if (ah) { area = ah[1]; group = null; continue; }
        const gh = (GROUP_H[area] || []).find(([re]) => re.test(h));
        if (gh) group = gh[1];
        continue;
      }
      if (!r.code) continue;
      if (area === "X") continue; // Zusätzliche Leistungen never enter the Gesamtnote
      if (!area) { warnings.push({ k: "imp.noArea", v: { name: r.name } }); continue; }
      const m = { a: area, code: r.code, name: r.name || r.code, cp: null, status: "open", grade: null, ungraded: false };
      const cp = r.anger != null ? r.anger : r.credits;
      if (cp != null) m.cp = cp;
      const note = (r.note || "").trim().toLowerCase();
      if (note === "b" || note === "bestanden" || note === "passed") {
        m.status = "done"; m.ungraded = true;
      } else if (NUM_RE.test(note) || /^\d(\.\d)?$/.test(note)) {
        const g = num(note);
        if (g <= 4.0) { m.status = "done"; m.grade = g; }
        else { m.status = "open"; m.attempts = 1; warnings.push({ k: "imp.failed", v: { name: m.name } }); }
      } else if (note === "nb" || /nicht bestanden/.test(note)) {
        m.status = "open"; m.attempts = 1; warnings.push({ k: "imp.failed", v: { name: m.name } });
      } else if (m.cp != null && r.anger != null) {
        m.status = "done"; m.ungraded = true; // credited without grade (e.g. anerkannt b)
      }
      if (r.date && DATE_RE.test(r.date)) { const [d, mo, y] = r.date.split("."); m.date = `${y}-${mo}-${d}`; } // no Date→ISO: UTC shift would move the day
      if (area === "B112" || area === "B12") m.g = group || guessGroup(area, m.code, m.name, m.cp || 0);
      if (area === "B2" && group) m.g = null;
      out.push(m);
    }
    return { modules: out, tucanGpa, warnings };
  }

  /* ---------------- PDF via pdf.js ---------------- */
  let pdfjsReady = null;
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = () => rej(new Error("load " + src));
      document.head.appendChild(s);
    });
  }
  function ensurePdfjs() {
    if (!pdfjsReady) {
      // The worker runs on the main thread ("fake worker"): browsers refuse real
      // workers for file:// pages, and a 2-page transcript parses in milliseconds.
      pdfjsReady = loadScript("vendor/pdfjs/pdf.worker.min.js")
        .then(() => loadScript("vendor/pdfjs/pdf.min.js"))
        .then(() => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdfjs/pdf.worker.min.js"; return window.pdfjsLib; });
    }
    return pdfjsReady;
  }

  async function pdfItems(buffer) {
    const lib = await ensurePdfjs();
    const doc = await lib.getDocument({ data: buffer, isEvalSupported: false }).promise;
    const pages = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const vp = page.getViewport({ scale: 1 });
      const tc = await page.getTextContent();
      const items = [];
      for (const it of tc.items) {
        const str = (it.str || "").trim();
        if (!str) continue;
        const t = lib.Util.transform(vp.transform, it.transform);
        items.push({ s: str, x: t[4], y: t[5], w: it.width, r: t[4] + it.width });
      }
      pages.push(items);
    }
    return pages;
  }

  /* group items of one page into rows; tolerance in pt */
  function toRows(items, tol = 2.2) {
    const sorted = items.slice().sort((a, b) => a.y - b.y || a.x - b.x);
    const rows = [];
    for (const it of sorted) {
      const last = rows[rows.length - 1];
      if (last && Math.abs(last.y - it.y) <= tol) { last.items.push(it); last.y = (last.y + it.y) / 2; }
      else rows.push({ y: it.y, items: [it] });
    }
    rows.forEach((r) => r.items.sort((a, b) => a.x - b.x));
    return rows;
  }

  function parsePdfPages(pages) {
    let cols = null;
    const all = [];
    for (const items of pages) {
      const rows = toRows(items);
      // header row with column titles
      for (const r of rows) {
        const f = (w) => r.items.find((i) => norm(i.s) === w);
        const cr = f("credits"), no = f("note");
        if (cr && no) {
          const da = f("datum"), an = f("angerechnet"), st = f("status");
          cols = { dateL: da ? da.x : cr.x - 70, credR: cr.r, angR: an ? an.r : null, noteR: no.r, statusL: st ? st.x : no.r + 6 };
          r.isHead = true;
        }
      }
      if (!cols) continue;
      const valueX = cols.dateL - 8;
      const parsed = [];
      for (const r of rows) {
        if (r.isHead) continue;
        const left = r.items.filter((i) => i.x < valueX);
        const vals = r.items.filter((i) => i.x >= valueX);
        const text = left.map((i) => i.s).join(" ").trim();
        if (/^(gesamt-gpa)$/i.test(text) && vals.length) {
          const v = vals.find((i) => /^\d,\d{1,3}$/.test(i.s));
          if (v) parsed.push({ y: r.y, gpa: num(v.s) });
          continue;
        }
        const row = { y: r.y, vals: [] };
        if (left.length && CODE_RE.test(left[0].s)) { row.code = left[0].s; row.name = left.slice(1).map((i) => i.s).join(" ").trim(); }
        else if (text) row.text = text, row.textX = left[0].x;
        for (const v of vals) {
          if (DATE_RE.test(v.s)) { row.date = v.s; continue; }
          if (v.x >= cols.statusL - 4) { row.status = v.s; continue; }
          const d = (c) => (c == null ? 1e9 : Math.abs(v.r - c));
          const best = [["credits", d(cols.credR)], ["anger", d(cols.angR)], ["note", d(cols.noteR)]].sort((a, b) => a[1] - b[1])[0];
          if (best[1] > 14) continue;
          if (best[0] === "note") row.note = v.s; else if (NUM_RE.test(v.s)) row[best[0]] = num(v.s);
        }
        parsed.push(row);
      }
      // stitch: value-only rows → nearest code row; name continuation lines → previous code row
      for (let i = 0; i < parsed.length; i++) {
        const r = parsed[i];
        if (r.code || r.gpa != null) continue;
        const hasVals = r.credits != null || r.anger != null || r.note != null;
        if (!r.text && hasVals) {
          let best = null;
          for (const c of parsed) if (c.code && Math.abs(c.y - r.y) < 9 && c.credits == null && c.note == null && (!best || Math.abs(c.y - r.y) < Math.abs(best.y - r.y))) best = c;
          if (best) { Object.assign(best, { credits: r.credits, anger: r.anger, note: r.note }); r.drop = true; }
          continue;
        }
        const prev = parsed[i - 1];
        if (r.text && prev && prev.code && r.textX > 80 && r.y - prev.y < 11 && !SKIP_RE.test(r.text)) {
          prev.name += " " + r.text;
          if (hasVals && prev.credits == null) Object.assign(prev, { credits: r.credits, anger: r.anger, note: r.note });
          r.drop = true;
        }
      }
      for (const r of parsed) {
        if (r.drop) continue;
        if (r.gpa != null) all.push({ gpa: r.gpa });
        else if (r.code) all.push(r);
        else if (r.text && !SKIP_RE.test(norm(r.text)) && r.credits == null && r.note == null) all.push({ header: r.text });
      }
    }
    if (!cols) throw new Error("imp.noTable");
    return rowsToResult(all);
  }

  async function fromPdf(buffer) {
    return parsePdfPages(await pdfItems(buffer));
  }

  /* ---------------- pasted text ---------------- */
  function fromText(text) {
    const rows = [];
    for (let line of text.split(/\r?\n/)) {
      line = line.replace(/ /g, " ").trim();
      if (!line) continue;
      const cells = (line.includes("\t") ? line.split("\t") : line.split(/\s{2,}/)).map((c) => c.trim()).filter(Boolean);
      const gm = /^gesamt-gpa\s*([\d,]+)/i.exec(line.replace(/\t/g, " "));
      if (gm) { rows.push({ gpa: num(gm[1]) }); continue; }
      let first = cells[0] || "";
      let code = null, rest = cells.slice(1);
      const cm = /^(\d{2}-[0-9a-z]{2}-\d{4}(?:\/[a-z]{2})?)\s*(.*)$/i.exec(first);
      if (cm) { code = cm[1]; if (cm[2]) rest = [cm[2]].concat(rest); }
      if (!code) {
        if (!SKIP_RE.test(norm(line)) && cells.length <= 2 && !NUM_RE.test(cells[cells.length - 1] || "")) rows.push({ header: cells[0] });
        continue;
      }
      // name = leading non-value cells; values from the end
      const isVal = (c) => NUM_RE.test(c) || DATE_RE.test(c) || /^(b|nb|bestanden|nicht bestanden|angemeldet)$/i.test(c);
      const nameParts = [], vals = [];
      for (const c of rest) (vals.length || isVal(c)) && isVal(c) ? vals.push(c) : nameParts.push(c);
      const row = { code, name: nameParts.join(" ") };
      const nums = [];
      for (const v of vals) { if (DATE_RE.test(v)) row.date = v; else nums.push(v); }
      // order in TUCaN: Credits, Angerechnet, Note
      const isGrade = (v) => /^[1-5],[037]$/.test(v) && v !== "5,0" || /^(b|nb|bestanden|nicht bestanden)$/i.test(v);
      if (nums.length >= 3) { row.credits = num(nums[0]); row.anger = num(nums[1]); row.note = nums[2]; }
      else if (nums.length === 2) {
        if (isGrade(nums[1]) && nums[1] !== nums[0]) { row.credits = num(nums[0]); row.anger = num(nums[0]); row.note = nums[1]; }
        else { row.credits = num(nums[0]); row.anger = num(nums[1]); }
      } else if (nums.length === 1) { if (isGrade(nums[0]) && !/,0$/.test(nums[0])) row.note = nums[0]; else row.credits = num(nums[0]); }
      rows.push(row);
    }
    return rowsToResult(rows);
  }

  return { fromPdf, fromText, parsePdfPages, baseCode, ensurePdfjs };
})();
window.Tucan = Tucan;
