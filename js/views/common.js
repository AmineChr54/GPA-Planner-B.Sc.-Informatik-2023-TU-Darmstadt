/* ==========================================================================
   Shared view logic: context, next-step hints, module dialog, catalog picker,
   PDF/text intake. Used by several views.
   ========================================================================== */
"use strict";

(() => {
  const { $, $$, esc, t, fmt, fmtG, pill, tone, areaName, areaShort, groupName, gradeOptions, icon, semInfo, semLabel, state } = UI;

  UI.ctx = () => {
    const ms = Store.mods(), sc = Store.sc();
    const now = Engine.gpa(ms, "done"), proj = Engine.gpa(ms, "proj");
    const best = Engine.gpa(ms, "proj", () => 1.0), worst = Engine.gpa(ms, "proj", () => 4.0);
    const openGraded = ms.filter((m) => m.status === "open" && !m.ungraded);
    const openCp = openGraded.reduce((s, m) => s + (+m.cp || 0), 0);
    const doneCp = ms.filter((m) => m.status === "done").reduce((s, m) => s + (+m.cp || 0), 0);
    const plannedCp = ms.filter(Engine.counts).reduce((s, m) => s + (+m.cp || 0), 0);
    return { ms, sc, now, proj, best, worst, target: +sc.target, openGraded, openCp, doneCp, plannedCp };
  };

  /* what needs attention, most important first: [{tone, html, act}] */
  UI.hints = (c) => {
    const out = [];
    for (const r of Engine.structure(c.ms)) {
      if (r.st === "ok") continue;
      const label = r.id === "TOTAL" ? t("total") : areaShort(r.id);
      if (r.st === "low") out.push({ tone: "bad", icon: "!", html: t("hint.low", { area: label, n: r.min - r.cp }), act: `<button class="btn sm" data-act="fill">${t("btn.fill")}</button>` });
      else out.push({ tone: "warn", icon: "!", html: t("hint.high", { area: label, cp: fmt(r.cp, 0), max: r.max }) });
    }
    const b12 = Engine.b12Rules(c.ms);
    for (const r of b12.rows) if (r.st !== "ok") out.push({ tone: r.st === "low" ? "bad" : "warn", icon: "!", html: t("hint.b12." + r.g.id + "." + r.st, { n: r.n, cp: r.cp }) });
    if (b12.untyped) out.push({ tone: "warn", icon: "?", html: t("hint.b12untyped", { n: b12.untyped }) });
    for (const m of c.ms.filter((m) => m.status === "open" && (m.attempts || 0) >= 2))
      out.push({ tone: "bad", icon: "3", html: t("hint.last", { name: esc(m.name) }) + " " + (Store.get().oral ? t("hint.oralUsed") : t("hint.oralFree")) });
    for (const m of c.ms.filter((m) => m.status === "open" && m.attempts === 1)) {
      const cd = Engine.canDrop(c.ms, m);
      out.push({ tone: "warn", icon: "2", html: t("hint.second", { name: esc(m.name) }) + (cd.ok ? " " + t("hint.canDrop") : "") });
    }
    const ph = c.ms.filter((m) => m.ph && Engine.counts(m)).length;
    if (ph) out.push({ tone: "info", icon: "i", html: t("hint.ph", { n: ph }), act: `<a class="btn sm" href="#plan">${t("nav.plan")}</a>` });
    const choices = c.ms.filter((m) => m.choice && Engine.counts(m)).length;
    if (choices) out.push({ tone: "info", icon: "?", html: t("hint.choices", { n: choices }) });
    const S = Store.get();
    let lastFach = 0;
    c.ms.forEach((m) => { if (m.status === "open" && m.sem) lastFach = Math.max(lastFach, semInfo(+m.sem).fach || 0); });
    if (lastFach > 6) out.push({ tone: "info", icon: "i", html: t("hint.regel", { n: lastFach }) });
    return out;
  };

  /* ---------------- module dialog ---------------- */
  UI.openModule = (id) => { state.modal = { type: "module", id }; UI.renderModuleModal(); };
  UI.renderModuleModal = () => {
    const m = Store.byId(state.modal.id);
    if (!m) return UI.closeModal();
    const S = Store.get();
    const ms = Store.mods();
    const cd = Engine.canDrop(ms, m);
    const groups = GROUPS[m.a];
    const editable = !m.fixed && (!m.code || m.ph || m.abroad);
    const elective = !["A", "C"].includes(m.a);
    const statuses = ["open", "done", "off"].concat(m.status === "dropped" || (cd.ok && elective) ? ["dropped"] : []);
    const sems = S.sems.map((_, i) => i + 1).filter((n) => semInfo(n).t !== "u" && (semInfo(n).t !== "a" || m.abroad));
    const title = m.choice && m.choice.length ? m.choice.map((o) => o.name).join(" / ") : m.name;
    const html = `<header class="dlg-h"><div><div class="eyebrow">${areaName(m.a)}${m.g ? " · " + esc(groupName(m.a, m.g)) : ""}${m.abroad ? " · " + t("abroad.tag") : ""}</div><h2>${esc(title)}</h2></div>
        <button class="icon-btn" data-act="close" aria-label="${t("close")}">${icon("x")}</button></header>
      <div class="form">
        <div class="lbl full">${t("col.status")}<div class="seg" role="group">${statuses.map((s) => `<button type="button" class="${m.status === s ? "on" : ""}" data-act="setStatus" data-id="${m.id}" data-v="${s}">${t("status." + s)}</button>`).join("")}</div></div>
        ${m.ungraded ? `<p class="fine full">${t("ungradedNote")}</p>` : Engine.counts(m) ? `<label>${m.status === "done" ? t("col.grade") : t("f.goalGrade")}<select data-id="${m.id}" data-f="grade">${UI.gradeSelectOptions(m)}</select></label>` : ""}
        <label>${t("f.sem")}<select data-id="${m.id}" data-f="sem"><option value="">${t("unplanned")}</option>${sems.map((n) => `<option value="${n}" ${+m.sem === n ? "selected" : ""}>${esc(semLabel(n))}</option>`).join("")}</select></label>
        ${editable ? `<label class="full">${t("f.name")}<input type="text" value="${esc(m.name)}" data-id="${m.id}" data-f="name"></label>` : ""}
        ${editable && !m.abroad && !m.choice ? `<label>${t("f.code")}<input type="text" value="${esc(m.code || "")}" data-id="${m.id}" data-f="code"></label>` : ""}
        <label>CP<input type="number" min="1" max="30" value="${m.cp}" data-id="${m.id}" data-f="cp" ${m.fixed ? "disabled" : ""}></label>
        ${m.abroad || (editable && elective) ? `<label>${t("f.area")}<select data-id="${m.id}" data-f="a">${["B111", "B112", "B12", "B2"].map((a) => `<option value="${a}" ${m.a === a ? "selected" : ""}>${esc(areaName(a))}</option>`).join("")}</select></label>` : ""}
        ${groups ? `<label>${m.a === "B12" ? t("f.type") : t("f.group")}<select data-id="${m.id}" data-f="g"><option value="">–</option>${groups.map((g) => `<option value="${g.id}" ${m.g === g.id ? "selected" : ""}>${esc(g[UI.L()])}</option>`).join("")}</select></label>` : ""}
        ${m.abroad ? `<p class="fine full">${t("abroad.note")}</p>` : ""}
        ${m.choice ? `<h3>${t("choice.title")}</h3><p class="fine full">${t("choice.help")}</p>
          <div class="opts">${m.choice.length ? m.choice.map((o, i) => `<div class="opt-row"><span class="nm">${esc(o.name)}${o.code ? ` <span class="mono muted">${esc(o.code)}</span>` : ""}</span><span class="muted">${o.cp} CP</span>
              <button class="btn sm" data-act="decide" data-id="${m.id}" data-i="${i}">${t("choice.take")}</button><button class="icon-btn del" data-act="unOption" data-id="${m.id}" data-i="${i}" aria-label="${t("remove")}">${icon("x")}</button></div>`).join("") : `<p class="empty">${t("choice.none")}</p>`}
            <div class="actions" style="margin-top:4px"><button class="btn sm" data-act="optCatalog" data-id="${m.id}">${icon("plus")}${t("choice.fromCatalog")}</button><button class="btn sm ghost" data-act="optCustom" data-id="${m.id}">${t("choice.custom")}</button></div></div>`
          : elective && m.status === "open" ? `<p class="full" style="margin:0"><button class="btn sm ghost" data-act="toChoice" data-id="${m.id}">${t("choice.convert")}</button></p>` : ""}
        ${m.status === "open" && !m.ungraded ? `
          <h3>${t("f.exam")}</h3>
          <label>${t("col.attempt")}<select data-id="${m.id}" data-f="attempts">${[0, 1, 2].map((k) => `<option value="${k}" ${(m.attempts || 0) === k ? "selected" : ""}>${t("att.opt" + k)}</option>`).join("")}</select></label>
          <label>${t("col.date")}<input type="date" value="${esc((UI.examOf(m) || {}).date || "")}" data-id="${m.id}" data-f="examDate">${(() => { const ex = UI.examOf(m); return !ex ? "" : ex.official ? `<span class="fine">${t("ed.official")}${ex.start ? " · " + ex.start + (ex.end ? "–" + ex.end : "") : ""}</span>` : ex.offDate ? `<button class="linklike fine" data-act="edReset" data-id="${m.id}">↺ ${t("ed.resetTo", { d: UI.dateShort(ex.offDate) })}</button>` : ""; })()}</label>
          <h3>${t("f.strategy")}</h3>
          <div class="lbl">${t("opt.diff")}<div class="seg">${[1, 2, 3].map((d) => `<button type="button" class="${(m.diff || 2) === d ? "on" : ""}" data-act="diff" data-id="${m.id}" data-v="${d}">${t("diff." + d)}</button>`).join("")}</div></div>
          <label>${t("opt.floor")}<select data-id="${m.id}" data-f="floor">${gradeOptions(m.floor || 1.0)}</select></label>` : ""}
        ${UI.statsSection(m)}
        ${m.sl ? `<p class="fine full"><b style="color:var(--bad)">*</b> ${t("legend.sl")}</p>` : ""}
      </div>
      <footer class="dlg-f">
        ${cd.ok ? `<button class="btn ghost" data-act="drop" data-id="${m.id}">${t("btn.drop")}</button>` : ""}
        ${m.fixed ? "" : `<button class="btn danger ghost" data-act="del" data-id="${m.id}">${icon("trash")}${t("remove")}</button>`}
        <span class="spacer"></span><button class="btn primary" data-act="close">${t("done")}</button></footer>`;
    UI.modal(html, "has-c a-" + m.a);
  };

  /* ---------------- Notenspiegel (grade distribution from TUCaN screenshots) ---------------- */
  UI.statsSection = (m) => {
    const code = m.code || (m.choice && m.choice[0] && m.choice[0].code);
    const terms = GradeStats.terms(code);
    if (!terms.length) return "";
    if (state.statsFor !== code) { state.statsFor = code; state.statsTerm = ""; }
    const s = GradeStats.summary(code, state.statsTerm || null);
    const max = Math.max(...s.counts);
    const pct = (c) => Math.round((c / s.n) * 100);
    const bars = s.counts.map((c, i) => `<div class="ns-bar ${i === 10 ? "fail" : ""}" style="height:${Math.max(2, (c / max) * 100)}%" title="${esc(t("ns.barTitle", { g: UI.fmtG(GradeStats.G[i]), c, p: pct(c) }))}" aria-label="${esc(t("ns.barTitle", { g: UI.fmtG(GradeStats.G[i]), c, p: pct(c) }))}"></div>`).join("");
    const chips = terms.length > 1 ? `<div class="chips ns-terms"><button type="button" class="chip-btn ${!state.statsTerm ? "on" : ""}" data-act="statsTerm" data-v="">${t("ns.allTerms", { n: terms.length })}</button>${terms.map((x) => `<button type="button" class="chip-btn ${state.statsTerm === x ? "on" : ""}" data-act="statsTerm" data-v="${esc(x)}">${esc(x)}</button>`).join("")}</div>` : "";
    const miss = [s.missing.sick ? t("ns.sick", { n: s.missing.sick }) : "", s.missing.absent ? t("ns.absent", { n: s.missing.absent }) : ""].filter(Boolean).join(" · ");
    return `<div class="full ns"><h3>${t("ns.title")} <span class="fine">${terms.length === 1 ? esc(terms[0]) : ""}</span></h3>${chips}
      <div class="ns-kpis"><span>${t("ns.avgPassed")} <b>${s.avgPassed != null ? fmt(s.avgPassed) : "–"}</b></span><span>${t("ns.fail")} <b class="${s.failRate >= 0.3 ? "bad-txt" : ""}">${pct(s.counts[10])} %</b></span><span>${t("ns.avgAll")} <b>${fmt(s.avgAll, 3)}</b></span><span>${t("ns.n", { n: s.n })}</span></div>
      <div class="ns-bars" role="img" aria-label="${esc(t("ns.aria"))}">${bars}</div>
      <div class="ns-x">${GradeStats.G.map((g) => `<span>${UI.fmtG(g)}</span>`).join("")}</div>
      <details class="ns-table"><summary class="fine">${t("ns.asTable")}</summary><table class="tbl"><tr><th>${t("col.grade")}</th>${GradeStats.G.map((g) => `<th class="num">${UI.fmtG(g)}</th>`).join("")}</tr><tr><td>${t("ns.count")}</td>${s.counts.map((c) => `<td class="num">${c}</td>`).join("")}</tr></table></details>
      <p class="fine">${miss ? miss + " · " : ""}${t("ns.source")}</p></div>`;
  };
  UI.act.statsTerm = (el) => { state.statsTerm = el.dataset.v; UI.renderModuleModal(); };

  /* ---------------- catalog picker (add, or add options to a choice block) ---------------- */
  UI.openCatalog = (area, mode = "add", id = null, sem = null) => {
    state.catalog = { area, g: "", q: "", mode, id, sem };
    state.modal = { type: "catalog" };
    const groups = GROUPS[area] || [];
    const target = id ? Store.byId(id) : null;
    const html = `<header class="dlg-h"><div><div class="eyebrow">${mode === "choice" ? t("cat.titleChoice") : t("cat.title")}</div><h2>${areaName(area)}</h2></div><button class="icon-btn" data-act="close" aria-label="${t("close")}">${icon("x")}</button></header>
      <div class="cat-tools"><input type="search" id="cat-q" placeholder="${t("cat.search")}" autofocus>
        ${groups.length ? `<div class="chips" id="cat-g"><button class="chip-btn on" data-g="">${t("all")}</button>${groups.map((g) => `<button class="chip-btn" data-g="${g.id}">${esc(g[UI.L()])}</button>`).join("")}</div>` : ""}</div>
      <div class="cat-list" id="cat-list"></div>
      <footer class="dlg-f"><span class="fine">${t("cat.note")}</span><span class="spacer"></span>
        ${mode === "choice" ? `<button class="btn" data-act="backToModule" data-id="${id}">${t("cat.backTo", { name: esc(target ? target.name : "") })}</button>` : `<button class="btn" data-act="custom" data-area="${area}"${sem ? ` data-sem="${sem}"` : ""}>${t("btn.custom")}</button>`}</footer>`;
    UI.modal(html, "dlg-catalog has-c a-" + area);
    UI.renderCatalogList();
  };
  UI.renderCatalogList = () => {
    const { area, g, q, mode, id } = state.catalog;
    const el = $("#cat-list"); if (!el) return;
    const qq = q.trim().toLowerCase();
    const inPlan = new Set(Store.mods().filter((m) => m.code).map((m) => Tucan.baseCode(m.code)));
    const target = id ? Store.byId(id) : null;
    const inChoice = new Set((target && target.choice ? target.choice : []).map((o) => Tucan.baseCode(o.code)));
    const list = (window.CATALOG || []).filter((c) => c.a === area && (!g || c.g === g) && (!qq || (c.name + " " + c.code).toLowerCase().includes(qq)));
    el.innerHTML = list.length ? list.map((c) => {
      const has = mode === "choice" ? inChoice.has(Tucan.baseCode(c.code)) : inPlan.has(Tucan.baseCode(c.code));
      return `<div class="cat-item ${has ? "has" : ""}"><div><div class="mname">${esc(c.name)}</div><div class="meta"><span class="mono">${esc(c.code)}</span>${c.g ? `<span class="chip">${esc(groupName(c.a, c.g))}</span>` : ""}<span>${c.lang === "en" ? "EN" : c.lang === "de" ? "DE" : "DE/EN"}</span></div></div>
        ${(() => { const e = typeof ExamDates !== "undefined" ? ExamDates.byCode(c.code).find((x) => !x.second) : null; return e ? `<span class="chip ed-chip" title="${esc(t("ed.chipTitle", { term: ExamDates.get().term }))}">${icon("exams", "ic")}${UI.dateShort(e.date)}</span>` : ""; })()}${(() => { const s = GradeStats.summary(c.code); return s ? `<span class="chip ns-chip" title="${esc(t("ns.chipTitle", { n: s.n, exams: s.exams }))}">Ø ${fmt(s.avgPassed)} · ${Math.round(s.failRate * 100)} % ✗</span>` : ""; })()}<span class="num cat-cp">${c.cp} CP</span>${has ? pill("good", mode === "choice" ? t("cat.inChoice") : t("cat.inPlan")) : `<button class="btn sm" data-act="${mode === "choice" ? "catOption" : "catAdd"}" data-code="${esc(c.code)}">${mode === "choice" ? t("cat.asOption") : t("add")}</button>`}</div>`;
    }).join("") : `<p class="empty" style="padding:16px 18px">${t("cat.none")}</p>`;
  };

  /* ---------------- import intake ---------------- */
  UI.setPending = (res) => {
    if (!res.modules.length) { UI.impStatus(t("imp.nothing"), "bad"); return; }
    state.pendingImport = res;
    if (location.hash !== "#import") location.hash = "#import"; else UI.render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  UI.impStatus = (msg, tn = "") => { $$(".imp-status").forEach((el) => { el.textContent = msg; el.className = "imp-status fine " + tn; }); };
  UI.handlePdf = async (file) => {
    if (!file) return;
    UI.impStatus(t("imp.reading"));
    try { UI.setPending(await Tucan.fromPdf(await file.arrayBuffer())); }
    catch (e) { console.error(e); UI.impStatus(e && e.message && e.message.startsWith("imp.") ? t(e.message) : t("imp.error", { e: e && e.message }), "bad"); }
  };
  UI.dropZone = () => `<label class="drop" tabindex="0">
      <input type="file" class="pdf-file" accept="application/pdf,.pdf" hidden>
      ${icon("file", "ic big")}<span><b>${t("imp.dropTitle")}</b><br><span class="fine">${t("imp.dropSub")}</span></span></label>
    <div class="imp-status fine" role="status"></div>`;
})();
