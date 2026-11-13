/* ==========================================================================
   Vorschläge — complete the plan with a focus track (js/tracks.js), tuned by a
   short survey. The result is applied as a NEW scenario, so the real plan
   stays untouched. Filling follows the same rule order as Store.fillGaps
   (Engine.structure + Engine.b12Rules), but with real catalog modules.
   ========================================================================== */
"use strict";

(() => {
  const { esc, t, fmt, pill, areaShort, groupName, icon, semLabel, state } = UI;
  const ELECTIVE = ["B111", "B112", "B12"];
  const AREA_RANK = { B111: 0, B112: 1, B12: 2, B2: 3 };
  const tr = (x) => (UI.L() === "de" ? x.de : x.en);
  const survey = () => (state.survey = state.survey || { interests: [], goal: "unsure", style: "mix", english: true, pace: 6, grades: "balanced" });

  /* ---------------- the suggestion ---------------- */
  function suggest(ms0, ans) {
    const S = Store.get();
    const tracks = (ans.interests.length ? ans.interests : ["broad"]).map((id) => TRACKS.find((x) => x.id === id)).filter(Boolean);
    // start from the plan without open elective placeholders — the suggestion replaces them
    const removed = ms0.filter((m) => m.ph && m.status === "open" && ELECTIVE.includes(m.a));
    const ms = ms0.filter((m) => !removed.includes(m)).map((m) => ({ ...m }));
    const used = new Set(ms.map((m) => Tucan.baseCode(m.code || "")).filter(Boolean));
    (ms0.filter((m) => m.choice) || []).forEach((m) => m.choice.forEach((o) => o.code && used.add(Tucan.baseCode(o.code))));

    const rank = new Map(); // code → [score, track]
    tracks.forEach((x, ti) => x.featured.concat(x.b111).forEach((code, i) => {
      const k = Tucan.baseCode(code), v = (ti === 0 ? 100 : 55) - i * 4;
      if (!rank.has(k) || rank.get(k)[0] < v) rank.set(k, [v, x]);
    }));
    const kws = tracks.filter((x) => x.kw).map((x, ti) => ({ re: new RegExp(x.kw, "i"), w: ti === 0 ? 30 : 15, x }));
    const statsOn = GradeStats.count() > 0;

    function score(c) {
      const k = Tucan.baseCode(c.code);
      let s = 0, by = null;
      if (rank.has(k)) { s += rank.get(k)[0]; by = rank.get(k)[1]; }
      tracks.forEach((x, ti) => { if (x.group && c.g === x.group) { s += ti === 0 ? 35 : 18; by = by || x; } });
      for (const kw of kws) if (kw.re.test(c.name)) { s += kw.w; by = by || kw.x; }
      if (c.lang === "en") s += ans.english ? 1 : -1000;
      if (c.a === "B12") {
        if (c.g === "PRAK") s += ans.style === "project" ? 20 : ans.style === "exam" ? -8 : 4;
        if (c.g === "SEM") s += ans.style === "exam" ? 12 : 0;
        if (/projekt/i.test(c.name)) s += ans.goal === "job" ? 10 : 0;
        if (/seminar|aktuelle themen/i.test(c.name)) s += ans.goal === "master" ? 6 : 0;
      }
      const st = statsOn ? GradeStats.summary(c.code) : null;
      if (st) {
        s += Math.log10(st.n) * 4; // popularity: how many people took it
        const w = ans.grades === "grades" ? 1 : ans.grades === "balanced" ? 0.35 : 0;
        if (st.avgPassed != null) s += w * ((2.7 - st.avgPassed) * 25 - st.failRate * 40);
      }
      return { s, by, st };
    }

    const pool = [], seen = new Set();
    for (const c of window.CATALOG || []) {
      const k = Tucan.baseCode(c.code);
      if (used.has(k) || seen.has(k) || c.g === "PIL" || c.g === "SA") continue;
      seen.add(k);
      pool.push({ c, ...score(c) });
    }
    pool.sort((a, b) => b.s - a.s);

    const picks = [];
    const take = (p) => { ms.push({ a: p.c.a, g: p.c.g, code: p.c.code, name: p.c.name, cp: p.c.cp, status: "open" }); picks.push(p); used.add(Tucan.baseCode(p.c.code)); };
    // a Studium Generale placeholder above its minimum (5 CP) can give up CP so the total lands on 180
    const b2ph = ms.filter((m) => m.a === "B2" && m.ph && m.status === "open");
    const b2slack = (r) => (b2ph.length && b2ph.length === ms.filter((m) => m.a === "B2" && Engine.counts(m)).length ? Math.max(0, r("B2").cp - r("B2").min) : 0);
    const totalFree = (r) => 180 - r("TOTAL").cp + b2slack(r);
    const room = (r, a) => {
      const free = (id) => r(id).max - r(id).cp;
      return a === "B12" ? Math.min(free("B12"), free("B1"), totalFree(r)) : Math.min(free(a), free("B11"), free("B1"), totalFree(r));
    };
    // first look for a module that leaves 0 or ≥ 3 CP to fill (no module is smaller than 3 CP), then for any that fits
    const choose = (r, areas, onlyG) => {
      // with several interests, each module already taken for a track makes the next one from it a bit less likely
      const adj = (p) => p.s - (tracks.length > 1 && p.by ? 25 * picks.filter((x) => x.by === p.by && x.c.a === p.c.a).length : 0);
      const fits = (a) => pool.filter((p) => p.c.a === a && !used.has(Tucan.baseCode(p.c.code)) && (!onlyG || p.c.g === onlyG) && p.c.cp <= room(r, a) && p.s > -100).sort((x, y) => adj(y) - adj(x));
      const free = totalFree(r);
      for (const a of areas) { const p = fits(a).find((x) => free - x.c.cp === 0 || free - x.c.cp >= 3); if (p) return p; }
      for (const a of areas) { const p = fits(a)[0]; if (p) return p; }
      return null;
    };
    let stuck = null;
    for (let guard = 0; guard < 40; guard++) {
      const rows = Engine.structure(ms), r = (id) => rows.find((x) => x.id === id);
      const lowG = Engine.b12Rules(ms).rows.find((x) => x.st === "low" && (x.g.id === "SEM" || x.g.id === "PRAK"));
      let areas = null, onlyG = null;
      if (r("B111").st === "low") areas = ["B111"];
      else if (r("B112").st === "low") areas = ["B112"];
      else if (lowG) { areas = ["B12"]; onlyG = lowG.g.id; }
      else if (r("B12").st === "low") areas = ["B12"];
      else if (r("B11").st === "low") areas = r("B112").cp < 30 ? ["B112", "B111"] : ["B111", "B112"];
      else if (r("B1").st === "low") {
        const first = ans.style === "project" && r("B12").cp < 18 ? "B12" : r("B11").cp < 40 ? (r("B112").cp < 30 ? "B112" : "B111") : "B12";
        areas = [first, ...["B112", "B111", "B12"].filter((a) => a !== first)];
      }
      if (!areas) break;
      const cand = choose(r, areas, onlyG);
      if (!cand) { const a = areas[0]; stuck = { area: a, need: Math.max(1, r(a).st === "low" ? r(a).min - r(a).cp : r("B1").min - r("B1").cp) }; break; }
      take(cand);
    }
    const rowsEnd = Engine.structure(ms), rEnd = (id) => rowsEnd.find((x) => x.id === id);
    // shrink the Studium Generale placeholder if the picks used its slack
    let b2adjust = null;
    if (rEnd("TOTAL").cp > 180 && b2ph.length) {
      const ph = b2ph[0], cut = Math.min(rEnd("TOTAL").cp - 180, (+ph.cp || 0) - 1);
      b2adjust = { id: ph.id, cp: (+ph.cp || 0) - cut };
      ph.cp = b2adjust.cp;
    }
    const rowsFinal = Engine.structure(ms), rFin = (id) => rowsFinal.find((x) => x.id === id);
    const b2need = rFin("B2").st === "low" ? rFin("B2").min - rFin("B2").cp : 0;

    /* placement: upcoming normal semesters up to the chosen pace, least-loaded first */
    const now = Engine.semesterOfDate(S.start, new Date());
    const sems = S.sems.map((x) => ({ ...x }));
    const fachOf = (n) => { let f = 0; for (let i = 0; i < n; i++) if ((sems[i] || { t: "n" }).t !== "u") f++; return f; };
    const first = Math.max(now + 1, 3);
    let last = sems.findIndex((_, i) => fachOf(i + 1) >= ans.pace) + 1 || sems.length;
    while (fachOf(sems.length) < ans.pace) { sems.push({ t: "n" }); last = sems.length; }
    if (last < first) { while (sems.length < first) sems.push({ t: "n" }); last = first; }
    const allowed = [];
    for (let n = first; n <= last; n++) if (sems[n - 1].t === "n") allowed.push(n);
    if (!allowed.length) { sems.push({ t: "n" }); allowed.push(sems.length); }
    const load = new Map(allowed.map((n) => [n, ms.filter((m) => +m.sem === n && Engine.counts(m)).reduce((s, m) => s + (+m.cp || 0), 0)]));
    picks.sort((a, b) => AREA_RANK[a.c.a] - AREA_RANK[b.c.a] || b.s - a.s);
    for (const p of picks) {
      const n = allowed.slice().sort((x, y) => load.get(x) - load.get(y) || x - y)[0];
      p.sem = n; load.set(n, load.get(n) + (+p.c.cp || 0));
    }
    const title = tracks.map(tr).join(" + ");
    return { picks, removed: removed.length, b2need, b2adjust, stuck, sems, title, cp: picks.reduce((s, p) => s + p.c.cp, 0),
      ok: !stuck && rowsFinal.every((x) => x.st === "ok" || x.id === "B2" || (x.id === "TOTAL" && b2need)) };
  }

  /* ---------------- view ---------------- */
  const seg = (key, opts) => `<div class="seg" role="group">${opts.map(([v, label]) => `<button type="button" class="${String(survey()[key]) === String(v) ? "on" : ""}" data-act="sugSet" data-k="${key}" data-v="${v}">${label}</button>`).join("")}</div>`;

  function reasons(p) {
    const out = [];
    if (p.by) out.push(t("sug.fits", { track: esc(tr(p.by)) }));
    if (p.c.a === "B12") out.push(esc(groupName("B12", p.c.g)));
    if (p.c.lang === "en") out.push(t("sug.english"));
    if (p.st) out.push(`Ø ${fmt(p.st.avgPassed)} · ${Math.round(p.st.failRate * 100)} % ✗`);
    const ex = ExamDates.byCode(p.c.code).find((e) => !e.second);
    if (ex) out.push(`${t("sug.exam")} ${UI.dateShort(ex.date)}`);
    return out.map((x) => `<span class="chip">${x}</span>`).join("");
  }

  UI.views.suggest = (c) => {
    const ans = survey();
    const r = suggest(c.ms, ans);
    state.sugResult = r;
    const cards = TRACKS.map((x) => {
      const i = ans.interests.indexOf(x.id);
      const n = (window.CATALOG || []).filter((m) => (x.group && m.g === x.group) || x.featured.includes(m.code)).length;
      return `<button type="button" class="track ${i >= 0 ? "on" : ""}" data-act="sugToggle" data-v="${x.id}" aria-pressed="${i >= 0}">
        ${i >= 0 ? `<span class="track-n">${i + 1}</span>` : ""}<b>${esc(tr(x))}</b><span>${esc(UI.L() === "de" ? x.descDe : x.descEn)}</span><small>${t("sug.modules", { n })}</small></button>`;
    }).join("");
    const bySem = new Map();
    r.picks.forEach((p) => { if (!bySem.has(p.sem)) bySem.set(p.sem, []); bySem.get(p.sem).push(p); });
    const result = !r.picks.length && !r.b2need
      ? `<p class="empty">${r.stuck ? t("sug.stuck", { n: r.stuck.need, area: esc(areaShort(r.stuck.area)) }) : t("sug.complete")}</p>`
      : [...bySem.keys()].sort((a, b) => a - b).map((n) => `<div class="sug-sem"><h3>${esc(n <= Store.get().sems.length ? semLabel(n) : t("semN", { n }))}</h3>${bySem.get(n).map((p) => `
          <div class="sug-row a-${p.c.a}"><div class="nm"><b>${esc(p.c.name)}</b><div class="meta"><span>${esc(areaShort(p.c.a))}${p.c.g && p.c.a === "B112" ? " · " + esc(groupName("B112", p.c.g)) : ""}</span><span>${p.c.cp} CP</span><span class="mono">${esc(p.c.code)}</span></div></div>
          <div class="why">${reasons(p)}</div></div>`).join("")}</div>`).join("")
        + (r.b2need ? `<p class="fine">${t("sug.b2", { n: r.b2need })}</p>` : "")
        + (r.stuck ? `<p class="fine">${t("sug.stuck", { n: r.stuck.need, area: esc(areaShort(r.stuck.area)) })}</p>` : "");
    return `
      <div class="page-head"><div><h1>${t("sug.title")}</h1><p class="lede">${t("sug.lede")}</p></div></div>
      <section class="card"><h2>${t("sug.q.interest")}</h2><p class="fine" style="margin-top:-6px">${t("sug.q.interestHelp")}</p><div class="tracks">${cards}</div></section>
      <section class="card sug-q"><h2>${t("sug.personal")}</h2>
        <div class="q"><span>${t("sug.q.goal")}</span>${seg("goal", [["master", t("sug.goal.master")], ["job", t("sug.goal.job")], ["unsure", t("sug.goal.unsure")]])}</div>
        <div class="q"><span>${t("sug.q.style")}</span>${seg("style", [["exam", t("sug.style.exam")], ["mix", t("sug.style.mix")], ["project", t("sug.style.project")]])}</div>
        <div class="q"><span>${t("sug.q.english")}</span>${seg("english", [[true, t("yes")], [false, t("sug.germanOnly")]])}</div>
        <div class="q"><span>${t("sug.q.pace")}</span>${seg("pace", [[6, t("sug.pace", { n: 6 })], [7, t("sug.pace", { n: 7 })], [8, t("sug.pace", { n: 8 })]])}</div>
        ${GradeStats.count() ? `<div class="q"><span>${t("sug.q.grades")}</span>${seg("grades", [["interest", t("sug.grades.interest")], ["balanced", t("sug.grades.balanced")], ["grades", t("sug.grades.grades")]])}</div>` : ""}
      </section>
      <section class="card sug-res"><header class="sug-h"><div><h2>${t("sug.resultTitle", { name: esc(r.title) })}</h2>
          <div class="pills">${pill("info", t("sug.sum", { n: r.picks.length, cp: r.cp }))}${r.removed ? pill("info", t("sug.replaces", { n: r.removed })) : ""}${r.ok ? pill("good", t("sug.ok")) : pill("warn", t("sug.notOk"))}</div></div>
          ${r.picks.length ? `<button class="btn primary" data-act="sugApply">${icon("plus")}${t("sug.apply")}</button>` : ""}</header>
        ${result}
        <p class="fine sug-note">${t("sug.note")}</p></section>`;
  };

  UI.act.sugToggle = (el) => {
    const a = survey().interests, i = a.indexOf(el.dataset.v);
    if (i >= 0) a.splice(i, 1); else a.push(el.dataset.v);
    UI.render();
  };
  UI.act.sugSet = (el) => {
    const v = el.dataset.v;
    survey()[el.dataset.k] = v === "true" ? true : v === "false" ? false : /^\d+$/.test(v) ? +v : v;
    UI.render();
  };
  UI.act.sugApply = () => {
    const r = state.sugResult; if (!r || !r.picks.length) return;
    const name = t("sug.scenName", { name: r.title });
    Store.newScenario(name);
    Store.set((S) => {
      const s = S.scenarios.find((x) => x.id === S.active);
      s.modules = s.modules.filter((m) => !(m.ph && m.status === "open" && ELECTIVE.includes(m.a)));
      for (const p of r.picks) s.modules.push({ id: Store.uid(), attempts: 0, diff: 2, status: "open", a: p.c.a, g: p.c.g, code: p.c.code, name: p.c.name, cp: p.c.cp, sem: p.sem });
      if (r.b2adjust) { const ph = s.modules.find((m) => m.id === r.b2adjust.id); if (ph) ph.cp = r.b2adjust.cp; }
      while (S.sems.length < r.sems.length) S.sems.push({ t: "n" });
    });
    location.hash = "#plan";
    UI.toast(t("sug.applied", { name }), "good");
  };
})();
