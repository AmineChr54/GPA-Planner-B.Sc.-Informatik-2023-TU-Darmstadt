/* ==========================================================================
   Official exam dates from the TU exam schedule (.xlsx).
   Each semester the maintainer uploads the new file as data/pruefungstermine.xlsx;
   the app reads it in the browser and keeps only computer-science exams:
     1. rows whose name carries a module code we know (Pflicht + catalog),
        or any 20-… (FB Informatik) / 04-10-… (Mathematik für Informatik) code
     2. rows without a code whose name is one of our module names
        (the Pflicht exams are listed by name only)
   Rows with another department's code are dropped.
   On file:// (or if the upload is missing) students can pick the file themselves.
   ========================================================================== */
"use strict";

const ExamDates = (() => {
  const LS = "tud-notenplaner-examdates";
  const REPO_FILE = "data/pruefungstermine.xlsx";
  let data = null; // { term:"WiSe 26/27", modified, source, exams:[{code,name,date,start,end,second}] }
  const listeners = [];

  const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, " ").trim();
  const CODE_RE = /\b\d\d-[0-9a-z]{2}-[0-9a-z]{4}(?:\/[a-z]{2})?\b/gi;
  const isCs = (code) => /^20-/.test(code) || /^04-10-/.test(code);
  /* names the schedule uses that differ from the Modulhandbuch — add here when TU renames something */
  const ALIASES = {
    "mathematik i inf": "04-10-0118",
    "mathematik ii inf": "04-10-0119",
  };

  function knownModules() {
    const byCode = new Map(), byName = new Map();
    const add = (code, name) => {
      const k = Tucan.baseCode(code);
      if (!byCode.has(k)) byCode.set(k, { code, name });
      if (!byName.has(norm(name))) byName.set(norm(name), { code, name });
    };
    (window.PFLICHT || []).forEach((p) => add(p[0], p[1]));
    (window.CATALOG || []).forEach((c) => add(c.code, c.name));
    return { byCode, byName };
  }

  function excelDate(v) {
    if (!v) return null;
    if (/^\d+(\.\d+)?$/.test(v)) return new Date(Date.UTC(1899, 11, 30) + Math.floor(+v) * 864e5).toISOString().slice(0, 10);
    const m = String(v).match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
    if (m) return `${m[3].length === 2 ? "20" + m[3] : m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    const iso = String(v).match(/\d{4}-\d{2}-\d{2}/);
    return iso ? iso[0] : null;
  }
  function excelTime(v) {
    if (!v) return "";
    if (/^0?\.\d+$|^0$/.test(v)) { const min = Math.round(+v * 1440); return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`; }
    const m = String(v).match(/(\d{1,2}):(\d{2})/);
    return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
  }

  /* "Prüfungen_WS_26_27" → WiSe 26/27; otherwise from the dates (Feb/Mar exams belong to the winter term) */
  function termOf(sheetName, dates) {
    const m = sheetName.match(/\b(WS|WiSe|SS|SoSe)[ _-]?(\d{2})/i);
    if (m) {
      const y = +m[2];
      return /^w/i.test(m[1]) ? `WiSe ${String(y).padStart(2, "0")}/${String(y + 1).padStart(2, "0")}` : `SoSe ${String(y).padStart(2, "0")}`;
    }
    const sorted = dates.slice().sort(), mid = sorted[Math.floor(sorted.length / 2)];
    if (!mid) return "";
    const y = +mid.slice(2, 4), mo = +mid.slice(5, 7);
    return mo <= 4 ? `WiSe ${String(y - 1).padStart(2, "0")}/${String(y).padStart(2, "0")}` : mo >= 10 ? `WiSe ${String(y).padStart(2, "0")}/${String(y + 1).padStart(2, "0")}` : `SoSe ${String(y).padStart(2, "0")}`;
  }

  function fromSheet({ sheetName, modified, rows }, source) {
    const headIdx = rows.findIndex((r) => Object.values(r).some((v) => /veranstaltungsname/i.test(v)));
    if (headIdx < 0) throw new Error("exams.badFile");
    const head = rows[headIdx], col = {};
    for (const [c, v] of Object.entries(head)) {
      if (/^datum/i.test(v)) col.date = c; else if (/^beginn/i.test(v)) col.start = c; else if (/^ende/i.test(v)) col.end = c;
      else if (/veranstaltungsname/i.test(v)) col.name = c; else if (/terminart/i.test(v)) col.kind = c;
    }
    const { byCode, byName } = knownModules();
    const exams = [], seen = new Set();
    for (const r of rows.slice(headIdx + 1)) {
      const raw = (r[col.name] || "").trim();
      const date = excelDate(r[col.date]);
      if (!raw || !date) continue;
      const codes = raw.match(CODE_RE) || [];
      let hit = null;
      if (codes.length) {
        for (const c of codes) { const k = byCode.get(Tucan.baseCode(c)); if (k) { hit = k; break; } }
        if (!hit) { const cs = codes.find(isCs); if (cs) hit = { code: cs, name: raw.replace(/\s*\([^)]*\)\s*$/, "").trim() }; }
      } else {
        // whole name, each comma part, and the part after the first / before the last comma
        // ("Formale Grundlagen der Informatik I, Automaten, formale Sprachen und Entscheidbarkeit")
        const parts = raw.split(/\s*[,;]\s*/);
        const cands = [raw, ...parts, parts.slice(1).join(", "), parts.slice(0, -1).join(", ")].filter(Boolean);
        for (const c of cands) { const k = byName.get(norm(c)) || (ALIASES[norm(c)] && byCode.get(Tucan.baseCode(ALIASES[norm(c)]))); if (k) { hit = k; break; } }
      }
      if (!hit) continue; // another department
      const e = { code: hit.code, name: hit.name, date, start: excelTime(r[col.start]), end: excelTime(r[col.end]), second: /zweittermin|2\. ?termin/i.test(raw) };
      const key = [Tucan.baseCode(e.code), e.date, e.start].join("|");
      if (seen.has(key)) continue;
      seen.add(key); exams.push(e);
    }
    exams.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    return { term: termOf(sheetName, exams.map((e) => e.date)), modified, source, exams };
  }

  async function parse(buf, source) { return fromSheet(await Xlsx.readFirstSheet(buf), source); }
  const emit = () => listeners.forEach((f) => f());

  async function load() {
    if (/^https?:$/.test(location.protocol)) {
      try {
        const r = await fetch(REPO_FILE, { cache: "no-cache" });
        if (r.ok) { data = await parse(await r.arrayBuffer(), "repo"); emit(); return; }
      } catch (e) { console.warn("exam dates:", e); }
    }
    try { const raw = localStorage.getItem(LS); if (raw) { data = JSON.parse(raw); emit(); } } catch (e) {}
  }
  async function fromFile(file) {
    data = await parse(await file.arrayBuffer(), file.name);
    try { localStorage.setItem(LS, JSON.stringify(data)); } catch (e) {}
    emit();
    return data;
  }
  function forget() { data = null; try { localStorage.removeItem(LS); } catch (e) {} emit(); }

  /* the official exam of a module — only for the semester the schedule covers */
  function forModule(m, termLabel) {
    if (!data || !m || !m.code || termLabel !== data.term) return null;
    const k = Tucan.baseCode(m.code);
    return data.exams.find((e) => Tucan.baseCode(e.code) === k && !e.second) || data.exams.find((e) => Tucan.baseCode(e.code) === k) || null;
  }
  function byCode(code) {
    if (!data || !code) return [];
    const k = Tucan.baseCode(code);
    return data.exams.filter((e) => Tucan.baseCode(e.code) === k);
  }

  /* backup restore: take an uploaded schedule back (a schedule fetched from the repo always wins) */
  function restore(d) {
    if (!d || !Array.isArray(d.exams) || (data && data.source === "repo")) return;
    data = d;
    try { localStorage.setItem(LS, JSON.stringify(data)); } catch (e) {}
    emit();
  }
  return { load, fromFile, forget, restore, forModule, byCode, get: () => data, on: (f) => listeners.push(f), parse };
})();
window.ExamDates = ExamDates;
