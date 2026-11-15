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

  const weekday = (iso) => new Date(iso + "T00:00:00").toLocaleDateString(UI.L() === "de" ? "de-DE" : "en-GB", { weekday: "short" }).replace(".", "");
  const nsChip = (m) => {
    const st = typeof GradeStats !== "undefined" ? GradeStats.summary(m.code) : null;
    if (!st || st.n < 20) return "";
    const fr = Math.round(st.failRate * 100);
    return `<span class="chip ns-chip ${fr >= 30 ? "risk" : ""}" title="${esc(t("ns.chipTitle", { n: st.n, exams: st.exams }))}">Ø ${fmt(st.avgPassed)} · ${fr} % ${t("ns.failWord")}</span>`;
  };
  const att = (m) => ((m.attempts || 0) >= 2 ? pill("bad sens", t("att.last")) : m.attempts === 1 ? pill("warn sens", t("att.second")) : "");
  const nameBtn = (m) => `<button class="linklike mname" data-act="open" data-id="${m.id}">${esc(m.name)}</button>`;
  /* the term the exam list is about: the schedule's, else today's */
  function currentTerm(ed) {
    if (ed && ed.term) return ed.term;
    const d = new Date(), y = d.getFullYear() % 100, mo = d.getMonth() + 1;
    return mo >= 10 ? `WiSe ${y}/${y + 1}` : mo <= 3 ? `WiSe ${y - 1}/${y}` : `SoSe ${y}`;
  }

  /* my exams this term in date order, with the days in between ("5 Tage bis zur nächsten") */
  function timeline(rows, clash) {
    const out = [];
    rows.forEach(({ m, ex }, i) => {
      if (i) {
        const gap = Math.round((Date.parse(ex.date) - Date.parse(rows[i - 1].ex.date)) / 864e5);
        out.push(`<li class="xgap ${gap <= 2 ? "tight" : ""}"><span>${gap === 0 ? t("ex.sameDay") : t("ex.gap", { n: gap })}</span></li>`);
      }
      const d = daysUntil(ex.date), cl = clash.get(m.id);
      out.push(`<li class="xr ${cl ? "clash" : ""}">
        <div class="xd"><b>${dateShort(ex.date)}</b><span>${weekday(ex.date)}${ex.start ? " · " + when(ex) : ""}</span></div>
        <div class="xm">${nameBtn(m)}
          <div class="meta"><span>${areaShort(m.a)}</span><span>${fmt(+m.cp, 0)} CP</span>${att(m)}${nsChip(m)}${!ex.official ? `<span class="chip">${t("ex.ownDate")}</span>` : ex.otherTerm ? `<span class="chip">${t("ex.fromEarlier")}</span>` : ""}</div>
          ${cl ? `<div class="xclash">${icon("warn", "ic")}<span>${t("ed.clash", { other: esc(cl.join(", ")) })}</span></div>` : ""}</div>
        <div class="xc ${d <= 7 ? "soon" : ""}">${countdown(d)}</div></li>`);
    });
    return `<ul class="xlist">${out.join("")}</ul>`;
  }

  UI.views.exams = (c) => {
    const S = Store.get(), ed = ExamDates.get(), term = currentTerm(ed), cur = UI.termOrd(term);
    const semOrd = (m) => (m.sem ? UI.termOrd(UI.semInfo(+m.sem).term.label) : null);
    const all = c.ms.filter((m) => m.status === "open" && !m.ungraded && !m.choice).map((m) => ({ m, ex: UI.examOf(m) }));
    const upcoming = all.filter((x) => x.ex && daysUntil(x.ex.date) >= 0).sort((a, b) => (a.ex.date + a.ex.start).localeCompare(b.ex.date + b.ex.start));
    const pending = all.filter((x) => x.ex && daysUntil(x.ex.date) < 0).sort((a, b) => b.ex.date.localeCompare(a.ex.date));
    const noDate = all.filter((x) => !x.ex && semOrd(x.m) === cur);
    const used = new Set([...upcoming, ...pending, ...noDate].map((x) => x.m.id));
    const later = all.filter((x) => !used.has(x.m.id));
    const clash = clashes(upcoming);
    const dropped = c.ms.filter((m) => m.status === "dropped");
    const budgets = Engine.abwahlAreas().map((x) => {
      const n = Engine.abwahlUsed(c.ms, x.key);
      return `<div class="budget a-${x.a} ${n ? "used" : ""}" style="--c:var(--a-${x.a})"><span>${esc(x.g ? groupName("B112", x.g) : areaShort("B111"))}</span><b>${n}/1</b></div>`;
    }).join("") + `<div class="budget free" style="--c:var(--a-B12)"><span>${areaShort("B12")}</span><b>∞</b></div><div class="budget free" style="--c:var(--a-B2)"><span>${areaShort("B2")}</span><b>∞</b></div>`;

    // "Später": grouped by semester; modules still open from earlier semesters come first
    const groups = new Map();
    for (const x of later.sort((a, b) => (semOrd(a.m) ?? 999) - (semOrd(b.m) ?? 999))) {
      const o = semOrd(x.m), key = o == null ? t("ex.noSem") : o < cur ? t("ex.earlier") : UI.semLabel(+x.m.sem);
      (groups.get(key) || groups.set(key, []).get(key)).push(x);
    }
    const laterHtml = [...groups].map(([label, xs]) => `<div class="lgrp"><h3>${esc(label)}</h3><ul>${xs.map(({ m }) => {
      const sch = UI.scheduleExam(m);
      return `<li><span class="sw" style="background:var(--a-${m.a})"></span>${nameBtn(m)}<span class="muted fine">${fmt(+m.cp, 0)} CP</span>${att(m)}${sch ? `<span class="fine muted">${t("ex.alsoNow", { term: esc(ed.term), d: dateShort(sch.date) })}</span>` : ""}</li>`;
    }).join("")}</ul></div>`).join("");

    const viewMode = state.examsViewMode || "calendar";

    let mainHeroHtml = "";
    if (viewMode === "calendar" && typeof UI.renderCalendar === "function") {
      mainHeroHtml = UI.renderCalendar(c);
    } else if (viewMode === "tracker" && typeof UI.renderTracker === "function") {
      mainHeroHtml = UI.renderTracker(c);
    } else {
      // Timeline Mode
      mainHeroHtml = `
        <div class="cal-top-bar" style="margin-bottom:12px">
          <h2>📋 ${t("ex.thisTerm", { term: esc(term) })}</h2>
          <div class="cal-top-actions">
            <div class="seg-ctrl" role="tablist">
              <button class="seg-btn" data-act="setExamsMode" data-v="calendar" title="Kalender">📅 ${t("cal.tabCal") || "Kalender"}</button>
              <button class="seg-btn" data-act="setExamsMode" data-v="tracker" title="Lernfortschritt">📊 ${t("cal.tabTracker") || "Lernfortschritt"}</button>
              <button class="seg-btn active" data-act="setExamsMode" data-v="timeline" title="Timeline">📋 ${t("cal.tabTimeline") || "Timeline"}</button>
            </div>
          </div>
        </div>
        <section class="card"><header class="sec-h"><h2>${t("ex.thisTerm", { term: esc(term) })}</h2>
            <span class="sub">${upcoming.length ? t("ex.count", { n: upcoming.length }) : ""}</span></header>
          ${upcoming.length ? timeline(upcoming, clash) : `<p class="empty">${ed ? t("ed.noneMine", { term: esc(ed.term) }) : t("exams.noneYet")}</p>`}
          ${noDate.length ? `<div class="nodate"><h3>${t("ex.noDate")}</h3><p class="fine">${t("ex.noDateSub")}</p>${noDate.map(({ m }) => `<div class="nd-row">${nameBtn(m)}${att(m)}<input type="date" data-id="${m.id}" data-f="examDate" data-key="ed-${m.id}" aria-label="${t("col.date")}"></div>`).join("")}</div>` : ""}
        </section>
      `;
    }

    return `
      <div class="page-head"><div><h1>${t("exams.title")}</h1><p class="lede">${t("exams.lede")}</p></div>
        <div class="head-actions">
          <button class="btn" data-act="openIcsDialog">${icon("download")}${t("ed.ics") || "Kalender (.ics)"}</button>
        </div>
      </div>

      ${mainHeroHtml}

      ${sourceCard(ed)}

      ${pending.length ? `<section class="card"><h2>${t("ex.pending")}</h2><p class="fine" style="margin-top:-6px">${t("ex.pendingSub")}</p>
        <ul class="pend">${pending.map(({ m, ex }) => `<li><span class="fine muted">${dateShort(ex.date)}</span>${nameBtn(m)}${att(m)}<button class="btn sm primary" data-act="open" data-id="${m.id}">${t("ex.enterGrade")}</button></li>`).join("")}</ul></section>` : ""}
      ${later.length ? `<details class="card later" ${state.laterOpen ? "open" : ""}><summary><h2>${t("ex.later")}</h2><span class="sub">${t("ex.laterSub", { n: later.length })}</span></summary>${laterHtml}</details>` : ""}
      ${allList(ed, c)}
      <div class="grid2">
        <section class="card"><h2>${t("abwahl.title")}</h2><p class="fine" style="margin-top:-6px">${t("abwahl.text")} ${t("ex.dropHow")}</p><div class="budgets">${budgets}</div></section>
        <section class="card"><h2>${t("oral.title")}</h2><p class="fine" style="margin-top:-6px">${t("oral.text")}</p>
          <label class="switch"><input type="checkbox" data-act-change="oral" data-key="oral" ${S.oral ? "checked" : ""}><span>${S.oral ? t("oral.used") : t("oral.free")}</span></label>
          ${S.oral ? `<input type="text" class="wide" placeholder="${t("oral.which")}" value="${esc(S.oral.module || "")}" data-act-change="oralWhich" data-key="oralw">` : ""}</section>
      </div>
      ${dropped.length ? `<section class="card"><h2>${t("dropped.title")}</h2><ul class="hints">${dropped.map((m) => `<li class="hint info"><span class="hdot"></span><span class="htxt">${esc(m.name)} · ${areaShort(m.a)}${m.g ? " · " + esc(groupName(m.a, m.g)) : ""}</span><button class="btn sm" data-act="undrop" data-id="${m.id}">${t("btn.undrop")}</button></li>`).join("")}</ul></section>` : ""}`;
  };

  UI.after.exams = () => {
    if ((state.examsViewMode || "calendar") === "calendar" && typeof UI.afterCalendar === "function") {
      UI.afterCalendar();
    }
    const q = $("#ed-q");
    const filter = () => { const v = (q.value || "").trim().toLowerCase(); state.edQ = v; $$("#ed-rows tr").forEach((r) => { r.hidden = v && !r.dataset.q.includes(v); }); };
    if (q) { q.addEventListener("input", filter); filter(); }
    const det = $(".ed-all"); if (det) det.addEventListener("toggle", () => { state.edAllOpen = det.open; });
    const lat = $(".later"); if (lat) lat.addEventListener("toggle", () => { state.laterOpen = lat.open; });
    const f = $(".ed-file");
    if (f) f.addEventListener("change", async () => {
      if (!f.files[0]) return;
      try { const d = await ExamDates.fromFile(f.files[0]); UI.toast(t("ed.loaded", { n: d.exams.length, term: d.term }), "good"); }
      catch (e) { console.error(e); UI.toast(t(e.message === "xlsx.unsupported" ? "ed.unsupported" : "ed.badFile"), "bad"); }
    });
  };

  UI.act.edForget = () => ExamDates.forget();
  UI.act.edReset = (el) => Store.updateModule(el.dataset.id, { examDate: "" });

  /* Enhanced .ics export dialog & generator */
  UI.act.openIcsDialog = () => {
    const body = `
      <form id="ics-export-form" class="modal-form">
        <p class="fine">${t("ics.intro") || "Wähle aus, welche Kalender-Einträge in die .ics-Datei exportiert werden sollen:"}</p>
        <div class="cal-ics-options">
          <label class="switch">
            <input type="checkbox" id="ics-opt-exams" checked>
            <span>📝 <b>${t("ics.exams") || "Prüfungstermine (Klausuren)"}</b></span>
          </label>
          <label class="switch">
            <input type="checkbox" id="ics-opt-plans" checked>
            <span>📚 <b>${t("ics.plans") || "Lernphasen & Deadlines"}</b></span>
          </label>
          <label class="switch">
            <input type="checkbox" id="ics-opt-acad" checked>
            <span>🏛️ <b>${t("ics.acad") || "TU Darmstadt Semestertermine & Ferien"}</b></span>
          </label>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn" data-act="close">${t("btn.cancel") || "Abbrechen"}</button>
          <button type="submit" class="btn primary">${icon("download")}${t("ics.download") || "Exportieren (.ics)"}</button>
        </div>
      </form>
    `;
    UI.dialog(t("ics.title") || "Kalender exportieren (.ics)", body);

    $("#ics-export-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const incExams = $("#ics-opt-exams").checked;
      const incPlans = $("#ics-opt-plans").checked;
      const incAcad = $("#ics-opt-acad").checked;
      UI.closeModal();
      generateAndDownloadIcs({ incExams, incPlans, incAcad });
    });
  };

  function generateAndDownloadIcs({ incExams, incPlans, incAcad }) {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const dt = (d, hm) => d.replace(/-/g, "") + (hm ? "T" + hm.replace(":", "") + "00" : "");
    const nextDay = (d) => new Date(Date.parse(d) + 864e5).toISOString().slice(0, 10);
    const escI = (s) => (s || "").replace(/[\\;,]/g, (c) => "\\" + c).replace(/\n/g, "\\n");

    const events = [];

    // 1. Exams
    if (incExams) {
      const ms = Store.mods().filter((m) => m.status === "open" && !m.ungraded && !m.choice).map((m) => ({ m, ex: UI.examOf(m) })).filter((x) => x.ex && daysUntil(x.ex.date) >= 0);
      ms.forEach(({ m, ex }) => {
        const timed = !!ex.start;
        const start = timed ? `DTSTART:${dt(ex.date, ex.start)}` : `DTSTART;VALUE=DATE:${dt(ex.date)}`;
        const end = timed ? `DTEND:${dt(ex.date, ex.end || ex.start)}` : `DTEND;VALUE=DATE:${dt(nextDay(ex.date))}`;
        events.push([
          "BEGIN:VEVENT",
          `UID:${(m.code || m.id).replace(/[^\w-]/g, "")}-${ex.date}@notenplaner`,
          `DTSTAMP:${stamp}`,
          start,
          end,
          `SUMMARY:${escI(`Klausur: ${m.name}`)}`,
          `DESCRIPTION:${escI(`${m.code || ""} (${fmt(+m.cp, 0)} CP)`)}`,
          "END:VEVENT"
        ].join("\r\n"));
      });
    }

    // 2. Study Plans & Deadlines
    if (incPlans) {
      const plans = Store.studyPlans();
      plans.forEach((p) => {
        const timed = !p.allDay && !!p.startTime;
        const start = timed ? `DTSTART:${dt(p.startDate, p.startTime)}` : `DTSTART;VALUE=DATE:${dt(p.startDate)}`;
        const end = timed ? `DTEND:${dt(p.endDate, p.endTime || p.startTime)}` : `DTEND;VALUE=DATE:${dt(nextDay(p.endDate))}`;
        const prefix = p.type === "deadline" ? "⏰ Deadline: " : p.type === "note" ? "📌 Notiz: " : "📚 Lernphase: ";
        events.push([
          "BEGIN:VEVENT",
          `UID:${p.id}@notenplaner`,
          `DTSTAMP:${stamp}`,
          start,
          end,
          `SUMMARY:${escI(prefix + p.title)}`,
          p.note ? `DESCRIPTION:${escI(p.note)}` : "",
          "END:VEVENT"
        ].filter(Boolean).join("\r\n"));
      });
    }

    // 3. Academic Dates & Breaks
    if (incAcad && typeof AcademicCalendar !== "undefined") {
      const curYear = state.calYear || new Date().getFullYear();
      const acadEvents = AcademicCalendar.getAcademicEventsForRange(`${curYear}-01-01`, `${curYear + 1}-12-31`);
      acadEvents.forEach((ev) => {
        const start = `DTSTART;VALUE=DATE:${dt(ev.startDate)}`;
        const end = `DTEND;VALUE=DATE:${dt(nextDay(ev.endDate))}`;
        events.push([
          "BEGIN:VEVENT",
          `UID:${ev.id}@notenplaner`,
          `DTSTAMP:${stamp}`,
          start,
          end,
          `SUMMARY:${escI(ev.title)}`,
          "DESCRIPTION:Offizieller Termin der TU Darmstadt",
          "END:VEVENT"
        ].join("\r\n"));
      });
    }

    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Notenplaner//TU Darmstadt//DE", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n") + "\r\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "studienplaner.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    UI.toast(t("ics.downloaded") || ".ics Kalender heruntergeladen", "good");
  }
})();
