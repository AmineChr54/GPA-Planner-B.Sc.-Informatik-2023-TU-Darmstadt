/* ==========================================================================
   Übersicht — welcome on first visit, then: grade, goal, next steps, progress.
   ========================================================================== */
"use strict";

(() => {
  const { esc, t, fmt, fmtG, stufe, tone, big, areaShort, icon, LOGO, daysUntil, dateShort, pill } = UI;

  function welcome() {
    const S = Store.get();
    const y0 = new Date().getFullYear();
    const years = []; for (let y = y0 - 7; y <= y0 + 1; y++) years.push(y);
    return `<div class="welcome">
      <div class="logo-xl">${LOGO}</div>
      <div><h1>${t("welcome.title")}</h1><p class="lede">${t("welcome.lede")}</p></div>
      <div class="steps3">
        <div><span class="n">1</span><h3>${t("welcome.s1")}</h3>
          <div class="inline" style="margin-top:8px"><select data-act-change="startTerm" aria-label="${t("term")}"><option value="WS" ${S.start.term === "WS" ? "selected" : ""}>${t("term.WS")}</option><option value="SS" ${S.start.term === "SS" ? "selected" : ""}>${t("term.SS")}</option></select>
          <select data-act-change="startYear" aria-label="${t("year")}">${years.map((y) => `<option ${y === S.start.year ? "selected" : ""}>${y}</option>`).join("")}</select></div></div>
        <div><span class="n">2</span><h3>${t("welcome.s2")}</h3><p>${t("welcome.s2p")}</p></div>
        <div><span class="n">3</span><h3>${t("welcome.s3")}</h3><p>${t("welcome.s3p")}</p></div>
      </div>
      ${UI.dropZone()}
      <div class="welcome-row"><button class="btn lg" data-act="startEmpty">${t("welcome.empty")}</button></div>
      <p class="fine">${icon("shield")} ${t("welcome.privacy")}</p>
    </div>`;
  }

  function scaleBar(points) {
    const pos = (g) => ((Math.min(4.0, Math.max(1.0, g)) - 1) / 3) * 100;
    const zones = [[1.0, 1.6, "z1"], [1.6, 2.6, "z2"], [2.6, 3.6, "z3"], [3.6, 4.0, "z4"]];
    const pts = points.filter((p) => p.v != null);
    return `<div class="scale" role="img" aria-label="${esc(pts.map((p) => p.label + " " + fmt(p.v)).join(", "))}">
      <div class="scale-track">${zones.map(([a, b, c]) => `<div class="zone ${c}" style="left:${pos(a)}%;width:${pos(b) - pos(a)}%" title="${t("stufe." + ["sehrgut", "gut", "befriedigend", "ausreichend"][+c[1] - 1])}"></div>`).join("")}
        ${pts.slice().sort((a, b) => (a.kind === "proj") - (b.kind === "proj")).map((p) => `<div class="marker m-${p.kind}" style="left:${pos(p.v)}%" title="${esc(p.label)} ${fmt(p.v)}"><span class="dot"></span></div>`).join("")}</div>
      <div class="scale-ticks">${[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0].map((g) => `<span style="left:${pos(g)}%">${fmtG(g)}</span>`).join("")}</div>
      <div class="scale-keys">${pts.map((p) => `<span class="key m-${p.kind}"><span class="dot"></span>${esc(p.label)} <b>${fmt(p.v)}</b></span>`).join("")}</div>
    </div>`;
  }

  function goal(c) {
    let cls = "", txt, acts = "";
    if (!c.openGraded.length) txt = t("v.final");
    else if (c.best.official > c.target + 1e-9) { cls = "bad"; txt = t("v.out", { target: fmt(c.target), best: fmt(c.best.official) }); }
    else if (c.worst.official <= c.target + 1e-9) { cls = "good"; txt = t("v.safe", { worst: fmt(c.worst.official) }); acts = `<a class="btn" href="#strategy">${t("v.aimHigher")}</a>`; }
    else {
      const u = Engine.uniformGrade(c.ms, c.target), flat = Engine.flatGradeFor(c.ms, c.target);
      cls = u.g < 1.7 ? "warn" : "good";
      txt = t("v.need", { avg: fmt(u.g), cp: fmt(c.openCp, 0) });
      acts = `<a class="btn primary" href="#strategy">${t("btn.toOpt")}</a><button class="btn" data-act="flat" data-g="${flat ?? 1.0}">${t("btn.flat", { g: fmtG(flat ?? 1.0) })}</button>`;
    }
    return `<section class="card goal-card ${cls}">
      <div class="eyebrow">${t("k.target")}</div>
      <div class="goal-in"><input class="target-in" data-key="target" type="text" inputmode="decimal" value="${fmt(c.target)}" aria-label="${t("k.target")}"><span class="hero-sub">${stufe(c.target)}</span></div>
      <p>${txt}</p>${acts ? `<div class="actions" style="margin-top:2px">${acts}</div>` : ""}
    </section>`;
  }

  function areaBar(id, c) {
    const n = Engine.nodeById(id);
    const done = c.ms.filter((m) => m.a === id && m.status === "done").reduce((s, m) => s + (+m.cp || 0), 0);
    const plan = c.ms.filter((m) => m.a === id && Engine.counts(m)).reduce((s, m) => s + (+m.cp || 0), 0);
    const scale = Math.max(n.max || n.min, plan, 1);
    const w = (x) => (Math.min(x, scale) / scale) * 100;
    const ok = plan >= n.min && (n.max == null || plan <= n.max);
    return `<div class="abar a-${id}"><div class="abar-h"><span><span class="swatch"></span>${areaShort(id)}</span>
        <span class="num">${fmt(done, 0)} / ${fmt(plan, 0)} CP <small>(${n.min}${n.max !== n.min ? "–" + n.max : ""})</small> ${ok ? "" : pill(plan < n.min ? "bad" : "warn", plan < n.min ? t("tooFew") : t("tooMany"))}</span></div>
      <div class="abar-t"><div class="abar-p" style="width:${w(plan)}%"></div><div class="abar-d" style="width:${w(done)}%"></div><div class="abar-min" style="left:calc(${w(n.min)}% - 1px)"></div></div></div>`;
  }

  UI.views.overview = (c) => {
    const S = Store.get();
    if (!S.onboarded) return welcome();
    const hs = UI.hints(c);
    const exams = c.ms.filter((m) => m.status === "open").map((m) => ({ m, ex: UI.examOf(m) })).filter((x) => x.ex && daysUntil(x.ex.date) >= 0)
      .sort((a, b) => (a.ex.date + a.ex.start).localeCompare(b.ex.date + b.ex.start)).slice(0, 4);
    const todo = exams.map(({ m, ex }) => {
      const d = daysUntil(ex.date);
      return `<li class="exam ${d <= 7 ? "bad" : ""}"><span class="tic">${dateShort(ex.date).replace(" ", "<br>").slice(0, 12)}</span><span class="txt"><b>${esc(m.name)}</b> · ${d === 0 ? t("today") : d === 1 ? t("tomorrow") : t("inDays", { n: d })}${(m.attempts || 0) >= 2 ? " " + pill("bad", t("att.last")) : ""}</span></li>`;
    }).concat(hs.slice(0, 6).map((h) => `<li class="${h.tone}"><span class="tic">${h.icon}</span><span class="txt">${h.html}</span>${h.act || ""}</li>`));
    const T = S.tucan;
    return `
      <div class="page-head"><div><h1>${t("overview.title")}</h1><p class="lede">${t("overview.lede")}</p></div></div>
      ${S.migrated ? `<div class="banner info">${t("migrated")}</div>` : ""}
      <div class="ov-top ${S.goalOn ? "" : "solo"}">
        <section class="card hero">
          <div class="eyebrow">${t("k.proj")} <span class="help" title="${esc(t("hero.help"))}">?</span></div>
          <div class="hero-row">
            <div><div class="hero-num">${big(c.proj.official)}</div><div class="hero-sub">${stufe(c.proj.official)} · ${t("hero.cp", { done: fmt(c.doneCp, 0), planned: fmt(c.plannedCp, 0) })}</div></div>
            <div class="mini-stats"><div><span class="k">${t("k.now")}</span><span class="v">${big(c.now.official)}</span></div><div><span class="k">${t("k.best")}</span><span class="v">${big(c.best.official)}</span></div></div>
          </div>
          ${scaleBar([{ kind: "now", label: t("k.now"), v: c.now.official }, { kind: "proj", label: t("k.plan"), v: c.proj.official }, ...(S.goalOn ? [{ kind: "target", label: t("k.target"), v: c.target }] : []), { kind: "best", label: t("k.best"), v: c.best.official }])}
          ${T ? `<div class="hero-note">${t("tucan.line", { tucan: fmt(T.gpa, 3), ours: fmt(c.now.official) })} <a href="#rules">${t("tucan.why")}</a></div>` : ""}
        </section>
        ${S.goalOn ? goal(c) : ""}
      </div>
      <div class="grid2">
        <section class="card"><h2>${t("next.title")}</h2>${todo.length ? `<ul class="todo">${todo.join("")}</ul>` : `<p class="empty">${t("hints.none")}</p>`}</section>
        <section class="card"><h2>${t("progress.title")}</h2><div class="bars">${UI.AREA_ORDER.map((id) => areaBar(id, c)).join("")}</div><p class="fine" style="margin:12px 0 0">${t("progress.legend")}</p></section>
      </div>`;
  };

  UI.act.startEmpty = () => { Store.set((S) => { S.onboarded = true; S.createdAt = S.createdAt || new Date().toISOString(); }); location.hash = "#plan"; };
})();
