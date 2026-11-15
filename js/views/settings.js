/* ==========================================================================
   Secondary pages behind the ⚙ menu: Import & Backup, Regeln, Datenschutz.
   Data safety: export, delete-all, backup reminder, persistent storage.
   ========================================================================== */
"use strict";

(() => {
  const { $, esc, t, fmt, fmtG, pill, tone, areaShort, groupName, icon, state } = UI;

  UI.views.import = () => {
    let prev = "";
    const r = state.pendingImport;
    if (r) {
      const ms = Store.mods();
      const done = r.modules.filter((m) => m.status === "done").length;
      prev = `<section class="card flush preview"><header class="card-h"><h2>${t("imp.preview")}</h2>
          <span class="sub">${t("imp.found", { n: r.modules.length, done, open: r.modules.length - done })}${r.tucanGpa != null ? " · TUCaN-GPA " + fmt(r.tucanGpa, 3) : ""}</span></header>
        ${r.warnings.length ? `<ul class="hints" style="padding:12px 16px 0">${r.warnings.map((w) => `<li class="hint warn"><span class="hdot"></span><span class="htxt">${t(w.k, w.v)}</span></li>`).join("")}</ul>` : ""}
        <div class="tscroll"><table class="tbl"><thead><tr><th>${t("col.module")}</th><th class="num">CP</th><th>${t("col.grade")}</th><th>${t("imp.match")}</th></tr></thead><tbody>
          ${r.modules.map((m) => {
            const ex = ms.find((x) => x.code && Tucan.baseCode(x.code) === Tucan.baseCode(m.code));
            return `<tr><td class="cell-name" style="border-left:4px solid var(--a-${m.a})"><span class="mname">${esc(m.name)}</span><div class="meta"><span>${areaShort(m.a)}</span>${m.g ? `<span class="chip">${esc(groupName(m.a, m.g))}</span>` : ""}<span class="mono">${esc(m.code)}</span>${m.date ? `<span>${esc(m.date)}</span>` : ""}</div></td>
              <td class="num">${m.cp != null ? fmt(m.cp, 0) : "–"}</td>
              <td>${m.status === "done" ? (m.ungraded ? pill("good", t("passedShort")) : `<b class="tone-${tone(m.grade)}">${fmtG(m.grade)}</b>`) : m.attempts ? pill("warn", t("imp.failedShort")) : `<span class="muted">${t("imp.inProgress")}</span>`}</td>
              <td>${ex ? pill("good", t("imp.update")) : pill("info", t("imp.new"))}</td></tr>`;
          }).join("")}</tbody></table></div>
        <div class="card-f"><label class="check"><input type="checkbox" id="imp-all" checked> ${t("imp.optAll")}</label><label class="check"><input type="checkbox" id="imp-ph" checked> ${t("imp.optPh")}</label>
          <span class="spacer"></span><button class="btn ghost" data-act="impCancel">${t("cancel")}</button><button class="btn primary" data-act="impApply">${t("imp.apply")}</button></div></section>`;
    }
    return `
      <div class="page-head"><div><h1>${t("import.title")}</h1><p class="lede">${t("import.lede")}</p></div></div>
      ${prev}
      <section class="card"><h2>${t("imp.tucan")}</h2><ol class="steps">${t("imp.steps")}</ol>${UI.dropZone()}
        <details class="paste"><summary>${t("imp.pasteTitle")}</summary><textarea id="paste" rows="6" placeholder="${t("imp.pastePh")}"></textarea><button class="btn" data-act="parseText">${t("imp.parse")}</button></details>
        <p class="fine">${t("imp.privacy")}</p></section>
      <section class="card"><h2>${t("backup.title")}</h2><p class="fine" style="margin-top:-6px">${t("backup.text")}</p>
        <div class="actions"><button class="btn primary" data-act="export">${icon("download")}${t("backup.export")}</button><button class="btn" data-act="importJson">${icon("upload")}${t("backup.import")}</button>
          <span class="spacer"></span><button class="btn danger" data-act="deleteAll">${icon("trash")}${t("del.btn")}</button>
          <input type="file" id="json-file" accept="application/json,.json" hidden></div>
        ${Store.get().lastExport ? `<p class="fine" style="margin:10px 0 0">${t("backup.last", { d: new Date(Store.get().lastExport).toLocaleDateString(UI.L() === "de" ? "de-DE" : "en-GB") })}</p>` : ""}</section>`;
  };

  UI.views.rules = () => `<div class="page-head"><div><h1>${t("rules.title")}</h1><p class="lede">${t("rules.lede")}</p></div></div><div class="prose">${I18N.rules(UI.L())}</div>`;

  UI.views.privacy = () => `<div class="page-head"><div><h1>${t("privacy.title")}</h1></div></div>
    <div class="prose">${I18N.privacy(UI.L())}
      <section><h2>${t("privacy.storage")}</h2><p id="persist-state">${t("privacy.checking")}</p>
        <div class="actions"><button class="btn primary" data-act="export">${icon("download")}${t("backup.export")}</button><button class="btn danger" data-act="deleteAll">${icon("trash")}${t("del.btn")}</button></div></section></div>`;
  UI.after.privacy = async () => {
    const el = $("#persist-state"); if (!el) return;
    let txt = t("privacy.local");
    try { if (navigator.storage && navigator.storage.persisted) txt += " " + ((await navigator.storage.persisted()) ? t("privacy.persisted") : t("privacy.notPersisted")); } catch (e) {}
    el.textContent = txt;
  };

  /* ⚙ menu */
  UI.act.menu = (el) => {
    const S = Store.get();
    UI.openMenu(el, `
      <a class="mi" href="#import">${icon("file")}${t("menu.import")}</a>
      <button class="mi" data-act="export">${icon("download")}${t("backup.export")}</button>
      <button class="mi" data-act="importJson">${icon("upload")}${t("backup.import")}</button>
      <hr>
      <a class="mi" href="#rules">${icon("book")}${t("nav.rules")}</a>
      <a class="mi" href="#privacy">${icon("shield")}${t("privacy.title")}</a>
      <hr>
      <div class="mrow">${t("menu.lang")}<div class="seg sm"><button class="${S.lang === "de" ? "on" : ""}" data-act="lang" data-v="de">DE</button><button class="${S.lang === "en" ? "on" : ""}" data-act="lang" data-v="en">EN</button></div></div>
      <div class="mrow">${t("menu.theme")}<div class="seg sm">${["light", "dark", "system"].map((x) => `<button class="${S.theme === x ? "on" : ""}" data-act="theme" data-v="${x}">${t("theme." + x)}</button>`).join("")}</div></div>
      <hr>
      <button class="mi danger" data-act="deleteAll">${icon("trash")}${t("del.btn")}</button>
      <input type="file" id="json-file-menu" accept="application/json,.json" hidden>`);
  };
  UI.act.lang = (el) => { Store.set((S) => { S.lang = el.dataset.v; }); UI.act.menu(document.getElementById("menu-btn")); };
  UI.act.theme = (el) => { Store.set((S) => { S.theme = el.dataset.v; }); UI.act.menu(document.getElementById("menu-btn")); };

  UI.act.export = () => {
    UI.closeMenu();
    const S = Store.get();
    // everything in the store (modules, grades, scenarios, study plans, tracker, free topics, settings) plus
    // a user-uploaded exam schedule, which lives in its own storage key
    const ed = typeof ExamDates !== "undefined" ? ExamDates.get() : null;
    const out = { ...S, exportedAt: new Date().toISOString() };
    if (ed && ed.source !== "repo") out.examDates = ed;
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `notenplaner-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    Store.markExported(); UI.render();
    UI.toast(t("backup.done"), "good");
  };
  UI.act.importJson = () => { UI.closeMenu(); (document.getElementById("json-file") || document.getElementById("json-file-menu")).click(); };
  UI.importJsonFile = (f) => {
    f.text().then((txt) => { try { const d = JSON.parse(txt); const ed = d && d.examDates; if (d) delete d.examDates; if (Store.replaceAll(d)) { if (ed && typeof ExamDates !== "undefined") ExamDates.restore(ed); Store.set((S) => { S.onboarded = true; }); UI.toast(t("backup.loaded"), "good"); } else UI.toast(t("backup.invalid"), "bad"); } catch { UI.toast(t("backup.invalid"), "bad"); } });
  };

  /* delete everything: confirm dialog that offers an export first */
  UI.act.deleteAll = () => {
    UI.closeMenu();
    state.modal = { type: "delete" };
    UI.modal(`<header class="dlg-h"><div><div class="eyebrow">${t("privacy.title")}</div><h2>${t("del.title")}</h2></div><button class="icon-btn" data-act="close" aria-label="${t("close")}">${icon("x")}</button></header>
      <div class="dlg-b"><p>${t("del.text")}</p><p class="fine">${t("del.note")}</p></div>
      <footer class="dlg-f"><button class="btn" data-act="export">${icon("download")}${t("del.exportFirst")}</button><span class="spacer"></span><button class="btn ghost" data-act="close">${t("cancel")}</button><button class="btn solid-danger" data-act="deleteConfirm">${t("del.confirm")}</button></footer>`);
  };
  UI.act.deleteConfirm = () => { UI.closeModal(); state.pendingImport = null; Store.deleteAll(); location.hash = "#overview"; UI.toast(t("del.done")); };

  /* backup reminder: changed since the last export and 30+ days old */
  UI.backupBanner = () => {
    const S = Store.get();
    if (!S.onboarded || !S.dirty) return "";
    const since = Date.parse(S.lastExport || S.createdAt || S.savedAt || 0);
    if (!since || Date.now() - since < 30 * 864e5) return "";
    if (S.snoozeUntil && Date.now() < Date.parse(S.snoozeUntil)) return "";
    return `<div class="banner warn">${icon("warn")}<span>${S.lastExport ? t("remind.text", { d: Math.floor((Date.now() - since) / 864e5) }) : t("remind.never")}</span><span class="spacer"></span>
      <button class="btn sm primary" data-act="export">${t("backup.export")}</button><button class="btn sm ghost" data-act="snooze">${t("remind.later")}</button></div>`;
  };
  UI.act.snooze = () => Store.snooze(7);

  /* ask the browser not to evict our storage (once, after real data exists) */
  UI.maybePersist = () => {
    const S = Store.get();
    if (S.persistAsked || !S.onboarded || !/^https?:$/.test(location.protocol) || !(navigator.storage && navigator.storage.persist)) return;
    S.persistAsked = true; Store.save();
    navigator.storage.persist().catch(() => {});
  };
})();
