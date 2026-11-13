/* ==========================================================================
   Ziel & Strategie — goal, effort-aware optimizer, over-shooting, deselection,
   and scenarios side by side.
   ========================================================================== */
"use strict";

(() => {
  const { esc, t, fmt, fmtG, delta, pill, tone, big, areaShort, groupName, gradeOptions, icon, state } = UI;

  function optimizer(c) {
    const S = Store.get();
    S.ui = S.ui || {};
    const extraG = S.ui.extraGrade || 1.7;
    if (!c.openGraded.length) return `<section class="card"><p class="empty">${t("opt.nothing")}</p></section>`;
    if (c.worst.official <= c.target + 1e-9) {
      const lo = Math.ceil(c.best.official * 20) / 20, hi = c.worst.official, opts = [];
      for (let g = lo; g < hi - 1e-9 && opts.length < 8; g = Math.round((g + 0.05) * 100) / 100) opts.push(g);
      if (!opts.length || opts[0] - c.best.official > 0.005) opts.unshift(c.best.official);
      return `<section class="card goal-card good"><p>${t("opt.safe", { target: fmt(c.target), worst: fmt(c.worst.official), best: fmt(c.best.official) })}</p>
        <div class="actions">${opts.map((g) => `<button class="btn" data-act="setTarget" data-v="${g}">${t("k.target")} ${fmt(g)}</button>`).join("")}</div></section>`;
    }
    const r = Engine.optimize(c.ms, c.target);
    const flat = Engine.flatGradeFor(c.ms, c.target);
    const flatE = flat != null ? Engine.flatEffort(c.ms, flat) : null;
    const saving = flatE && r.reached ? 1 - r.effort / flatE : null;
    window.__opt = r;
    const rows = c.openGraded.slice().sort((a, b) => (r.grades.get(a) - r.grades.get(b)) || (+b.cp - +a.cp));
    const extra = [["B111", 5], ["B112", 6], ["B12", 6], ["B2", 3]].map(([a, cp]) => ({ a, cp, ...Engine.overshoot(c.ms, a, cp, extraG) })).filter((x) => x.delta > 0.0005);
    const cands = c.ms.filter((m) => m.status === "open" && m.a !== "A" && m.a !== "C" && ((m.attempts || 0) >= 1 || (+m.grade >= 3.0 && !m.ungraded)));
    return `
      <section class="card">${r.reached
        ? `<div class="opt-sum"><div class="big2">${big(r.official)}</div><div>${t("opt.reached", { target: fmt(c.target), res: fmt(r.official) })}${saving != null && saving > 0.005 ? `<br><span class="fine">${t("opt.saving", { p: Math.round(saving * 100), flat: fmtG(flat) })}</span>` : ""}</div>
            <div class="actions"><button class="btn primary" data-act="applyOpt">${t("opt.apply")}</button><button class="btn" data-act="optScenario">${t("opt.asScenario")}</button></div></div>`
        : `<div class="opt-sum"><div class="big2">${big(r.official)}</div><div>${t("opt.notReached", { target: fmt(c.target), res: fmt(r.official) })}</div></div>`}</section>
      <section class="card flush"><header class="card-h"><h2>${t("opt.plan")}</h2><span class="sub">${t("opt.planSub")}</span></header>
        <div class="tscroll"><table class="tbl opt"><thead><tr><th>${t("col.module")}</th><th class="num">CP</th><th>${t("opt.diff")}</th><th>${t("opt.floor")}</th><th>${t("opt.current")}</th><th>${t("opt.rec")}</th></tr></thead><tbody>
        ${rows.map((m) => {
          const g = r.grades.get(m), cur = +m.grade, counted = r.marks.get(m);
          const arrow = Math.abs(g - cur) < 1e-9 ? "" : g < cur ? `<span class="up">▲</span>` : `<span class="down">▼</span>`;
          return `<tr class="${counted === 0 ? "capped" : ""}"><td class="cell-name" style="border-left:4px solid var(--a-${m.a})"><button class="linklike mname" data-act="open" data-id="${m.id}">${esc(m.name)}</button><div class="meta"><span>${areaShort(m.a)}</span>${m.g ? `<span class="chip">${esc(groupName(m.a, m.g))}</span>` : ""}${counted === 0 ? `<span>${t("droppedByCap")}</span>` : ""}</div></td>
            <td class="num">${fmt(+m.cp, 0)}</td>
            <td><div class="seg sm">${[1, 2, 3].map((d) => `<button class="${(m.diff || 2) === d ? "on" : ""}" data-act="diff" data-id="${m.id}" data-v="${d}">${t("diff." + d)}</button>`).join("")}</div></td>
            <td><select data-id="${m.id}" data-f="floor" data-key="fl-${m.id}" aria-label="${t("opt.floor")}">${gradeOptions(m.floor || 1.0)}</select></td>
            <td><span class="tone-${tone(cur)}">${fmtG(cur)}</span></td>
            <td><b class="tone-${tone(g)}">${fmtG(g)}</b> ${arrow}</td></tr>`;
        }).join("")}</tbody></table></div>
        <details class="pad" style="padding:10px 16px"><summary class="fine">${t("opt.how")}</summary><p class="fine">${t("opt.method")}</p></details>
      </section>
      <div class="grid2">
        <section class="card"><h2>${t("opt.over")}</h2><p class="fine" style="margin-top:-6px">${t("opt.overSub")}</p>
          <label class="inline">${t("opt.extraGrade")} <select data-act-change="extraGrade" data-key="xg">${gradeOptions(extraG)}</select></label>
          ${extra.length ? `<ul class="hints" style="margin-top:10px">${extra.map((x) => `<li class="hint good"><span class="hdot"></span><span class="htxt">${t("opt.overRow", { cp: x.cp, area: areaShort(x.a), g: fmtG(extraG), d: delta(x.delta), loser: x.loser ? esc(x.loser.name) + " (" + fmtG(+x.loser.grade) + ")" : "–" })}</span></li>`).join("")}</ul>` : `<p class="empty" style="margin-top:10px">${t("opt.overNone", { g: fmtG(extraG) })}</p>`}
        </section>
        <section class="card"><h2>${t("opt.drop")}</h2><p class="fine" style="margin-top:-6px">${t("opt.dropSub")}</p>
          ${cands.length ? `<ul class="hints">${cands.map((m) => { const cd = Engine.canDrop(c.ms, m); return `<li class="hint ${cd.ok ? "warn" : "info"}"><span class="hdot"></span><span class="htxt"><b>${esc(m.name)}</b> — ${(m.attempts || 0) >= 1 ? t("opt.dropAtt", { n: m.attempts }) : t("opt.dropWeak", { g: fmtG(+m.grade) })} ${cd.ok ? (cd.unlimited ? t("opt.drop6") : t("opt.drop5")) : t("opt.dropUsed")}</span>${cd.ok ? `<button class="btn sm" data-act="drop" data-id="${m.id}">${t("btn.drop")}</button>` : ""}</li>`; }).join("")}</ul>` : `<p class="empty">${t("opt.dropNone")}</p>`}
        </section>
      </div>`;
  }

  function scenarios() {
    const S = Store.get();
    const data = S.scenarios.map((s) => {
      const ms = s.modules;
      const proj = Engine.gpa(ms, "proj"), best = Engine.gpa(ms, "proj", () => 1.0), worst = Engine.gpa(ms, "proj", () => 4.0);
      const openCp = ms.filter((m) => m.status === "open" && !m.ungraded).reduce((a, m) => a + (+m.cp || 0), 0);
      const total = Engine.structure(ms).find((r) => r.id === "TOTAL").cp;
      const u = openCp ? Engine.uniformGrade(ms, +s.target) : null;
      return { s, proj, best, worst, openCp, total, u };
    });
    const ids = new Map();
    S.scenarios.forEach((s, i) => s.modules.forEach((m) => { if (!ids.has(m.id)) ids.set(m.id, { name: m.name, a: m.a, vals: [] }); ids.get(m.id).vals[i] = m; }));
    const diffs = [...ids.values()].filter((x) => new Set(S.scenarios.map((_, i) => { const m = x.vals[i]; return m ? (Engine.counts(m) ? (m.ungraded ? "b" : m.grade) + "@" + (m.sem || "") : m.status) : "∅"; })).size > 1);
    const cell = (m) => (!m ? `<span class="muted">—</span>` : !Engine.counts(m) ? `<span class="muted">${t("status." + m.status)}</span>` : (m.ungraded ? "✓" : `<span class="tone-${tone(+m.grade)}">${fmtG(+m.grade)}</span>`) + (m.sem ? ` <span class="muted fine">${t("semShortN", { n: UI.semInfo(+m.sem).fach || "U" })}</span>` : ""));
    return `
      <div class="head-actions"><button class="btn" data-act="scenNew" data-shift="0">${icon("plus")}${t("scen.copy")}</button><button class="btn" data-act="scenNew" data-shift="-1">${t("scen.opt")}</button><button class="btn" data-act="scenNew" data-shift="1">${t("scen.pess")}</button></div>
      <section class="card flush"><div class="tscroll"><table class="tbl cmp-t"><thead><tr><th></th>${data.map((d) => `<th class="${d.s.id === S.active ? "act" : ""}">
          <div class="sc-name">${esc(d.s.name)}${d.s.id === S.active ? " " + pill("good", t("scen.isActive")) : ""}</div>
          <div class="sc-acts">${d.s.id !== S.active ? `<button class="btn sm" data-act="scenAct" data-id="${d.s.id}">${t("scen.activate")}</button>` : ""}
          <button class="icon-btn" data-act="scenRen" data-id="${d.s.id}" title="${t("scen.rename")}" aria-label="${t("scen.rename")}">${icon("M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z")}</button>
          ${S.scenarios.length > 1 ? `<button class="icon-btn del" data-act="scenDel" data-id="${d.s.id}" aria-label="${t("remove")}">${icon("x")}</button>` : ""}</div></th>`).join("")}</tr></thead>
        <tbody>
          <tr><td>${t("k.proj")}</td>${data.map((d) => `<td class="num big-cell">${big(d.proj.official)}</td>`).join("")}</tr>
          <tr><td>${t("k.target")}</td>${data.map((d) => `<td class="num">${fmt(+d.s.target)}</td>`).join("")}</tr>
          <tr><td>${t("scen.need")}</td>${data.map((d) => `<td class="num">${!d.u ? "–" : d.u.impossible ? pill("bad", t("scen.impossible")) : d.u.trivial ? pill("good", t("scen.safe")) : fmt(d.u.g)}</td>`).join("")}</tr>
          <tr><td>${t("k.best")} / ${t("k.worst")}</td>${data.map((d) => `<td class="num">${fmt(d.best.official)} / ${fmt(d.worst.official)}</td>`).join("")}</tr>
          <tr><td>${t("scen.cp")}</td>${data.map((d) => `<td class="num">${fmt(d.total, 0)} ${d.total === 180 ? "" : pill(d.total < 180 ? "bad" : "warn", d.total < 180 ? t("tooFew") : t("tooMany"))}</td>`).join("")}</tr>
        </tbody></table></div></section>
      ${S.scenarios.length > 1 ? `<section class="card flush"><header class="card-h"><h2>${t("scen.diff")}</h2><span class="sub">${t("scen.diffSub", { n: diffs.length })}</span></header>
        ${diffs.length ? `<div class="tscroll"><table class="tbl"><thead><tr><th>${t("col.module")}</th>${S.scenarios.map((s) => `<th class="num">${esc(s.name)}</th>`).join("")}</tr></thead><tbody>
          ${diffs.map((x) => `<tr><td style="border-left:4px solid var(--a-${x.a})">${esc(x.name)}</td>${S.scenarios.map((_, i) => `<td class="num">${cell(x.vals[i])}</td>`).join("")}</tr>`).join("")}
        </tbody></table></div>` : `<p class="empty" style="padding:14px 16px">${t("scen.noDiff")}</p>`}</section>` : `<section class="card"><p class="empty">${t("scen.onlyOne")}</p></section>`}`;
  }

  UI.views.strategy = (c) => `
    <div class="page-head"><div><h1>${t("strategy.title")}</h1><p class="lede">${t("strategy.lede")}</p></div>
      <div class="head-actions"><label class="inline">${t("k.target")} <input class="target-in sm" data-key="target2" type="text" inputmode="decimal" value="${fmt(c.target)}"></label>
        <div class="seg" role="tablist"><button class="${state.stratTab === "opt" ? "on" : ""}" data-act="stratTab" data-v="opt">${t("nav.optimizer")}</button><button class="${state.stratTab === "scen" ? "on" : ""}" data-act="stratTab" data-v="scen">${t("nav.scenarios")}${Store.get().scenarios.length > 1 ? " (" + Store.get().scenarios.length + ")" : ""}</button></div></div></div>
    ${state.stratTab === "scen" ? scenarios() : optimizer(c)}`;

  UI.act.stratTab = (el) => { state.stratTab = el.dataset.v; UI.render(); };
  UI.act.applyOpt = () => { const r = window.__opt; if (!r) return; Store.set(() => { for (const [m, g] of r.grades) { const x = Store.byId(m.id); if (x) { x.grade = g; x.gradeSet = true; } } }); UI.toast(t("opt.applied"), "good"); };
  UI.act.optScenario = () => {
    const r = window.__opt; if (!r) return;
    const grades = new Map([...r.grades].map(([m, g]) => [m.id, g]));
    Store.newScenario(t("opt.scenName", { t: fmt(Store.sc().target) }));
    Store.set(() => Store.mods().forEach((m) => { if (grades.has(m.id)) { m.grade = grades.get(m.id); m.gradeSet = true; } }));
    state.stratTab = "scen"; UI.toast(t("opt.saved"), "good");
  };
  UI.act.scenNew = (el) => { const sh = +el.dataset.shift; const base = Store.sc().name; state.stratTab = "scen"; Store.newScenario(sh < 0 ? t("scen.optName") : sh > 0 ? t("scen.pessName") : t("scen.copyName", { name: base }), sh); };
  UI.act.scenAct = (el) => Store.activate(el.dataset.id);
  UI.act.scenRen = (el) => { const s = Store.get().scenarios.find((x) => x.id === el.dataset.id); const n = prompt(t("scen.renamePrompt"), s.name); if (n && n.trim()) Store.renameScenario(s.id, n.trim()); };
  UI.act.scenDel = (el) => { const s = Store.get().scenarios.find((x) => x.id === el.dataset.id); if (confirm(t("scen.delConfirm", { name: s.name }))) Store.deleteScenario(s.id); };
})();
