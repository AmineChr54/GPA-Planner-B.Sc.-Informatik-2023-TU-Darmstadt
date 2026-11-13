/* ==========================================================================
   UI kit — helpers shared by all views: formatting, icons, modal, menu, toast.
   Views register into UI.views / UI.act / UI.change / UI.after.
   ========================================================================== */
"use strict";

const UI = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const L = () => Store.get().lang;
  const t = (k, v) => I18N.t(L(), k, v);
  const fmt = (x, d = 2) => (x == null || !isFinite(x) ? "–" : L() === "de" ? x.toFixed(d).replace(".", ",") : x.toFixed(d));
  const fmtG = (g) => fmt(g, 1);
  const delta = (x, d = 3) => (x == null || !isFinite(x) ? "–" : (x > 0 ? "−" : x < 0 ? "+" : "±") + fmt(Math.abs(x), d)); // lower GPA = better
  const stufe = (x) => (x == null ? "" : t("stufe." + Engine.stufe(x)));
  const tone = Engine.tone;
  const areaName = (id) => t("area." + id);
  const areaShort = (id) => t("areaShort." + id);
  const groupName = (a, g) => { const gr = (GROUPS[a] || []).find((x) => x.id === g); return gr ? gr[L()] : g || ""; };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const daysUntil = (iso) => Math.round((new Date(iso + "T00:00:00") - today()) / 864e5);
  const dateShort = (iso) => new Date(iso + "T00:00:00").toLocaleDateString(L() === "de" ? "de-DE" : "en-GB", { day: "2-digit", month: "short" });
  const pill = (tn, txt) => `<span class="pill ${tn}">${txt}</span>`;
  const big = (x) => `<span class="tone-${tone(x)}">${fmt(x)}</span>`;
  const gradeOptions = (sel) => GRADES.map((g) => `<option value="${g}" ${sel != null && Math.abs(g - sel) < 1e-9 ? "selected" : ""}>${fmtG(g)}</option>`).join("");
  const AREA_ORDER = ["A", "B111", "B112", "B12", "B2", "C"];

  /* semester n (1-based column) → type, Fachsemester number (Urlaub doesn't count), calendar term */
  function semInfo(n) {
    const S = Store.get();
    const sem = S.sems[n - 1] || { t: "n" };
    let fach = 0;
    for (let i = 0; i < n; i++) if ((S.sems[i] || {}).t !== "u") fach++;
    return { n, t: sem.t, fach: sem.t === "u" ? null : fach, term: Engine.termOf(S.start, n) };
  }
  const semLabel = (n) => { const s = semInfo(n); return (s.t === "u" ? t("sem.urlaub") : t("semN", { n: s.fach })) + " · " + s.term.label; };

  const IC = {
    overview: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    plan: "M3 3h18v18H3zM9 3v18M15 3v18M3 9h18",
    strategy: "M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z",
    exams: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
    undo: "M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8",
    plus: "M12 5v14M5 12h14",
    x: "M18 6L6 18M6 6l12 12",
    dots: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
    download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15l3-3 3 3",
    image: "M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
    print: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
    trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
    book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM20 17v4H6.5",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    warn: "M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
    sun: "M12 3v2M12 19v2M5 5l1.4 1.4M17.6 17.6L19 19M3 12h2M19 12h2M5 19l1.4-1.4M17.6 6.4L19 5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    moon: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z",
  };
  const icon = (name, cls = "ic") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IC[name] || name}"/></svg>`;
  const LOGO = `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="33" width="11" height="10" rx="2.5" fill="#4fa6dc"/><rect x="18.5" y="33" width="11" height="10" rx="2.5" fill="#4fa6dc"/><rect x="18.5" y="20.5" width="11" height="10" rx="2.5" fill="#9cc955"/><rect x="32" y="33" width="11" height="10" rx="2.5" fill="#4fa6dc"/><rect x="32" y="20.5" width="11" height="10" rx="2.5" fill="#9cc955"/><rect x="32" y="5" width="11" height="13" rx="2.5" fill="#f37f3f"/><path d="M35.2 11.6l2.1 2.1 3.9-4.3" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  /* ---------------- modal ---------------- */
  const state = { modal: null, planMode: "grid", stratTab: "opt", catalog: { area: "B111", g: "", q: "", mode: "add", id: null }, pendingImport: null, dragId: null };
  function modal(html, cls = "") {
    const m = $("#modal");
    const a = document.activeElement;
    const reopen = !m.hidden && a && m.contains(a) ? (a.dataset.f || a.dataset.act || null) : null;
    m.innerHTML = `<div class="backdrop" data-act="close"></div><div class="dialog ${cls}" role="dialog" aria-modal="true">${html}</div>`;
    m.hidden = false;
    document.body.classList.add("noscroll");
    const f = (reopen && m.querySelector(`.dialog [data-f="${reopen}"], .dialog [data-act="${reopen}"]`)) || m.querySelector("[autofocus]") || m.querySelector(".dialog .dlg-h .icon-btn");
    if (f) f.focus();
  }
  function closeModal() { const m = $("#modal"); m.hidden = true; m.innerHTML = ""; document.body.classList.remove("noscroll"); state.modal = null; }

  /* ---------------- popover menu ---------------- */
  function openMenu(anchor, html) {
    const m = $("#menu");
    m.className = "menu"; m.innerHTML = html; m.hidden = false;
    const r = anchor.getBoundingClientRect();
    const w = m.offsetWidth, h = m.offsetHeight;
    let left = Math.min(window.innerWidth - w - 8, Math.max(8, r.right - w));
    let top = r.bottom + 6;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
    m.style.left = left + "px"; m.style.top = top + "px";
    const f = m.querySelector("button, a"); if (f) f.focus();
  }
  /* same menu, opened at a point (right-click / long-press) */
  function openMenuAt(x, y, html, cls = "") {
    const m = $("#menu");
    m.className = "menu " + cls; m.innerHTML = html; m.hidden = false;
    const w = m.offsetWidth, h = m.offsetHeight;
    m.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x)) + "px";
    m.style.top = Math.max(8, y + h > window.innerHeight - 8 ? y - h : y) + "px";
    const f = m.querySelector("button:not([disabled]), a"); if (f) f.focus({ preventScroll: true });
  }
  const closeMenu = () => { const m = $("#menu"); m.hidden = true; m.className = "menu"; };

  function toast(msg, tn = "") {
    const el = document.createElement("div");
    el.className = "toast " + tn; el.textContent = msg;
    const box = $("#toasts");
    while (box.children.length >= 3) box.firstChild.remove();
    box.appendChild(el);
    setTimeout(() => el.classList.add("out"), 2600);
    setTimeout(() => el.remove(), 3100);
  }

  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("load " + src)); document.head.appendChild(s); });
  }

  /* grade select: planned modules get "auto" (= what the goal needs) as first choice */
  function gradeSelectOptions(m) {
    if (m.status !== "open") return gradeOptions(+m.grade);
    const auto = !m.gradeSet;
    return `<option value="auto" ${auto ? "selected" : ""}>${esc(t("grade.autoOpt", { g: fmtG(+(auto ? m.grade : (Store.sc().auto || { g: m.grade }).g)) }))}</option>` + gradeOptions(auto ? null : +m.grade);
  }

  return {
    gradeSelectOptions,
    $, $$, esc, t, L, fmt, fmtG, delta, stufe, tone, areaName, areaShort, groupName, today, daysUntil, dateShort, pill, big, gradeOptions,
    AREA_ORDER, semInfo, semLabel, icon, LOGO, modal, closeModal, openMenu, openMenuAt, closeMenu, toast, loadScript, state,
    views: {}, act: {}, change: {}, after: {},
  };
})();
window.UI = UI;
