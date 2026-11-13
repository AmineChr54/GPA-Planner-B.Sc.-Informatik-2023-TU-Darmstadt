/* ==========================================================================
   App shell — top bar, router, global events, service worker.
   ========================================================================== */
"use strict";

(() => {
  const { $, $$, t, fmt, fmtG, icon, state } = UI;
  Store.load();
  const S0 = Store.get();
  if (S0.theme === "auto") S0.theme = "system";
  if (!S0.createdAt) S0.createdAt = new Date().toISOString();

  const TABS = [["overview", "overview"], ["plan", "plan"], ["suggest", "spark"], ["strategy", "strategy"], ["exams", "exams"]];
  const ALIAS = { modules: "plan", timeline: "plan", optimizer: "strategy", scenarios: "strategy" };
  const route = () => { let v = (location.hash || "#overview").slice(1); v = ALIAS[v] || v; return UI.views[v] ? v : "overview"; };
  let view = route();
  if (location.hash.slice(1) === "scenarios") state.stratTab = "scen";
  if (location.hash.slice(1) === "modules") state.planMode = "list";

  function renderShell() {
    const S = Store.get();
    document.documentElement.lang = S.lang;
    document.documentElement.dataset.theme = S.theme === "system" ? "system" : S.theme;
    $("#tabs").innerHTML = TABS.map(([id, ic]) => `<a href="#${id}" class="tab${view === id ? " active" : ""}" ${view === id ? 'aria-current="page"' : ""}>${icon(ic)}<span>${t("nav." + id)}</span></a>`).join("");
    $("#brand-sub").textContent = t("app.sub");
    const sel = $("#scen-select");
    sel.hidden = S.scenarios.length < 2;
    sel.innerHTML = S.scenarios.map((s) => `<option value="${s.id}" ${s.id === S.active ? "selected" : ""}>${UI.esc(s.name)}</option>`).join("");
    sel.setAttribute("aria-label", t("scen.active"));
    $("#undo-btn").disabled = !Store.canUndo();
    $("#undo-btn").title = t("undo") + " (Ctrl+Z)";
    // light/dark switch right in the bar; "System" stays in the ⚙ menu
    const dark = S.theme === "dark" || (S.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    $("#theme-btn").innerHTML = icon(dark ? "sun" : "moon");
    $("#theme-btn").title = t(dark ? "theme.toLight" : "theme.toDark");
    $("#theme-btn").setAttribute("aria-label", $("#theme-btn").title);
    $("#theme-btn").dataset.dark = dark ? "1" : "";
    $("#menu-btn").title = t("menu.title");
    $("#menu-btn").setAttribute("aria-label", t("menu.title"));
    $("#foot").innerHTML = `<span>${t("foot.unofficial")}</span><span>${t("foot.local")}</span><a href="#privacy">${t("privacy.title")}</a><a href="#rules">${t("nav.rules")}</a><span>${t("foot.credit")}</span>`;
  }

  function render() {
    const a = document.activeElement;
    const key = a && a.dataset && (a.dataset.key || null);
    renderShell();
    const c = UI.ctx();
    const S = Store.get();
    $("#view").innerHTML = (S.onboarded ? UI.backupBanner() : "") + UI.views[view](c);
    $("#view").dataset.view = view;
    if (UI.after[view]) UI.after[view]();
    if (key) { const el = $(`[data-key="${CSS.escape(key)}"]`); if (el) el.focus(); }
    document.title = (S.onboarded ? t("nav." + view) + " · " : "") + t("app.name");
  }
  UI.render = render;

  /* ---------------- actions shared across views ---------------- */
  const setTarget = (v) => {
    const x = Math.max(1, Math.min(4, parseFloat(String(v).replace(",", "."))));
    if (!isFinite(x)) { render(); return; }
    Store.set(() => { Store.sc().target = Math.round(x * 100) / 100; });
  };
  const doDrop = (id) => {
    const m = Store.byId(id), cd = Engine.canDrop(Store.mods(), m);
    if (!cd.ok) return UI.toast(t("drop.no." + cd.why), "bad");
    if (!confirm(t(cd.unlimited ? "drop.confirm6" : "drop.confirm5", { name: m.name }))) return;
    Store.updateModule(id, { status: "dropped", sem: undefined });
    UI.toast(t("drop.done", { name: m.name }));
  };
  Object.assign(UI.act, {
    close: () => UI.closeModal(),
    toggleTheme: (el) => Store.set((S) => { S.theme = el.dataset.dark ? "light" : "dark"; }),
    open: (el) => UI.openModule(el.dataset.id),
    setTarget: (el) => setTarget(el.dataset.v),
    fill: () => { Store.fillGaps({ B111: t("ph.B111"), B112: t("ph.B112"), B12: t("ph.B12"), B2: t("ph.B2") }); UI.toast(t("filled")); },
    flat: (el) => { const g = +el.dataset.g; Store.set(() => Store.mods().forEach((m) => { if (m.status === "open" && !m.ungraded) { m.grade = g; m.gradeSet = true; } })); UI.toast(t("flatDone", { g: fmtG(g) })); },
    catalog: (el) => UI.openCatalog(el.dataset.area, "add", null, el.dataset.sem ? +el.dataset.sem : null),
    custom: (el) => {
      const a = el.dataset.area;
      const m = Store.addModule({ a, g: a === "B112" ? "KI" : a === "B12" ? "SEM" : null, code: "", name: t("newModule"), cp: a === "B12" ? 3 : 5, ...(el.dataset.sem ? { sem: +el.dataset.sem } : {}) });
      UI.openModule(m.id);
    },
    catAdd: (el) => {
      const c = CATALOG.find((x) => x.code === el.dataset.code && x.a === state.catalog.area); if (!c) return;
      Store.addModule({ a: c.a, g: c.g, code: c.code, name: c.name, cp: c.cp, ...(state.catalog.sem ? { sem: state.catalog.sem } : {}) });
      UI.toast(t("added", { name: c.name }), "good"); UI.renderCatalogList();
    },
    catOption: (el) => {
      const c = CATALOG.find((x) => x.code === el.dataset.code && x.a === state.catalog.area), m = Store.byId(state.catalog.id); if (!c || !m) return;
      const choice = (m.choice || []).concat([{ code: c.code, name: c.name, cp: c.cp, g: c.g }]);
      Store.updateModule(m.id, { choice, cp: choice.length === 1 ? c.cp : m.cp, g: m.a === "B112" || m.a === "B12" ? (c.g || m.g) : m.g });
      UI.toast(t("choice.added", { name: c.name }), "good");
    },
    optCatalog: (el) => { const m = Store.byId(el.dataset.id); UI.openCatalog(m.a, "choice", m.id); },
    backToModule: (el) => UI.openModule(el.dataset.id),
    optCustom: (el) => { const m = Store.byId(el.dataset.id); const n = prompt(t("choice.customPrompt")); if (n && n.trim()) Store.updateModule(m.id, { choice: (m.choice || []).concat([{ code: "", name: n.trim(), cp: +m.cp }]) }); },
    unOption: (el) => { const m = Store.byId(el.dataset.id); const ch = m.choice.slice(); ch.splice(+el.dataset.i, 1); Store.updateModule(m.id, { choice: ch }); },
    decide: (el) => {
      const m = Store.byId(el.dataset.id), o = m.choice[+el.dataset.i];
      Store.updateModule(m.id, { code: o.code, name: o.name, cp: o.cp, g: o.g || m.g, choice: undefined });
      UI.toast(t("choice.decided", { name: o.name }), "good");
    },
    toChoice: (el) => { const m = Store.byId(el.dataset.id); Store.updateModule(m.id, { choice: m.ph ? [] : [{ code: m.code || "", name: m.name, cp: +m.cp, g: m.g }], name: t("choice.blockName", { area: UI.areaShort(m.a) }) }); },
    setStatus: (el) => {
      const id = el.dataset.id, v = el.dataset.v;
      if (v === "dropped") return doDrop(id);
      Store.updateModule(id, { status: v });
    },
    del: (el) => { const m = Store.byId(el.dataset.id); if (m && confirm(t("delConfirm", { name: m.name }))) { Store.removeModule(m.id); UI.closeModal(); } },
    diff: (el) => Store.updateModule(el.dataset.id, { diff: +el.dataset.v }),
    drop: (el) => doDrop(el.dataset.id),
    undrop: (el) => Store.updateModule(el.dataset.id, { status: "open" }),
    parseText: () => { const txt = $("#paste").value; if (!txt.trim()) return; try { UI.setPending(Tucan.fromText(txt)); } catch (e) { UI.impStatus(t(e.message) || e.message, "bad"); } },
    impCancel: () => { state.pendingImport = null; render(); },
    impApply: () => {
      const rep = Store.applyImport(state.pendingImport, { all: $("#imp-all").checked, dropPh: $("#imp-ph").checked });
      state.pendingImport = null;
      Store.set((S) => { S.onboarded = true; S.migrated = false; });
      UI.maybePersist();
      UI.toast(t("imp.done", rep), "good");
      location.hash = "#plan";
    },
  });
  Object.assign(UI.change, {
    startTerm: (el) => Store.set((S) => { S.start.term = el.value; S.startSet = true; }),
    startYear: (el) => Store.set((S) => { S.start.year = +el.value; S.startSet = true; }),
    extraGrade: (el) => Store.set((S) => { S.ui = S.ui || {}; S.ui.extraGrade = +el.value; }),
    oral: (el) => Store.set((S) => { S.oral = el.checked ? { module: "" } : null; }),
    oralWhich: (el) => Store.set((S) => { if (S.oral) S.oral.module = el.value; }),
  });

  /* ---------------- events ---------------- */
  document.addEventListener("click", (e) => {
    const menu = $("#menu");
    if (!menu.hidden && !menu.contains(e.target) && !e.target.closest("[data-act=menu],[data-act=semMenu],[data-act=exportMenu]")) UI.closeMenu();
    if (e.target.closest("#menu a")) UI.closeMenu();
    const el = e.target.closest("[data-act]");
    if (el && !el.disabled && UI.act[el.dataset.act]) { e.preventDefault(); UI.act[el.dataset.act](el, e); return; }
    const box = e.target.closest(".box[data-id], .bchip[data-id]");
    if (box) { UI.openModule(box.dataset.id); return; }
    const chip = e.target.closest("#cat-g .chip-btn");
    if (chip) { $$("#cat-g .chip-btn").forEach((b) => b.classList.toggle("on", b === chip)); state.catalog.g = chip.dataset.g; UI.renderCatalogList(); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if (!$("#menu").hidden) UI.closeMenu(); else if (!$("#modal").hidden) UI.closeModal(); }
    if ((e.key === "Enter" || e.key === " ") && e.target.matches(".box[data-id], .bchip[data-id]")) { e.preventDefault(); UI.openModule(e.target.dataset.id); }
    if (e.key === "Enter" && e.target.classList.contains("target-in")) e.target.blur();
    const typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !typing) { e.preventDefault(); if (Store.undoLast()) UI.toast(t("undone")); }
  });
  document.addEventListener("input", (e) => { if (e.target.id === "cat-q") { state.catalog.q = e.target.value; UI.renderCatalogList(); } });
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (el.classList.contains("target-in")) return setTarget(el.value);
    if (el.dataset.actChange && UI.change[el.dataset.actChange]) return UI.change[el.dataset.actChange](el);
    if (el.classList.contains("pdf-file")) return UI.handlePdf(el.files[0]);
    if (el.id === "json-file" || el.id === "json-file-menu") { if (el.files[0]) UI.importJsonFile(el.files[0]); return; }
    if (el.id === "scen-select") return Store.activate(el.value);
    const id = el.dataset.id, f = el.dataset.f;
    if (!id || !f) return;
    let v = el.value;
    const patch = {};
    if (f === "grade" && v === "auto") { Store.updateModule(id, { gradeSet: false }); return; }
    if (f === "grade" || f === "floor" || f === "attempts") v = +v;
    else if (f === "cp") v = Math.max(1, Math.min(30, Math.round(+v || 1)));
    else if (f === "sem") v = v ? +v : undefined;
    else if (f === "g") v = v || null;
    else if (f === "name") v = v.trim() || t("newModule");
    else if (f === "a") patch.g = v === "B112" ? "KI" : v === "B12" ? "SEM" : null;
    if (f === "status" && v === "dropped") { const cd = Engine.canDrop(Store.mods(), Store.byId(id)); if (!cd.ok) { UI.toast(t("drop.no." + cd.why), "bad"); render(); return; } }
    patch[f] = v;
    Store.updateModule(id, patch);
  });
  // PDF drag & drop onto any drop zone
  document.addEventListener("dragover", (e) => { const d = e.target.closest && e.target.closest(".drop"); if (d) { e.preventDefault(); d.classList.add("over"); } });
  document.addEventListener("dragleave", (e) => { const d = e.target.closest && e.target.closest(".drop"); if (d) d.classList.remove("over"); });
  document.addEventListener("drop", (e) => { const d = e.target.closest && e.target.closest(".drop"); if (!d) return; e.preventDefault(); d.classList.remove("over"); const f = e.dataTransfer.files[0]; if (f) UI.handlePdf(f); });

  $("#undo-btn").addEventListener("click", () => { if (Store.undoLast()) UI.toast(t("undone")); });
  window.addEventListener("hashchange", () => { view = route(); UI.closeModal(); UI.closeMenu(); render(); window.scrollTo(0, 0); });
  window.addEventListener("resize", UI.closeMenu);
  window.addEventListener("scroll", () => { if (!$("#menu").hidden) UI.closeMenu(); }, { passive: true });

  Store.on(() => {
    render();
    if (state.modal && state.modal.type === "module") UI.renderModuleModal();
    if (state.modal && state.modal.type === "catalog") UI.renderCatalogList();
  });
  render();
  // official exam dates (data/pruefungstermine.xlsx, or a file the student picked)
  ExamDates.on(() => { render(); if (state.modal && state.modal.type === "catalog") UI.renderCatalogList(); });
  ExamDates.load();

  // offline / installable when served over http(s) (GitHub Pages); file:// has no service workers
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(() => {});
  UI.maybePersist();
  window.__app = { render, ctx: UI.ctx };
})();
