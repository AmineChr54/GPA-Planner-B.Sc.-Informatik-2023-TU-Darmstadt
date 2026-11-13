/* ==========================================================================
   Studienplan — the official Studienübersicht, made interactive.
   Columns = semesters (+ to extend; Urlaub/Ausland types), boxes = modules
   colored by area (solid = passed, dashed = planned), bands = elective pools.
   Below: the grade over time. Export as PNG or PDF.
   ========================================================================== */
"use strict";

(() => {
  const { $, $$, esc, t, fmt, fmtG, pill, tone, areaName, areaShort, groupName, gradeOptions, icon, semInfo, semLabel, state } = UI;

  const areaRank = (a) => UI.AREA_ORDER.indexOf(a);
  /* German compounds in narrow columns: soft hyphens before common word parts,
     like the official overview ("Informations-management", "Rechner-organisation") */
  const PARTS = /(management|sicherheit|konzepte|organisation|entwicklung|systeme|programmierung|technik|informatik|verarbeitung|lernen|netze|methoden|logik|barkeit|schaftliches|schaftliche|algorithmen|strukturen|intelligenz|spezifikation|grundlagen|analyse|kommunikation|praktikum|seminar|projekt|semester)/gi;
  const hy = (name) => esc(name).replace(/[A-Za-zÄÖÜäöüß]{13,}/g, (w) => w.replace(PARTS, (m, _p, i) => (i > 3 ? "\u00AD" + m : m)));
  const BAND_AREAS = ["B111", "B112", "B12", "B2"];

  /* ---------------- boxes ---------------- */
  function boxName(m) {
    if (m.choice && m.choice.length) return m.choice.map((o) => `<span class="bx-n">${hy(o.name)}</span>`).join(`<span class="bx-or">${t("choice.or")}</span>`);
    return `<span class="bx-n">${hy(m.name)}${m.sl ? "<sup>*</sup>" : ""}</span>`;
  }
  function boxGrade(m) {
    if (m.status === "done") return `<span class="bx-g">✓ ${m.ungraded ? t("passedShort") : fmtG(+m.grade)}</span>`;
    if (m.status === "open" && !m.ungraded) return m.gradeSet ? `<span class="bx-g">${t("goalShort")} ${fmtG(+m.grade)}</span>`
      : `<span class="bx-g auto" title="${esc(UI.autoTitle(m))}">≈ ${fmtG(+m.grade)}</span>`;
    if (m.status === "off") return `<span class="bx-g">${t("status.off")}</span>`;
    return "";
  }
  function box(m) {
    const flags = [];
    if (m.status === "open" && (m.attempts || 0) >= 2) flags.push(`<span class="flag" title="${t("att.opt2")}">3.V</span>`);
    else if (m.status === "open" && m.attempts === 1) flags.push(`<span class="flag warn" title="${t("att.opt1")}">2.V</span>`);
    if (m.abroad) flags.push(`<span class="flag glob" title="${t("abroad.tag")}">${icon("globe", "ic")}</span>`);
    const cls = ["box", flags.length ? "has-flags" : "", "a-" + m.a, m.status === "done" ? "done" : m.status === "open" ? "open" : "off", m.ph ? "ph" : "", m.choice ? "choice" : ""].join(" ");
    const label = (m.choice && m.choice.length ? m.choice.map((o) => o.name).join(" / ") : m.name) + `, ${m.cp} CP, ${t("status." + m.status)}`;
    return `<div class="${cls}" draggable="true" data-id="${m.id}" tabindex="0" role="button" aria-label="${esc(label)}" style="--h:${Math.min(+m.cp || 1, 15)}">
      ${flags.length ? `<span class="bx-flags">${flags.join("")}</span>` : ""}${m.choice ? `<span class="bx-tag">${t("choice.tag")}</span>` : ""}
      ${boxName(m)}<span class="bx-cp">(${fmt(+m.cp, 0)} CP)</span>${boxGrade(m)}</div>`;
  }

  /* ---------------- grid ---------------- */
  function grid(c) {
    const S = Store.get();
    const N = S.sems.length;
    const cols = S.sems.map((_, i) => i + 1);
    const inSem = (n) => c.ms.filter((m) => +m.sem === n && m.status !== "dropped").sort((a, b) => areaRank(a.a) - areaRank(b.a) || c.ms.indexOf(a) - c.ms.indexOf(b));
    const heads = cols.map((n) => {
      const si = semInfo(n);
      const ms = inSem(n).filter(Engine.counts);
      const cp = ms.reduce((s, m) => s + (+m.cp || 0), 0);
      const avg = Engine.gpa(c.ms, "proj", null, (m) => +m.sem === n).official;
      const title = si.t === "u" ? t("sem.urlaub") : t("semN", { n: si.fach });
      return `<div class="phead ${si.t}" data-sem="${n}">
        <div class="t">${hy(title)}</div>
        <div class="s">${si.term.label}${si.t === "a" ? " · " + t("sem.abroad") : ""}</div>
        ${si.t === "u" ? `<div class="s">${t("sem.notCounted")}</div>` : `<div class="s"><b>${fmt(cp, 0)} CP</b>${avg != null ? ` · <span title="${esc(t("sem.avgTitle"))}">Ø ${fmt(avg)}</span>` : ""}</div>`}
        <button class="icon-btn menu-btn" data-act="semMenu" data-sem="${n}" aria-label="${t("sem.menu")}">${icon("dots")}</button></div>`;
    }).join("");
    const bodies = cols.map((n) => {
      const si = semInfo(n);
      if (si.t === "u") return `<div class="pcol u" data-sem="${n}" data-type="u">${icon("moon", "ic big")}<div>${t("sem.urlaub")}</div><div class="fine">${t("sem.urlaubNote")}</div></div>`;
      const boxes = inSem(n).map(box).join("");
      if (si.t === "a") return `<div class="pcol a" data-sem="${n}" data-type="a"><div class="abroad-h">${icon("globe", "ic")} ${t("sem.abroadHint")}</div>${boxes}<div class="fill">${t("dropHere")}</div>
        <button class="btn sm add-abroad" data-act="addAbroad" data-sem="${n}">${icon("plus")}${t("abroad.add")}</button></div>`;
      return `<div class="pcol" data-sem="${n}" data-type="n">${boxes}<div class="fill">${t("dropHere")}</div></div>`;
    }).join("");
    const plus = `<div class="pplus"><div class="phead"><button class="plus-big" data-act="addSem" data-t="n" title="${t("sem.add")}" aria-label="${t("sem.add")}">${icon("plus")}</button></div></div>`;
    // one icon + one short word per tile, so nothing has to hyphenate in a narrow column
    const tile = (tp, ic, type) => `<button class="tile" data-act="addSem" data-t="${tp}" title="${esc(t("sem.addTitle", { type: t(type) }))}" aria-label="${esc(t("sem.addTitle", { type: t(type) }))}">${icon(ic)}<span>${t("sem.tile" + tp.toUpperCase())}</span></button>`;
    const plusBody = `<div class="pplus"><div class="pcol">${tile("n", "plus", "sem.typeN")}${tile("u", "moon", "sem.typeU")}${tile("a", "globe", "sem.typeA")}</div></div>`;
    // the header row and the body row each get the trailing "+" column
    const unscheduledCore = c.ms.filter((m) => !m.sem && ["A", "C"].includes(m.a) && Engine.counts(m));
    const bands = BAND_AREAS.map((a) => band(a, c)).join("")
      + (unscheduledCore.length ? `<div class="band" data-band="core" style="--c:var(--head)"><div class="bt">${t("band.core")}</div><div class="bchips">${unscheduledCore.map(chip).join("")}</div></div>` : "");
    const legend = `<div class="plan-legend">
      <span class="lg"><sup>*</sup> ${t("legend.sl")}</span>
      <span class="lg"><span class="lg-solid"></span>${t("legend.done")}</span>
      <span class="lg"><span class="lg-open"></span>${t("legend.open")}</span>
      <span class="lg">${t("legend.height")}</span>
      <span class="lg ctx-hint">${icon("dots", "ic")}${t("ctx.hint")}</span></div>`;
    // semesters scroll sideways; the area bands stay full width below so they never get cut off
    return `<div class="plan-print" id="plan-export">
      <div class="plan-scroll" id="plan-scroll"><div class="plan-wrap" id="plan-wrap"><div class="pgrid" id="pgrid" style="--n:${N}">${heads}${plus}${bodies}${plusBody}</div></div></div>
      <div class="bands">${bands}</div>${legend}</div>`;
  }

  function chip(m) {
    const g = m.status === "done" ? (m.ungraded ? "✓" : "✓ " + fmtG(+m.grade)) : m.ungraded ? "" : (m.gradeSet ? "" : "≈ ") + fmtG(+m.grade);
    const name = m.choice && m.choice.length ? m.choice.map((o) => o.name).join(` ${t("choice.or")} `) : m.name;
    return `<span class="bchip ${m.status}" draggable="true" data-id="${m.id}" tabindex="0" role="button">${m.choice ? `<small>${t("choice.tag")}</small>` : ""}${esc(name)} <small>${fmt(+m.cp, 0)} CP${g ? " · " + g : ""}</small></span>`;
  }

  function band(a, c) {
    const n = Engine.nodeById(a);
    const all = c.ms.filter((m) => m.a === a && Engine.counts(m));
    const cp = all.reduce((s, m) => s + (+m.cp || 0), 0);
    const pool = c.ms.filter((m) => m.a === a && !m.sem && m.status !== "dropped");
    const ok = cp >= n.min && cp <= n.max;
    return `<div class="band a-${a}" data-band="${a}">
      <div class="bt">${areaName(a)} ${a === "B111" || a === "B112" || a === "B12" ? `<span class="fine" style="color:inherit;font-weight:600">(${t("band.open")})</span>` : ""}</div>
      <div class="br">${n.min}–${n.max} CP · ${t("band.planned", { cp: fmt(cp, 0) })} ${ok ? "" : pill(cp < n.min ? "bad" : "warn", cp < n.min ? t("tooFew") : t("tooMany"))}</div>
      <div class="br" style="font-weight:500">${t("band.desc." + a)}</div>
      ${pool.length ? `<div class="bchips">${pool.map(chip).join("")}</div>` : `<div class="bempty">${t("band.empty")}</div>`}
      <div class="bacts"><button data-act="catalog" data-area="${a}">${t("btn.catalog")}</button><button data-act="newChoice" data-area="${a}">${t("choice.new")}</button><button data-act="custom" data-area="${a}">${t("btn.custom")}</button></div>
    </div>`;
  }

  /* ---------------- list view ---------------- */
  function list(c) {
    const rows = UI.AREA_ORDER.map((a) => {
      const ms = c.ms.filter((m) => m.a === a);
      if (!ms.length) return "";
      return `<tr class="grp a-${a}"><td colspan="6" style="border-left:4px solid var(--c)">${areaName(a)}</td></tr>` + ms.map((m) => {
        const sems = Store.get().sems.map((_, i) => i + 1).filter((n) => semInfo(n).t !== "u");
        return `<tr class="a-${m.a}"><td class="cell-name"><button class="linklike mname" data-act="open" data-id="${m.id}">${esc(m.choice && m.choice.length ? m.choice.map((o) => o.name).join(" / ") : m.name)}</button>
            <div class="meta">${m.code ? `<span class="mono">${esc(m.code)}</span>` : ""}${m.g ? `<span class="chip">${esc(groupName(m.a, m.g))}</span>` : ""}${m.choice ? `<span class="chip">${t("choice.tag")}</span>` : ""}${m.abroad ? `<span class="chip">${t("abroad.tag")}</span>` : ""}</div></td>
          <td class="num">${fmt(+m.cp, 0)}</td>
          <td><select class="sem" data-id="${m.id}" data-f="sem" data-key="ls-${m.id}" aria-label="${t("f.sem")}"><option value="">–</option>${sems.map((n) => `<option value="${n}" ${+m.sem === n ? "selected" : ""}>${semInfo(n).fach}.</option>`).join("")}</select></td>
          <td><select data-id="${m.id}" data-f="status" data-key="lst-${m.id}" aria-label="${t("col.status")}">${["open", "done", "off"].concat(m.status === "dropped" ? ["dropped"] : []).map((s) => `<option value="${s}" ${m.status === s ? "selected" : ""}>${t("status." + s)}</option>`).join("")}</select></td>
          <td>${m.ungraded ? `<span class="muted">${t("passedShort")}</span>` : Engine.counts(m) ? `<select class="grade tone-${tone(+m.grade)}" data-id="${m.id}" data-f="grade" data-key="lg-${m.id}" aria-label="${t("col.grade")}">${UI.gradeSelectOptions(m)}</select>` : "–"}</td>
          <td class="acts"><button class="icon-btn" data-act="open" data-id="${m.id}" aria-label="${t("details")}">${icon("dots")}</button></td></tr>`;
      }).join("");
    }).join("");
    return `<section class="card flush"><div class="tscroll"><table class="tbl ltable"><thead><tr><th>${t("col.module")}</th><th class="num">CP</th><th>${t("col.sem")}</th><th>${t("col.status")}</th><th>${t("col.grade")}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  /* ---------------- chart: grade over semesters ---------------- */
  function chartData(c) {
    const S = Store.get();
    const pts = [];
    let allDoneSoFar = true;
    for (let n = 1; n <= S.sems.length; n++) {
      const si = semInfo(n);
      if (si.t === "u") continue;
      const inN = c.ms.filter((m) => +m.sem === n && Engine.counts(m));
      if (inN.some((m) => m.status !== "done")) allDoneSoFar = false;
      const cum = Engine.gpa(c.ms, "proj", null, (m) => m.sem && +m.sem <= n);
      const own = Engine.gpa(c.ms, "proj", null, (m) => +m.sem === n);
      if (cum.official == null) continue;
      pts.push({ n, fach: si.fach, term: si.term.label, v: cum.official, own: own.official, cp: inN.reduce((s, m) => s + (+m.cp || 0), 0), done: allDoneSoFar && inN.length > 0 });
    }
    return pts;
  }
  function chart(c) {
    const pts = chartData(c);
    if (pts.length < 2) return "";
    // draw at the real pixel width so text is never scaled up or down
    const view = document.getElementById("view");
    const W = Math.round(Math.max(320, Math.min(1400, (view ? view.clientWidth - 48 : 900) - 42))), H = 250, ml = 44, mr = 82, mt = 18, mb = 34, iw = W - ml - mr, ih = H - mt - mb;
    const goalOn = Store.get().goalOn;
    const vals = pts.map((p) => p.v).concat(goalOn ? [c.target] : []);
    let lo = Math.min(...vals) - 0.1, hi = Math.max(...vals) + 0.1;
    if (hi - lo < 0.5) { const mid = (hi + lo) / 2; lo = mid - 0.25; hi = mid + 0.25; }
    lo = Math.max(1.0, lo); hi = Math.min(4.0, hi);
    const step = hi - lo > 1.5 ? 0.5 : hi - lo > 0.6 ? 0.2 : 0.1;
    const x = (i) => ml + (pts.length === 1 ? iw / 2 : (i / (pts.length - 1)) * iw);
    const gap = iw / Math.max(1, pts.length - 1); // narrow screens: "3." instead of "3. Sem."
    const y = (v) => mt + ((v - lo) / (hi - lo)) * ih; // better grades at the top
    const ticks = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(+v.toFixed(2));
    const doneIdx = pts.reduce((k, p, i) => (p.done ? i : k), -1);
    const path = (from, to) => pts.slice(from, to + 1).map((p, j) => `${j ? "L" : "M"}${x(from + j).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
    const solid = doneIdx >= 1 ? `<path class="series" d="${path(0, doneIdx)}"/>` : "";
    const dashed = doneIdx < pts.length - 1 ? `<path class="series plan" d="${path(Math.max(0, doneIdx), pts.length - 1)}"/>` : "";
    const last = pts[pts.length - 1];
    const ty = y(Math.min(hi, Math.max(lo, c.target)));
    window.__chart = { pts, x, y, W, H };
    return `<section class="card chart-card">
      <div class="ch-h"><h2>${t("chart.title")}</h2><span class="fine">${t("chart.sub")}</span></div>
      <div class="chart" id="chart">
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("chart.aria", { list: pts.map((p) => p.fach + ": " + fmt(p.v)).join(", ") }))}">
          <g class="grid">${ticks.map((v) => `<line x1="${ml}" x2="${ml + iw}" y1="${y(v)}" y2="${y(v)}"/>`).join("")}</g>
          <g class="axis">${ticks.map((v) => `<text x="${ml - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v, step < 0.2 ? 1 : 1)}</text>`).join("")}
            ${pts.map((p, i) => `<text x="${x(i)}" y="${H - 10}" text-anchor="middle">${gap < 56 ? p.fach + "." : t("semShortN", { n: p.fach })}</text>`).join("")}</g>
          ${goalOn ? `<line class="target" x1="${ml}" x2="${ml + iw}" y1="${ty}" y2="${ty}"/>
          <text class="tlabel" x="${ml + iw + 8}" y="${ty + 4}">${t("k.target")} ${fmt(c.target)}</text>` : ""}
          ${solid}${dashed}
          <line class="xh" id="xh" x1="0" x2="0" y1="${mt}" y2="${mt + ih}" visibility="hidden"/>
          ${pts.map((p, i) => `<circle class="pt ${i <= doneIdx ? "" : "plan"}" cx="${x(i)}" cy="${y(p.v)}" r="5"/>`).join("")}
          <text class="dlabel" x="${x(pts.length - 1) + 10}" y="${y(last.v) + (goalOn && Math.abs(y(last.v) - ty) < 14 ? (y(last.v) < ty ? -8 : 16) : 4)}">${fmt(last.v)}</text>
          ${pts.map((p, i) => `<rect class="hit" data-i="${i}" x="${i === 0 ? ml - 20 : (x(i - 1) + x(i)) / 2}" y="${mt}" width="${(i === pts.length - 1 ? x(i) + 20 : (x(i) + x(i + 1)) / 2) - (i === 0 ? ml - 20 : (x(i - 1) + x(i)) / 2)}" height="${ih}"/>`).join("")}
        </svg>
        <div class="tip" id="tip" hidden></div>
      </div>
      <p class="fine" style="margin:6px 0 0">${t(goalOn ? "chart.legend" : "chart.legendNoGoal")}</p>
    </section>`;
  }

  /* ---------------- view ---------------- */
  UI.views.plan = (c) => {
    const S = Store.get();
    // the bar counts only modules placed in a semester column; parked ones (bands below the grid) are shown apart
    const placed = c.ms.filter((m) => m.sem);
    const rows = Engine.structure(placed);
    const parkedCp = c.ms.filter((m) => !m.sem && Engine.counts(m)).reduce((s, m) => s + (+m.cp || 0), 0);
    const issues = rows.filter((r) => r.st !== "ok").map((r) => pill(r.st === "low" ? "bad" : "warn", (r.id === "TOTAL" ? t("total") : areaShort(r.id)) + ": " + (r.st === "low" ? t("issue.low", { n: r.min - r.cp }) : t("issue.high", { n: r.cp - r.max }))));
    const b12 = Engine.b12Rules(placed).rows.filter((r) => r.st !== "ok").map((r) => pill(r.st === "low" ? "bad" : "warn", t("issue.b12." + r.g.id + "." + r.st)));
    const y0 = new Date().getFullYear(); const years = []; for (let y = y0 - 8; y <= y0 + 1; y++) years.push(y);
    const total = rows.find((r) => r.id === "TOTAL").cp;
    return `
      <div class="page-head"><div><h1>${t("plan.title")}</h1><p class="lede">${t("plan.lede")}</p></div>
        <div class="head-actions">
          <div class="seg" role="group" aria-label="${t("plan.mode")}"><button class="${state.planMode === "grid" ? "on" : ""}" data-act="planMode" data-v="grid">${icon("plan")} ${t("plan.grid")}</button><button class="${state.planMode === "list" ? "on" : ""}" data-act="planMode" data-v="list">${icon("list")} ${t("plan.list")}</button></div>
          <button class="btn" data-act="exportMenu">${icon("download")}${t("plan.export")}</button>
        </div></div>
      <div class="plan-bar">
        <span class="cpsum">${t("plan.cp", { cp: fmt(total, 0) })}${parkedCp ? ` <small class="fine">${t("plan.parked", { cp: fmt(parkedCp, 0) })}</small>` : ""}</span>
        <span class="issues">${issues.concat(b12).join("") || pill("good", t("plan.allOk"))}${Store.sc().auto && Store.sc().auto.impossible ? pill("bad", t("grade.impossible")) : ""}</span>
        ${Engine.structure(c.ms).some((r) => r.st === "low") ? `<button class="btn sm" data-act="fill">${t("btn.fill")}</button>` : ""}
        <span class="spacer"></span>
        <label class="inline">${t("timeline.start")}
          <select data-act-change="startTerm" data-key="st-term"><option value="WS" ${S.start.term === "WS" ? "selected" : ""}>${t("term.WSshort")}</option><option value="SS" ${S.start.term === "SS" ? "selected" : ""}>${t("term.SSshort")}</option></select>
          <select data-act-change="startYear" data-key="st-year">${years.map((y) => `<option ${y === S.start.year ? "selected" : ""}>${y}</option>`).join("")}</select></label>
      </div>
      ${state.planMode === "list" ? list(c) : grid(c) + chart(c)}`;
  };

  /* ---------------- interactions ---------------- */
  function dropAllowed(m, target) {
    if (!m) return { ok: false };
    if (target.band) {
      if (target.band === "core") return { ok: ["A", "C"].includes(m.a) };
      return target.band === m.a ? { ok: true } : { ok: false, why: "drop.wrongBand" };
    }
    if (target.type === "u") return { ok: false, why: "drop.urlaub" };
    if (target.type === "a" && !m.abroad) return { ok: false, why: "drop.abroadOnly" };
    return { ok: true };
  }
  function targetOf(el) { return el.dataset.band ? { band: el.dataset.band } : { sem: +el.dataset.sem, type: el.dataset.type }; }

  /* sideways scroll: keep the position across re-renders, fade the edge that has more */
  function edges() {
    const wrap = $("#plan-wrap"), sc = $("#plan-scroll"); if (!wrap || !sc) return;
    sc.classList.toggle("can-l", wrap.scrollLeft > 4);
    sc.classList.toggle("can-r", wrap.scrollLeft + wrap.clientWidth < wrap.scrollWidth - 4);
  }
  window.addEventListener("resize", edges);

  UI.after.plan = () => {
    const wrap = $("#plan-wrap");
    if (wrap) {
      wrap.scrollLeft = state.planScroll === "end" ? wrap.scrollWidth : state.planScroll || 0;
      state.planScroll = wrap.scrollLeft;
      wrap.addEventListener("scroll", () => { state.planScroll = wrap.scrollLeft; edges(); }, { passive: true });
      edges();
    }
    $$(".box[draggable], .bchip[draggable]").forEach((el) => {
      el.addEventListener("dragstart", (e) => { state.dragId = el.dataset.id; e.dataTransfer.setData("text/plain", el.dataset.id); e.dataTransfer.effectAllowed = "move"; el.classList.add("dragging"); });
      el.addEventListener("dragend", () => { el.classList.remove("dragging"); state.dragId = null; $$(".over").forEach((x) => x.classList.remove("over", "no-drop")); });
    });
    $$(".pcol[data-sem], .band[data-band]").forEach((zone) => {
      zone.addEventListener("dragover", (e) => {
        const ok = dropAllowed(Store.byId(state.dragId), targetOf(zone)).ok;
        e.preventDefault(); zone.classList.add("over"); zone.classList.toggle("no-drop", !ok);
        e.dataTransfer.dropEffect = ok ? "move" : "none";
      });
      zone.addEventListener("dragleave", (e) => { if (!zone.contains(e.relatedTarget)) zone.classList.remove("over", "no-drop"); });
      zone.addEventListener("drop", (e) => {
        e.preventDefault(); zone.classList.remove("over", "no-drop");
        const id = e.dataTransfer.getData("text/plain") || state.dragId, m = Store.byId(id);
        const tg = targetOf(zone), chk = dropAllowed(m, tg);
        if (!chk.ok) { if (chk.why) UI.toast(t(chk.why), "bad"); return; }
        if (tg.band) { if (m.sem) Store.updateModule(id, { sem: undefined }); }
        else if (+m.sem !== tg.sem) Store.updateModule(id, { sem: tg.sem });
      });
    });
    // chart hover: crosshair + tooltip
    const chartEl = $("#chart");
    if (chartEl && window.__chart) {
      const { pts, x, y, W } = window.__chart;
      const svg = chartEl.querySelector("svg"), tip = $("#tip"), xh = $("#xh");
      const show = (i) => {
        const p = pts[i], scale = svg.getBoundingClientRect().width / W;
        xh.setAttribute("x1", x(i)); xh.setAttribute("x2", x(i)); xh.setAttribute("visibility", "visible");
        tip.innerHTML = `<div><b>${t("semN", { n: p.fach })}</b> · ${p.term}</div><div>${t("chart.cum")}: <b>${fmt(p.v)}</b></div><div>${t("chart.own")}: <b>${fmt(p.own)}</b> · ${fmt(p.cp, 0)} CP</div><div class="fine">${p.done ? t("chart.isDone") : t("chart.isPlan")}</div>`;
        tip.hidden = false; tip.style.left = x(i) * scale + "px"; tip.style.top = y(p.v) * scale + "px";
      };
      $$(".hit", svg).forEach((r) => { r.addEventListener("mouseenter", () => show(+r.dataset.i)); r.addEventListener("click", () => show(+r.dataset.i)); });
      svg.addEventListener("mouseleave", () => { tip.hidden = true; xh.setAttribute("visibility", "hidden"); });
    }
  };

  /* semester menu — from the ⋯ button or by right-clicking a header / column */
  function semMenuHtml(n) {
    const si = semInfo(n);
    const empty = !Store.get().scenarios.some((s) => s.modules.some((m) => +m.sem === n));
    const radio = (tp, label) => `<button class="mi" data-act="semType" data-sem="${n}" data-t="${tp}">${si.t === tp ? "●" : "○"} ${label}</button>`;
    const planHere = si.t === "u" ? ""
      : si.t === "a" ? `<div class="mlabel">${t("ctx.planHere")}</div><button class="mi" data-act="ctxDo" data-do="addAbroad" data-sem="${n}">${icon("globe")}${t("abroad.add")}</button><hr>`
      : `<div class="mlabel">${t("ctx.planHere")}</div>${BAND_AREAS.map((a) => `<button class="mi" data-act="ctxDo" data-do="catalog" data-area="${a}" data-sem="${n}"><span class="sw a-${a}"></span>${t("ctx.fromCat", { area: esc(areaShort(a)) })}</button>`).join("")}
         <button class="mi" data-act="ctxDo" data-do="custom" data-area="B112" data-sem="${n}">${icon("plus")}${t("ctx.own")}</button><hr>`;
    return `<div class="mhead">${esc(semLabel(n))}</div>${planHere}<div class="mlabel">${t("ctx.semType")}</div>${radio("n", t("sem.typeN"))}${radio("u", t("sem.typeU"))}${radio("a", t("sem.typeA"))}<hr>
      <button class="mi" data-act="semInsert" data-sem="${n}">${icon("plus")}${t("sem.insertBefore")}</button>
      <button class="mi danger" data-act="semRemove" data-sem="${n}" ${empty ? "" : "disabled"}>${icon("trash")}${empty ? t("sem.remove") : t("sem.removeFull")}</button>`;
  }
  UI.act.semMenu = (el) => UI.openMenu(el, semMenuHtml(+el.dataset.sem));

  /* module menu: status, grade, semester and the usual actions in one place */
  function moduleMenu(m) {
    const S = Store.get();
    const elective = !["A", "C"].includes(m.a);
    const cd = Engine.canDrop(Store.mods(), m);
    const name = m.choice && m.choice.length ? m.choice.map((o) => o.name).join(" / ") : m.name;
    const set = (k, v, on, label, cls = "", title = "") => `<button class="${on ? "on" : ""} ${cls}" data-act="ctxSet" data-id="${m.id}" data-k="${k}" data-v="${v}"${title ? ` title="${esc(title)}"` : ""}>${label}</button>`;
    const status = ["open", "done", "off"].map((s) => set("status", s, m.status === s, t("status." + s))).join("");
    const graded = Engine.counts(m) && !m.ungraded && m.status !== "off";
    const grades = graded ? `<div class="mlabel">${m.status === "done" ? t("col.grade") : t("f.goalGrade")}</div>
      <div class="ctx-row ctx-grades">${GRADES.map((g) => set("grade", g, m.gradeSet || m.status === "done" ? Math.abs(+m.grade - g) < 1e-9 : false, fmtG(g), "tone-" + tone(g))).join("")}
        ${m.status === "open" ? set("grade", "auto", !m.gradeSet, `≈ ${t("grade.auto")}`, "auto", UI.autoTitle(m)) : ""}</div>` : "";
    const sems = S.sems.map((_, i) => i + 1).filter((n) => semInfo(n).t !== "u" && (semInfo(n).t !== "a" || m.abroad));
    const move = `<div class="mlabel">${t("ctx.move")}</div><div class="ctx-row ctx-sems">${sems.map((n) => set("sem", n, +m.sem === n, semInfo(n).fach + ".", semInfo(n).t === "a" ? "abroad" : "", semLabel(n))).join("")}
      ${elective ? set("sem", "", !m.sem, t("ctx.pool"), "pool") : ""}</div>`;
    const doBtn = (d, ic, label, cls = "") => `<button class="mi ${cls}" data-act="ctxDo" data-do="${d}" data-id="${m.id}">${icon(ic)}${label}</button>`;
    return `<div class="mhead a-${m.a}">${esc(name)}<small>${esc(areaShort(m.a))} · ${fmt(+m.cp, 0)} CP</small></div>
      <div class="mlabel">${t("col.status")}</div><div class="ctx-row">${status}</div>${grades}${move}<hr>
      ${doBtn("open", "dots", t("ctx.open"))}
      ${elective && m.status === "open" && !m.choice ? doBtn("toChoice", "list", t("choice.convert")) : ""}
      ${cd.ok && elective ? doBtn("drop", "x", t("btn.drop")) : ""}
      ${m.fixed ? "" : doBtn("del", "trash", t("remove"), "danger")}`;
  }
  function bandMenu(a) {
    return `<div class="mhead a-${a}">${esc(areaName(a))}</div>
      <button class="mi" data-act="ctxDo" data-do="catalog" data-area="${a}">${icon("book")}${t("btn.catalog")}</button>
      <button class="mi" data-act="ctxDo" data-do="newChoice" data-area="${a}">${icon("list")}${t("choice.new")}</button>
      <button class="mi" data-act="ctxDo" data-do="custom" data-area="${a}">${icon("plus")}${t("btn.custom")}</button>`;
  }
  UI.act.ctxDo = (el, e) => { UI.closeMenu(); const f = UI.act[el.dataset.do]; if (f) f(el, e); };
  UI.act.ctxSet = (el) => {
    UI.closeMenu();
    const { id, k, v } = el.dataset;
    if (!Store.byId(id)) return;
    if (k === "status") Store.updateModule(id, { status: v });
    else if (k === "grade") Store.updateModule(id, v === "auto" ? { gradeSet: false } : { grade: +v });
    else if (k === "sem") Store.updateModule(id, { sem: v ? +v : undefined });
  };
  document.addEventListener("contextmenu", (e) => {
    if (e.target.closest("#menu")) { e.preventDefault(); return; }
    const view = document.getElementById("view");
    if (!view || view.dataset.view !== "plan" || state.planMode !== "grid") return;
    const mod = e.target.closest(".box[data-id], .bchip[data-id]");
    const sem = e.target.closest(".phead[data-sem], .pcol[data-sem]");
    const bandEl = e.target.closest(".band[data-band]");
    const el = mod || sem || bandEl;
    let html = "";
    if (mod) { const m = Store.byId(mod.dataset.id); if (m) html = moduleMenu(m); }
    else if (sem) html = semMenuHtml(+sem.dataset.sem);
    else if (bandEl && bandEl.dataset.band !== "core") html = bandMenu(bandEl.dataset.band);
    if (!html) { UI.closeMenu(); return; }
    e.preventDefault();
    // keyboard (Shift+F10 / menu key) has no pointer position: open at the element
    let x = e.clientX, y = e.clientY;
    if (!x && !y) { const r = el.getBoundingClientRect(); x = r.left + 8; y = r.bottom - 4; }
    UI.openMenuAt(x, y, html, "ctx");
  });
  UI.act.semType = (el) => { UI.closeMenu(); const err = Store.setSemType(+el.dataset.sem, el.dataset.t); if (err) UI.toast(t(err), "bad"); };
  UI.act.semInsert = (el) => { UI.closeMenu(); Store.insertSem(+el.dataset.sem); };
  UI.act.semRemove = (el) => { UI.closeMenu(); const err = Store.removeSem(+el.dataset.sem); if (err) UI.toast(t(err), "bad"); };
  UI.act.addSem = (el) => { state.planScroll = "end"; const n = Store.addSem(el.dataset.t); UI.toast(t("sem.added", { label: semLabel(n) })); };
  UI.act.planMode = (el) => { state.planMode = el.dataset.v; UI.render(); };
  UI.act.addAbroad = (el) => {
    const m = Store.addModule({ a: "B112", g: "KI", abroad: true, code: "", name: t("abroad.newName"), cp: 6, sem: +el.dataset.sem, status: "open", grade: 2.0 });
    UI.openModule(m.id);
  };
  UI.act.newChoice = (el) => {
    const a = el.dataset.area;
    const m = Store.addModule({ a, g: a === "B112" ? "KI" : a === "B12" ? "SEM" : null, code: "", name: t("choice.blockName", { area: areaShort(a) }), cp: a === "B12" ? 3 : a === "B2" ? 5 : a === "B111" ? 5 : 6, choice: [] });
    UI.openCatalog(a, "choice", m.id);
  };

  /* export: PNG via html-to-image (lazy-loaded), PDF via the print dialog */
  UI.act.exportMenu = (el) => UI.openMenu(el, `<button class="mi" data-act="exportPng">${icon("image")}${t("plan.png")}</button><button class="mi" data-act="exportPdf">${icon("print")}${t("plan.pdf")}</button>`);
  UI.act.exportPng = async () => {
    UI.closeMenu();
    if (state.planMode !== "grid") { state.planMode = "grid"; UI.render(); }
    const node = $("#plan-export"), grid = $("#pgrid"); if (!node || !grid) return;
    UI.toast(t("plan.pngWorking"));
    try {
      if (!window.htmlToImage) await UI.loadScript("vendor/html-to-image/html-to-image.js");
      const bg = getComputedStyle(document.body).backgroundColor;
      // drop the "+" column by switching the grid to N columns (filtering cells out would shift the layout),
      // then widen the block to the full grid so the bands below match it
      node.classList.add("exporting");
      node.style.width = grid.scrollWidth + "px";
      const opts = (skipFonts) => ({ pixelRatio: 2, backgroundColor: bg, skipFonts, width: node.scrollWidth, height: node.scrollHeight,
        filter: (n) => !(n.classList && ["menu-btn", "bacts", "add-abroad", "ctx-hint"].some((c) => n.classList.contains(c))) });
      let url;
      // file:// forbids reading stylesheets, so fonts can only be embedded when served over http(s)
      const local = location.protocol === "file:";
      try { url = await window.htmlToImage.toPng(node, opts(local)); } catch (e) { url = await window.htmlToImage.toPng(node, opts(true)); }
      finally { node.classList.remove("exporting"); node.style.width = ""; }
      const a = document.createElement("a"); a.href = url; a.download = `studienplan-${new Date().toISOString().slice(0, 10)}.png`; a.click();
    } catch (e) { console.error(e); UI.toast(t("plan.pngFail"), "bad"); }
  };
  UI.act.exportPdf = () => {
    UI.closeMenu();
    if (state.planMode !== "grid") { state.planMode = "grid"; UI.render(); }
    const node = $("#plan-export");
    document.body.classList.add("print-plan");
    const fit = Math.min(1, 1050 / node.scrollWidth);
    node.style.zoom = fit;
    const done = () => { document.body.classList.remove("print-plan"); node.style.zoom = ""; window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    window.print();
  };
})();
