/* ==========================================================================
   Prüfungen — official dates (TU exam schedule), countdown, clashes, .ics,
   failed attempts, § 32 oral exam, Abwahl budget.
   ========================================================================== */
"use strict";

(() => {
  const { $, $$, esc, t, fmt, pill, areaShort, groupName, icon, daysUntil, dateShort, state } = UI;

  const when = (x) => (x.start ? `${x.start}${x.end ? "–" + x.end : ""}` : "");
  const countdown = (d) => (d === 0 ? t("today") : d === 1 ? t("tomorrow") : d > 0 ? t("inDays", { n: d }) : t("daysAgo", { n: -d }));
  const mins = (hhmm) => { const x = /^(\d{1,2}):(\d{2})$/.exec(hhmm || ""); return x ? +x[1] * 60 + +x[2] : null; };

  /* two of my exams on the same day whose times overlap (or whose times are unknown) */
  function clashes(list) {
    const out = new Map();
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      if (a.ex.date !== b.ex.date) continue;
      const a0 = mins(a.ex.start), a1 = mins(a.ex.end) ?? (a0 != null ? a0 + 120 : null), b0 = mins(b.ex.start), b1 = mins(b.ex.end) ?? (b0 != null ? b0 + 120 : null);
      const overlap = a0 == null || b0 == null || (a0 < b1 && b0 < a1);
      if (!overlap) continue;
      (out.get(a.m.id) || out.set(a.m.id, []).get(a.m.id)).push(b.m.name);
      (out.get(b.m.id) || out.set(b.m.id, []).get(b.m.id)).push(a.m.name);
    }
    return out;
  }

  function sourceCard(ed) {
    if (!ed) return `<section class="card ed-src empty-src"><div><h2>${t("ed.none.title")}</h2><p class="fine">${t("ed.none.text")}</p></div>
      <label class="btn">${icon("upload")}${t("ed.pick")}<input type="file" accept=".xlsx" class="ed-file" hidden></label></section>`;
    const own = ed.source !== "repo";
    return `<section class="card ed-src"><div>${icon("file", "ic")}<b>${t("ed.title", { term: esc(ed.term) })}</b>
        <span class="fine">${ed.modified ? t("ed.asOf", { d: dateShort(ed.modified) }) + " · " : ""}${t("ed.count", { n: ed.exams.length })} · ${own ? t("ed.ownFile", { f: esc(ed.source) }) : t("ed.repo")}</span></div>
      <span class="fine">${t("ed.disclaimer")}</span>
      ${own ? `<button class="btn sm ghost" data-act="edForget">${t("ed.forget")}</button>` : ""}</section>`;
  }

  function allList(ed, c) {
    if (!ed) return "";
    const mine = new Set(c.ms.map((m) => Tucan.baseCode(m.code || "")).filter(Boolean));
    const rows = ed.exams.map((e) => `<tr data-q="${esc((e.name + " " + e.code).toLowerCase())}"><td class="num">${dateShort(e.date)}</td><td class="num">${when(e)}</td>
      <td>${esc(e.name)}${e.second ? ` <span class="chip">${t("ed.second")}</span>` : ""}${mine.has(Tucan.baseCode(e.code)) ? ` ${pill("good", t("ed.inPlan"))}` : ""}<div class="meta"><span class="mono">${esc(e.code)}</span></div></td></tr>`).join("");
    return `<details class="card flush ed-all" ${state.edAllOpen ? "open" : ""}><summary class="card-h"><h2>${t("ed.all", { term: esc(ed.term) })}</h2><span class="sub">${t("ed.allSub", { n: ed.exams.length })}</span></summary>
      <div class="ed-search"><input type="search" id="ed-q" placeholder="${t("ed.search")}" value="${esc(state.edQ || "")}"></div>
      <div class="tscroll"><table class="tbl"><thead><tr><th>${t("ed.date")}</th><th>${t("ed.time")}</th><th>${t("col.module")}</th></tr></thead><tbody id="ed-rows">${rows}</tbody></table></div></details>`;
  }

  UI.views.exams = (c) => {
    const S = Store.get(), ed = ExamDates.get();
    const open = c.ms.filter((m) => m.status === "open" && !m.ungraded && !m.choice)
      .map((m) => ({ m, ex: UI.examOf(m) }))
      .sort((a, b) => ((a.ex && a.ex.date) || "9999").localeCompare((b.ex && b.ex.date) || "9999") || (a.m.sem || 99) - (b.m.sem || 99));
    const upcoming = open.filter((x) => x.ex && daysUntil(x.ex.date) >= 0);
    const clash = clashes(upcoming);
    const dropped = c.ms.filter((m) => m.status === "dropped");
    const budgets = Engine.abwahlAreas().map((x) => {
      const used = Engine.abwahlUsed(c.ms, x.key);
      return `<div class="budget a-${x.a} ${used ? "used" : ""}" style="--c:var(--a-${x.a})"><span>${esc(x.g ? groupName("B112", x.g) : areaShort("B111"))}</span><b>${used}/1</b></div>`;
    }).join("") + `<div class="budget free" style="--c:var(--a-B12)"><span>${areaShort("B12")}</span><b>∞</b></div><div class="budget free" style="--c:var(--a-B2)"><span>${areaShort("B2")}</span><b>∞</b></div>`;
    const att = (m) => ((m.attempts || 0) >= 2 ? " " + pill("bad", t("att.last")) : m.attempts === 1 ? " " + pill("warn", t("att.second")) : "");
    return `
      <div class="page-head"><div><h1>${t("exams.title")}</h1><p class="lede">${t("exams.lede")}</p></div>
        ${upcoming.length ? `<div class="head-actions"><button class="btn" data-act="edIcs">${icon("download")}${t("ed.ics")}</button></div>` : ""}</div>
      ${sourceCard(ed)}
      <section class="card"><h2>${t("exams.upcoming")}</h2>${upcoming.length ? `<ul class="upc">${upcoming.map(({ m, ex }) => {
        const d = daysUntil(ex.date), cl = clash.get(m.id);
        return `<li class="${cl ? "clash" : ""}"><span class="date">${dateShort(ex.date)}${ex.start ? `<small>${when(ex)}</small>` : ""}</span>
          <span class="nm">${esc(m.name)}${att(m)}${cl ? `<div class="fine bad-txt">${icon("warn", "ic")} ${t("ed.clash", { other: esc(cl.join(", ")) })}</div>` : ""}</span>
          <span class="cd ${d <= 7 ? "soon" : ""}">${countdown(d)}</span></li>`;
      }).join("")}</ul>` : `<p class="empty">${ed ? t("ed.noneMine", { term: esc(ed.term) }) : t("exams.noneYet")}</p>`}</section>
      <section class="card flush"><header class="card-h"><h2>${t("exams.all")}</h2><span class="sub">${t("exams.allSub")}</span></header>
        <div class="tscroll"><table class="tbl ex"><thead><tr><th>${t("col.module")}</th><th>${t("col.date")}</th><th>${t("col.attempt")}</th><th class="hide-s">${t("col.rule")}</th><th></th></tr></thead><tbody>
        ${open.map(({ m, ex }) => {
          const cd = Engine.canDrop(c.ms, m), a = m.attempts || 0;
          const rule = m.a === "A" || m.a === "C" ? t("rule.pflicht") : m.a === "B12" || m.a === "B2" ? t("rule.six") : cd.ok ? t("rule.five") : t("rule.fiveUsed");
          const d = ex ? daysUntil(ex.date) : null;
          const note = !ex ? "" : ex.official ? `<div class="fine">${t("ed.official")}${ex.start ? " · " + when(ex) : ""}</div>`
            : ex.offDate ? `<div class="fine"><button class="linklike" data-act="edReset" data-id="${m.id}">↺ ${t("ed.resetTo", { d: dateShort(ex.offDate) })}</button></div>` : "";
          return `<tr class="${a >= 2 ? "risk" : ""}"><td class="cell-name" style="border-left:4px solid var(--a-${m.a})"><button class="linklike mname" data-act="open" data-id="${m.id}">${esc(m.name)}</button><div class="meta"><span>${areaShort(m.a)}</span><span>${fmt(+m.cp, 0)} CP</span>${m.sem ? `<span>${esc(UI.semLabel(+m.sem))}</span>` : ""}</div></td>
            <td><input type="date" value="${esc(ex ? ex.date : "")}" data-id="${m.id}" data-f="examDate" data-key="ed-${m.id}" aria-label="${t("col.date")}">${note}${d != null ? `<div class="fine ${d >= 0 && d <= 7 ? "soon" : ""}">${countdown(d)}</div>` : ""}</td>
            <td><select data-id="${m.id}" data-f="attempts" data-key="at-${m.id}" class="${a >= 2 ? "risk" : a === 1 ? "warnsel" : ""}" aria-label="${t("col.attempt")}">${[0, 1, 2].map((k) => `<option value="${k}" ${a === k ? "selected" : ""}>${t("att.opt" + k)}</option>`).join("")}</select></td>
            <td class="hide-s fine">${rule}</td>
            <td>${cd.ok ? `<button class="btn sm ghost" data-act="drop" data-id="${m.id}">${t("btn.drop")}</button>` : ""}</td></tr>`;
        }).join("")}</tbody></table></div></section>
      ${allList(ed, c)}
      <div class="grid2">
        <section class="card"><h2>${t("oral.title")}</h2><p class="fine" style="margin-top:-6px">${t("oral.text")}</p>
          <label class="switch"><input type="checkbox" data-act-change="oral" data-key="oral" ${S.oral ? "checked" : ""}><span>${S.oral ? t("oral.used") : t("oral.free")}</span></label>
          ${S.oral ? `<input type="text" class="wide" placeholder="${t("oral.which")}" value="${esc(S.oral.module || "")}" data-act-change="oralWhich" data-key="oralw">` : ""}</section>
        <section class="card"><h2>${t("abwahl.title")}</h2><p class="fine" style="margin-top:-6px">${t("abwahl.text")}</p><div class="budgets">${budgets}</div></section>
      </div>
      ${dropped.length ? `<section class="card"><h2>${t("dropped.title")}</h2><ul class="hints">${dropped.map((m) => `<li class="hint info"><span class="hdot"></span><span class="htxt">${esc(m.name)} · ${areaShort(m.a)}${m.g ? " · " + esc(groupName(m.a, m.g)) : ""}</span><button class="btn sm" data-act="undrop" data-id="${m.id}">${t("btn.undrop")}</button></li>`).join("")}</ul></section>` : ""}`;
  };

  UI.after.exams = () => {
    const q = $("#ed-q");
    const filter = () => { const v = (q.value || "").trim().toLowerCase(); state.edQ = v; $$("#ed-rows tr").forEach((r) => { r.hidden = v && !r.dataset.q.includes(v); }); };
    if (q) { q.addEventListener("input", filter); filter(); }
    const det = $(".ed-all"); if (det) det.addEventListener("toggle", () => { state.edAllOpen = det.open; });
    const f = $(".ed-file");
    if (f) f.addEventListener("change", async () => {
      if (!f.files[0]) return;
      try { const d = await ExamDates.fromFile(f.files[0]); UI.toast(t("ed.loaded", { n: d.exams.length, term: d.term }), "good"); }
      catch (e) { console.error(e); UI.toast(t(e.message === "xlsx.unsupported" ? "ed.unsupported" : "ed.badFile"), "bad"); }
    });
  };

  UI.act.edForget = () => ExamDates.forget();
  UI.act.edReset = (el) => Store.updateModule(el.dataset.id, { examDate: "" });

  /* calendar file with my upcoming exams (floating local times — students are in Darmstadt) */
  UI.act.edIcs = () => {
    const ms = Store.mods().filter((m) => m.status === "open" && !m.ungraded && !m.choice).map((m) => ({ m, ex: UI.examOf(m) })).filter((x) => x.ex && daysUntil(x.ex.date) >= 0);
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const dt = (d, hm) => d.replace(/-/g, "") + (hm ? "T" + hm.replace(":", "") + "00" : "");
    const escI = (s) => s.replace(/[\\;,]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
    const ev = ms.map(({ m, ex }) => {
      const timed = !!ex.start;
      const end = timed ? dt(ex.date, ex.end || ex.start) : dt(new Date(Date.parse(ex.date) + 864e5).toISOString().slice(0, 10));
      return ["BEGIN:VEVENT", `UID:${(m.code || m.id).replace(/[^\w-]/g, "")}-${ex.date}@notenplaner`, `DTSTAMP:${stamp}`,
        timed ? `DTSTART:${dt(ex.date, ex.start)}` : `DTSTART;VALUE=DATE:${dt(ex.date)}`, timed ? `DTEND:${end}` : `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${escI(t("ed.icsSummary", { name: m.name }))}`, "END:VEVENT"].join("\r\n");
    });
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Notenplaner//TU Darmstadt//DE", "CALSCALE:GREGORIAN", ...ev, "END:VCALENDAR"].join("\r\n") + "\r\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "pruefungen.ics"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
})();
