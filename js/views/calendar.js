/* ==========================================================================
   Calendar View — Monthly grid inspired by Apple Calendar / Fantastical.
   Multi-day spanning bars, drag-to-select, all-day default events,
   TU Darmstadt academic dates & automatic breaks, exam schedule integration,
   sticky notes, and mobile agenda mode.
   ========================================================================== */
"use strict";

(() => {
  const { $, $$, esc, t, fmt, icon, dateShort, state } = UI;

  // Initialize calendar view state
  if (!state.calYear) {
    const now = new Date();
    state.calYear = now.getFullYear();
    state.calMonth = now.getMonth(); // 0-indexed
  }
  state.calDragStart = null;
  state.calDragEnd = null;
  state.calSelectedDay = new Date().toISOString().slice(0, 10);

  const MONTH_NAMES_DE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const WEEKDAYS_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const WEEKDAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function monthTitle(y, m) {
    const names = UI.L() === "en" ? MONTH_NAMES_EN : MONTH_NAMES_DE;
    return `${names[m]} ${y}`;
  }

  function getIsoWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  function toIso(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  /* Generate 6 weeks x 7 days grid */
  function buildMonthMatrix(year, month) {
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
    const start = new Date(year, month, 1 - dayOfWeek);
    const todayIso = new Date().toISOString().slice(0, 10);

    const weeks = [];
    const cur = new Date(start);

    for (let w = 0; w < 6; w++) {
      const days = [];
      const weekNum = getIsoWeek(cur);
      for (let d = 0; d < 7; d++) {
        const iso = toIso(cur);
        days.push({
          date: new Date(cur),
          iso,
          dayNum: cur.getDate(),
          inMonth: cur.getMonth() === month,
          isToday: iso === todayIso,
          weekNum,
          dayIdx: d,
          weekIdx: w,
          isBreak: typeof AcademicCalendar !== "undefined" && AcademicCalendar.isBreakDay(iso),
          boundary: typeof AcademicCalendar !== "undefined" ? AcademicCalendar.getBoundaryEvent(iso) : null,
          holiday: typeof AcademicCalendar !== "undefined" ? AcademicCalendar.getHoliday(iso) : null,
        });
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push({ weekNum, days });
    }
    return weeks;
  }

  /* Color presets for study plans */
  const COLOR_PRESETS = [
    { id: "peach", bg: "#fed7aa", border: "#f97316", text: "#7c2d12", label: "Pfirsich" },
    { id: "lavender", bg: "#e9d5ff", border: "#a855f7", text: "#581c87", label: "Lavendel" },
    { id: "mint", bg: "#bbf7d0", border: "#22c55e", text: "#14532d", label: "Minze" },
    { id: "sky", bg: "#bae6fd", border: "#0ea5e9", text: "#0c4a6e", label: "Himmelblau" },
    { id: "rose", bg: "#fecdd3", border: "#f43f5e", text: "#881337", label: "Rosé" },
    { id: "amber", bg: "#fef08a", border: "#eab308", text: "#713f12", label: "Gelb/Bernstein" },
  ];

  /* Collect all events for display */
  function collectEvents(c, startIso, endIso) {
    const events = [];

    // 1. Academic dates & breaks
    if (typeof AcademicCalendar !== "undefined") {
      const acad = AcademicCalendar.getAcademicEventsForRange(startIso, endIso);
      events.push(...acad);
    }

    // 2. Exams (official + custom)
    const openMods = c.ms.filter((m) => m.status === "open" && !m.ungraded && !m.choice);
    for (const m of openMods) {
      const ex = UI.examOf(m);
      if (ex && ex.date && ex.date >= startIso && ex.date <= endIso) {
        events.push({
          id: `exam-${m.id}`,
          type: "exam",
          moduleId: m.id,
          code: m.code,
          title: m.name,
          startDate: ex.date,
          endDate: ex.date,
          allDay: !ex.start,
          startTime: ex.start || "",
          endTime: ex.end || "",
          a: m.a,
          attempts: m.attempts || 0,
          official: ex.official,
          m,
        });
      }
    }

    // 3. User Study Plans / Deadlines / Notes
    const plans = Store.studyPlans();
    for (const p of plans) {
      if (p.endDate >= startIso && p.startDate <= endIso) {
        events.push({
          ...p,
          isStudyPlan: true,
        });
      }
    }

    return events;
  }

  /* Segment multi-day events by calendar week */
  function getWeekSpanningBars(events, weekDays) {
    const weekStartIso = weekDays[0].iso;
    const weekEndIso = weekDays[6].iso;

    const spanning = [];
    for (const ev of events) {
      // Must be multi-day: startDate !== endDate (or type === "phase" / "academic-span" / "academic-break")
      const isMulti = ev.startDate !== ev.endDate || ev.type === "phase" || ev.type === "academic-span" || ev.type === "academic-break";
      if (!isMulti) continue;
      if (ev.endDate < weekStartIso || ev.startDate > weekEndIso) continue;

      const segStart = ev.startDate < weekStartIso ? weekStartIso : ev.startDate;
      const segEnd = ev.endDate > weekEndIso ? weekEndIso : ev.endDate;

      const startCol = weekDays.findIndex((d) => d.iso === segStart);
      const endCol = weekDays.findIndex((d) => d.iso === segEnd);

      if (startCol >= 0 && endCol >= 0) {
        spanning.push({
          ev,
          startCol,
          spanCols: endCol - startCol + 1,
          isStart: ev.startDate === segStart,
          isEnd: ev.endDate === segEnd,
        });
      }
    }

    // Sort: longer spans first, then earlier startCol, then academic breaks last
    spanning.sort((a, b) => {
      if (a.ev.subType === "semesterBreak") return 1;
      if (b.ev.subType === "semesterBreak") return -1;
      return b.spanCols - a.spanCols || a.startCol - b.startCol;
    });

    // Assign tracks (0, 1, 2...)
    const tracks = [];
    for (const item of spanning) {
      let tIdx = 0;
      while (true) {
        tracks[tIdx] = tracks[tIdx] || new Array(7).fill(false);
        let fits = true;
        for (let c = item.startCol; c < item.startCol + item.spanCols; c++) {
          if (tracks[tIdx][c]) { fits = false; break; }
        }
        if (fits) {
          for (let c = item.startCol; c < item.startCol + item.spanCols; c++) {
            tracks[tIdx][c] = true;
          }
          item.track = tIdx;
          break;
        }
        tIdx++;
      }
    }

    return spanning;
  }

  /* Render the calendar header with navigation and view toggle */
  function renderCalendarHeader(c) {
    const y = state.calYear, m = state.calMonth;
    const title = monthTitle(y, m);
    const viewMode = state.examsViewMode || "calendar";

    return `
      <div class="cal-top-bar">
        <div class="cal-nav-group">
          <button class="cal-nav-btn" data-act="calPrevYear" title="Vorheriges Jahr (<<)">«</button>
          <button class="cal-nav-btn" data-act="calPrevMonth" title="Vorheriger Monat (<)">‹</button>
          <button class="cal-today-badge" data-act="calToday" title="Heute">${t("today") || "Heute"}</button>
          <button class="cal-nav-btn" data-act="calNextMonth" title="Nächster Monat (>)">›</button>
          <button class="cal-nav-btn" data-act="calNextYear" title="Nächstes Jahr (>>)">»</button>
          <h2 class="cal-month-title">${esc(title)}</h2>
        </div>
        <div class="cal-top-actions">
          <button class="btn sm primary" data-act="openAddPlanModal">${icon("plus")}${t("cal.addEvent") || "+ Neuer Lernplan"}</button>
          <div class="seg-ctrl" role="tablist">
            <button class="seg-btn ${viewMode === "calendar" ? "active" : ""}" data-act="setExamsMode" data-v="calendar" title="Kalender">📅 ${t("cal.tabCal") || "Kalender"}</button>
            <button class="seg-btn ${viewMode === "tracker" ? "active" : ""}" data-act="setExamsMode" data-v="tracker" title="Lernfortschritt (Übungen & Folien)">📊 ${t("cal.tabTracker") || "Lernfortschritt"}</button>
            <button class="seg-btn ${viewMode === "timeline" ? "active" : ""}" data-act="setExamsMode" data-v="timeline" title="Timeline">📋 ${t("cal.tabTimeline") || "Timeline"}</button>
          </div>
        </div>
      </div>
    `;
  }

  /* Render a single day cell */
  function renderDayCell(day, singleEvents) {
    const { iso, dayNum, inMonth, isToday, isBreak, boundary } = day;
    const isSelected = iso === state.calSelectedDay;

    let boundaryHtml = "";
    if (boundary) {
      const cls = boundary.type === "lectureStart" ? "bound-start" : "bound-end";
      const iconTxt = boundary.type === "lectureStart" ? "🚀" : "🏁";
      boundaryHtml = `<div class="cal-boundary-badge ${cls}" title="${esc(boundary.title)}">${iconTxt} ${esc(boundary.title)}</div>`;
    }

    const itemsHtml = singleEvents.map((ev) => {
      if (ev.type === "exam") {
        const timeStr = ev.startTime ? `${ev.startTime}` : "";
        const areaCls = `a-${ev.a || "A"}`;
        const attStr = ev.attempts >= 2 ? ` <span class="cal-att-warn">(${ev.attempts}. Vers.)</span>` : "";
        return `
          <div class="cal-event-item cal-exam-item ${areaCls}" data-act="openExamDetail" data-id="${ev.moduleId}" title="${esc(ev.title)}${ev.startTime ? ` (${ev.startTime})` : ""}">
            <span class="cal-ev-dot" style="background:var(--${areaCls}, #2470ad)"></span>
            <span class="cal-ev-title"><b>${timeStr ? timeStr + " " : ""}</b>${esc(ev.code || ev.title)}${attStr}</span>
          </div>`;
      }
      if (ev.type === "note") {
        return `
          <div class="cal-sticky-note" style="--note-bg:${ev.color || "#fef08a"}" data-act="editStudyPlan" data-id="${ev.id}" title="${esc(ev.title)}">
            <span class="cal-note-pin">📌</span>
            <span class="cal-note-txt">${esc(ev.title)}</span>
          </div>`;
      }
      // Deadlines & single-day sessions
      const isDl = ev.type === "deadline";
      const iconMark = isDl ? "⏰" : "📚";
      const doneCls = ev.done ? "is-done" : "";
      const timeStr = !ev.allDay && ev.startTime ? `${ev.startTime} ` : "";
      return `
        <div class="cal-event-item ${isDl ? "cal-deadline-item" : "cal-session-item"} ${doneCls}" style="--ev-c:${ev.color || "#fed7aa"}" data-act="editStudyPlan" data-id="${ev.id}" title="${esc(ev.title)}">
          <span class="cal-ev-icon">${iconMark}</span>
          <span class="cal-ev-title"><b>${timeStr}</b>${esc(ev.title)}</span>
        </div>`;
    }).join("");

    return `
      <div class="cal-day-cell ${inMonth ? "" : "not-in-month"} ${isToday ? "today" : ""} ${isBreak ? "break-day" : ""} ${isSelected ? "selected" : ""}"
           data-iso="${iso}">
        <div class="cal-day-head">
          <span class="cal-day-num">${dayNum}</span>
          ${isBreak ? `<span class="cal-break-indicator" title="Vorlesungsfreie Zeit">☕</span>` : ""}
        </div>
        ${boundaryHtml}
        <div class="cal-day-events">${itemsHtml}</div>
      </div>
    `;
  }

  /* Render spanning banner bar */
  function renderSpanningBar(span) {
    const { ev, startCol, spanCols, isStart, isEnd, track } = span;
    const isAcad = ev.type === "academic-span" || ev.type === "academic-break";
    const bg = ev.color || "#fed7aa";
    const iconMark = ev.subType === "holiday" ? "🎄 " : ev.subType === "semesterBreak" ? "🏖️ " : "📚 ";
    const clickAct = isAcad ? "" : `data-act="editStudyPlan" data-id="${ev.id}"`;

    return `
      <div class="cal-span-bar track-${track} ${isStart ? "start-edge" : ""} ${isEnd ? "end-edge" : ""} ${isAcad ? "is-acad" : ""}"
           style="grid-column:${startCol + 1} / span ${spanCols}; grid-row:${track + 1}; --bar-bg:${bg}"
           ${clickAct}
           title="${esc(ev.title)} (${dateShort(ev.startDate)} – ${dateShort(ev.endDate)})">
        <span class="cal-bar-txt">${iconMark}<b>${esc(ev.title)}</b></span>
      </div>
    `;
  }

  /* Main Calendar View HTML */
  UI.renderCalendar = (c) => {
    const y = state.calYear, m = state.calMonth;
    const weeks = buildMonthMatrix(y, m);
    const gridStartIso = weeks[0].days[0].iso;
    const gridEndIso = weeks[5].days[6].iso;

    const allEvents = collectEvents(c, gridStartIso, gridEndIso);
    const weekdays = UI.L() === "en" ? WEEKDAYS_EN : WEEKDAYS_DE;

    const weeksHtml = weeks.map((w) => {
      const spanningBars = getWeekSpanningBars(allEvents, w.days);
      const maxTrack = spanningBars.reduce((max, s) => Math.max(max, s.track), -1);

      const spanTrackHtml = maxTrack >= 0 ? `
        <div class="cal-spanning-container" style="grid-template-rows: repeat(${maxTrack + 1}, 24px)">
          ${spanningBars.map(renderSpanningBar).join("")}
        </div>
      ` : "";

      const daysHtml = w.days.map((day) => {
        // Filter single-day events for this specific day
        const dayEvents = allEvents.filter((ev) => {
          const isMulti = ev.startDate !== ev.endDate || ev.type === "phase" || ev.type === "academic-span" || ev.type === "academic-break";
          return !isMulti && ev.startDate === day.iso;
        });
        return renderDayCell(day, dayEvents);
      }).join("");

      return `
        <div class="cal-week-row">
          <div class="cal-week-num" title="Kalenderwoche ${w.weekNum}">W${w.weekNum}</div>
          <div class="cal-week-grid">
            ${spanTrackHtml}
            <div class="cal-days-layer">${daysHtml}</div>
          </div>
        </div>
      `;
    }).join("");

    // Selected day agenda (for mobile / quick inspection)
    const selIso = state.calSelectedDay;
    const selEvents = allEvents.filter((ev) => selIso >= ev.startDate && selIso <= ev.endDate);
    const selDayName = new Date(selIso + "T00:00:00").toLocaleDateString(UI.L() === "de" ? "de-DE" : "en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const agendaHtml = `
      <div class="cal-mobile-agenda">
        <div class="cal-agenda-head">
          <h3>${esc(selDayName)}</h3>
          <button class="btn sm" data-act="openAddPlanModal" data-iso="${selIso}">${icon("plus")}${t("cal.addForDay") || "+ Eintrag"}</button>
        </div>
        ${selEvents.length ? `<ul class="cal-agenda-list">${selEvents.map((ev) => `
          <li class="cal-agenda-item ${ev.type}">
            <div class="cal-ag-time">${ev.allDay ? (t("cal.allDay") || "Ganztägig") : `${ev.startTime}–${ev.endTime}`}</div>
            <div class="cal-ag-title"><b>${esc(ev.title)}</b>${ev.note ? `<p class="fine">${esc(ev.note)}</p>` : ""}</div>
            ${ev.isStudyPlan ? `<button class="btn sm ghost" data-act="editStudyPlan" data-id="${ev.id}">${icon("edit") || "✎"}</button>` : ""}
          </li>
        `).join("")}</ul>` : `<p class="empty fine">${t("cal.noEventsDay") || "Keine Termine an diesem Tag."}</p>`}
      </div>
    `;

    return `
      <div class="card flush cal-card">
        ${renderCalendarHeader(c)}
        <div class="cal-grid-header">
          <div class="cal-wn-head">KW</div>
          <div class="cal-wd-group">
            ${weekdays.map((wd) => `<div class="cal-wd-col">${wd}</div>`).join("")}
          </div>
        </div>
        <div class="cal-weeks-wrapper" id="cal-weeks-wrapper">
          ${weeksHtml}
        </div>
        ${agendaHtml}
      </div>
    `;
  };

  /* Event Handlers & Drag-to-Select Logic */
  UI.afterCalendar = () => {
    const wrapper = $("#cal-weeks-wrapper");
    if (!wrapper) return;

    let isDragging = false;
    let dragStartIso = null;
    let dragEndIso = null;

    const clearDragHighlight = () => {
      $$(".cal-day-cell.cal-drag-highlight").forEach((el) => el.classList.remove("cal-drag-highlight"));
    };

    const applyDragHighlight = (iso1, iso2) => {
      clearDragHighlight();
      if (!iso1 || !iso2) return;
      const min = iso1 < iso2 ? iso1 : iso2;
      const max = iso1 < iso2 ? iso2 : iso1;
      $$(".cal-day-cell").forEach((el) => {
        const iso = el.dataset.iso;
        if (iso && iso >= min && iso <= max) {
          el.classList.add("cal-drag-highlight");
        }
      });
    };

    // Mousedown on day cell
    wrapper.addEventListener("mousedown", (e) => {
      // Don't drag if clicking directly on an action button or existing event
      if (e.target.closest("[data-act]")) return;
      const cell = e.target.closest(".cal-day-cell");
      if (!cell || !cell.dataset.iso) return;

      isDragging = true;
      dragStartIso = cell.dataset.iso;
      dragEndIso = dragStartIso;
      applyDragHighlight(dragStartIso, dragEndIso);
    });

    // Mouseenter across day cells
    wrapper.addEventListener("mouseover", (e) => {
      if (!isDragging || !dragStartIso) return;
      const cell = e.target.closest(".cal-day-cell");
      if (!cell || !cell.dataset.iso) return;
      if (cell.dataset.iso !== dragEndIso) {
        dragEndIso = cell.dataset.iso;
        applyDragHighlight(dragStartIso, dragEndIso);
      }
    });

    // Mouseup anywhere in document
    const onMouseUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      clearDragHighlight();

      if (dragStartIso && dragEndIso) {
        const min = dragStartIso < dragEndIso ? dragStartIso : dragEndIso;
        const max = dragStartIso < dragEndIso ? dragEndIso : dragStartIso;
        state.calSelectedDay = min;
        // Open modal pre-filled with selected date range!
        UI.openAddStudyPlanModal({ startDate: min, endDate: max });
      }
      dragStartIso = null;
      dragEndIso = null;
    };

    document.addEventListener("mouseup", onMouseUp, { once: true });

    // Cell click (for mobile or single tap)
    wrapper.addEventListener("click", (e) => {
      if (e.target.closest("[data-act]")) return;
      const cell = e.target.closest(".cal-day-cell");
      if (!cell || !cell.dataset.iso) return;
      state.calSelectedDay = cell.dataset.iso;
      $$(".cal-day-cell.selected").forEach((el) => el.classList.remove("selected"));
      cell.classList.add("selected");
      // Update mobile agenda without full rerender
      const agendaHead = $(".cal-mobile-agenda h3");
      if (agendaHead) {
        UI.render();
      }
    });
  };

  /* Calendar Actions */
  Object.assign(UI.act, {
    calPrevMonth: () => {
      state.calMonth--;
      if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
      UI.render();
    },
    calNextMonth: () => {
      state.calMonth++;
      if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
      UI.render();
    },
    calPrevYear: () => {
      state.calYear--;
      UI.render();
    },
    calNextYear: () => {
      state.calYear++;
      UI.render();
    },
    calToday: () => {
      const now = new Date();
      state.calYear = now.getFullYear();
      state.calMonth = now.getMonth();
      state.calSelectedDay = now.toISOString().slice(0, 10);
      UI.render();
    },
    setExamsMode: (el) => {
      state.examsViewMode = el.dataset.v;
      UI.render();
    },
    openExamDetail: (el) => {
      UI.openModule(el.dataset.id);
    },
    openAddPlanModal: (el) => {
      const iso = (el && el.dataset && el.dataset.iso) || state.calSelectedDay || new Date().toISOString().slice(0, 10);
      UI.openAddStudyPlanModal({ startDate: iso, endDate: iso });
    },
    editStudyPlan: (el) => {
      const id = el.dataset.id;
      UI.openEditStudyPlanModal(id);
    },
  });

  /* Modal: Add Study Plan / Deadline / Note */
  UI.openAddStudyPlanModal = (defaults = {}) => {
    const today = new Date().toISOString().slice(0, 10);
    const start = defaults.startDate || today;
    const end = defaults.endDate || start;
    const isMultiDay = start !== end;
    const defType = isMultiDay ? "phase" : "phase";

    const colorSwatches = COLOR_PRESETS.map((c, i) => `
      <label class="cal-color-choice" style="--c:${c.bg}; --border-c:${c.border}">
        <input type="radio" name="planColor" value="${c.bg}" ${i === 0 ? "checked" : ""}>
        <span class="cal-swatch"></span>
      </label>
    `).join("");

    // Active modules for optional linking with tracker
    const mods = Store.mods().filter((m) => m.status === "open");
    const modOptions = `<option value="">-- ${t("cal.noSync") || "Kein Tracker-Link"} --</option>` +
      mods.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join("");

    const body = `
      <form id="plan-form" class="modal-form">
        <label>
          <b>${t("cal.titleLabel") || "Titel / Thema"}</b>
          <input type="text" id="plan-title" required autofocus placeholder="z. B. FOP & DT Woche 1, Quiz 3, Altklausuren" value="${esc(defaults.title || "")}">
        </label>
        <div class="grid2">
          <label>
            <b>${t("cal.typeLabel") || "Art des Eintrags"}</b>
            <select id="plan-type">
              <option value="phase" ${defType === "phase" ? "selected" : ""}>📚 ${t("cal.typePhase") || "Lernphase (Zeitspanne)"}</option>
              <option value="deadline" ${defType === "deadline" ? "selected" : ""}>⏰ ${t("cal.typeDeadline") || "Deadline (Quiz / Abgabe)"}</option>
              <option value="note" ${defType === "note" ? "selected" : ""}>📌 ${t("cal.typeNote") || "Notizzettel (Sticky Note)"}</option>
            </select>
          </label>
          <label>
            <b>${t("cal.colorLabel") || "Farbe"}</b>
            <div class="cal-color-picker">${colorSwatches}</div>
          </label>
        </div>
        <div class="grid2">
          <label>
            <b>${t("cal.startLabel") || "Startdatum"}</b>
            <input type="date" id="plan-start" value="${start}" required>
          </label>
          <label>
            <b>${t("cal.endLabel") || "Enddatum"}</b>
            <input type="date" id="plan-end" value="${end}" required>
          </label>
        </div>
        <div class="cal-time-row">
          <label class="switch">
            <input type="checkbox" id="plan-allday" checked>
            <span><b>${t("cal.allDay") || "Ganztägig"}</b> (${t("cal.allDaySub") || "keine Uhrzeit erforderlich"})</span>
          </label>
        </div>
        <div class="grid2 plan-time-fields" id="plan-times" hidden>
          <label>
            <b>${t("cal.startTime") || "Beginn"}</b>
            <input type="time" id="plan-start-time" value="09:00">
          </label>
          <label>
            <b>${t("cal.endTime") || "Ende"}</b>
            <input type="time" id="plan-end-time" value="12:00">
          </label>
        </div>
        <details class="cal-sync-details">
          <summary><b>🔗 ${t("cal.linkTracker") || "Mit Übungen / Folien Tracker verknüpfen"}</b></summary>
          <div class="grid2" style="margin-top:8px">
            <label>
              <span class="fine">${t("col.module") || "Modul"}</span>
              <select id="plan-sync-mod">${modOptions}</select>
            </label>
            <label>
              <span class="fine">${t("cal.syncTarget") || "Einheit / Blatt #"}</span>
              <div style="display:flex; gap:6px">
                <select id="plan-sync-type">
                  <option value="uebung">Übungsblatt</option>
                  <option value="folien">Vorlesung / Folie</option>
                </select>
                <input type="number" id="plan-sync-num" min="1" max="50" style="width:70px" placeholder="#">
              </div>
            </label>
          </div>
        </details>
        <label>
          <b>${t("cal.noteLabel") || "Notiz / Details (optional)"}</b>
          <textarea id="plan-note" rows="2" placeholder="${t("cal.notePlaceholder") || "z. B. Kapitel 1-4 durchrechnen, Altklausur SoSe 24"}"></textarea>
        </label>
        <div class="modal-foot">
          <button type="button" class="btn" data-act="close">${t("btn.cancel") || "Abbrechen"}</button>
          <button type="submit" class="btn primary">${t("btn.save") || "Speichern"}</button>
        </div>
      </form>
    `;

    UI.modal(t("cal.modalAddTitle") || "Neuer Termin / Lernplan", body);

    const f = $("#plan-form");
    const allDayCb = $("#plan-allday");
    const timeFields = $("#plan-times");
    if (allDayCb && timeFields) {
      allDayCb.addEventListener("change", () => {
        timeFields.hidden = allDayCb.checked;
      });
    }

    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = $("#plan-title").value.trim();
      if (!title) return;
      const type = $("#plan-type").value;
      const color = ($('input[name="planColor"]:checked') || {}).value || "#fed7aa";
      const startDate = $("#plan-start").value;
      const endDate = $("#plan-end").value || startDate;
      const allDay = allDayCb.checked;
      const startTime = allDay ? "" : $("#plan-start-time").value;
      const endTime = allDay ? "" : $("#plan-end-time").value;
      const note = $("#plan-note").value.trim();
      const syncModId = $("#plan-sync-mod").value || null;
      const syncType = syncModId ? $("#plan-sync-type").value : null;
      const syncNum = syncModId && $("#plan-sync-num").value ? +$("#plan-sync-num").value : null;

      Store.addStudyPlan({
        title,
        type,
        color,
        startDate: startDate <= endDate ? startDate : endDate,
        endDate: startDate <= endDate ? endDate : startDate,
        allDay,
        startTime,
        endTime,
        note,
        syncModId,
        syncType,
        syncNum,
      });

      UI.closeModal();
      UI.toast(t("cal.saved") || "Lernplan gespeichert", "good");
    });
  };

  /* Modal: Edit Study Plan */
  UI.openEditStudyPlanModal = (id) => {
    const plans = Store.studyPlans();
    const p = plans.find((x) => x.id === id);
    if (!p) return;

    const colorSwatches = COLOR_PRESETS.map((c) => `
      <label class="cal-color-choice" style="--c:${c.bg}; --border-c:${c.border}">
        <input type="radio" name="planColor" value="${c.bg}" ${p.color === c.bg ? "checked" : ""}>
        <span class="cal-swatch"></span>
      </label>
    `).join("");

    const mods = Store.mods().filter((m) => m.status === "open");
    const modOptions = `<option value="">-- ${t("cal.noSync") || "Kein Tracker-Link"} --</option>` +
      mods.map((m) => `<option value="${m.id}" ${p.syncModId === m.id ? "selected" : ""}>${esc(m.name)}</option>`).join("");

    const body = `
      <form id="plan-edit-form" class="modal-form">
        <label>
          <b>${t("cal.titleLabel") || "Titel / Thema"}</b>
          <input type="text" id="plan-title" required value="${esc(p.title)}">
        </label>
        <div class="grid2">
          <label>
            <b>${t("cal.typeLabel") || "Art des Eintrags"}</b>
            <select id="plan-type">
              <option value="phase" ${p.type === "phase" ? "selected" : ""}>📚 ${t("cal.typePhase") || "Lernphase"}</option>
              <option value="deadline" ${p.type === "deadline" ? "selected" : ""}>⏰ ${t("cal.typeDeadline") || "Deadline"}</option>
              <option value="note" ${p.type === "note" ? "selected" : ""}>📌 ${t("cal.typeNote") || "Notizzettel"}</option>
            </select>
          </label>
          <label>
            <b>${t("cal.colorLabel") || "Farbe"}</b>
            <div class="cal-color-picker">${colorSwatches}</div>
          </label>
        </div>
        <div class="grid2">
          <label>
            <b>${t("cal.startLabel") || "Startdatum"}</b>
            <input type="date" id="plan-start" value="${p.startDate}" required>
          </label>
          <label>
            <b>${t("cal.endLabel") || "Enddatum"}</b>
            <input type="date" id="plan-end" value="${p.endDate}" required>
          </label>
        </div>
        <div class="cal-time-row">
          <label class="switch">
            <input type="checkbox" id="plan-allday" ${p.allDay ? "checked" : ""}>
            <span><b>${t("cal.allDay") || "Ganztägig"}</b></span>
          </label>
          <label class="switch" style="margin-left:auto">
            <input type="checkbox" id="plan-done" ${p.done ? "checked" : ""}>
            <span>${t("cal.markDone") || "Als erledigt markieren"}</span>
          </label>
        </div>
        <div class="grid2 plan-time-fields" id="plan-times" ${p.allDay ? "hidden" : ""}>
          <label>
            <b>${t("cal.startTime") || "Beginn"}</b>
            <input type="time" id="plan-start-time" value="${esc(p.startTime || "09:00")}">
          </label>
          <label>
            <b>${t("cal.endTime") || "Ende"}</b>
            <input type="time" id="plan-end-time" value="${esc(p.endTime || "12:00")}">
          </label>
        </div>
        <details class="cal-sync-details" ${p.syncModId ? "open" : ""}>
          <summary><b>🔗 ${t("cal.linkTracker") || "Mit Übungen / Folien Tracker verknüpfen"}</b></summary>
          <div class="grid2" style="margin-top:8px">
            <label>
              <span class="fine">${t("col.module") || "Modul"}</span>
              <select id="plan-sync-mod">${modOptions}</select>
            </label>
            <label>
              <span class="fine">${t("cal.syncTarget") || "Einheit / Blatt #"}</span>
              <div style="display:flex; gap:6px">
                <select id="plan-sync-type">
                  <option value="uebung" ${p.syncType === "uebung" ? "selected" : ""}>Übungsblatt</option>
                  <option value="folien" ${p.syncType === "folien" ? "selected" : ""}>Vorlesung / Folie</option>
                </select>
                <input type="number" id="plan-sync-num" min="1" max="50" style="width:70px" value="${p.syncNum != null ? p.syncNum : ""}">
              </div>
            </label>
          </div>
        </details>
        <label>
          <b>${t("cal.noteLabel") || "Notiz / Details (optional)"}</b>
          <textarea id="plan-note" rows="2">${esc(p.note || "")}</textarea>
        </label>
        <div class="modal-foot">
          <button type="button" class="btn danger ghost" id="plan-del-btn">${icon("trash")}${t("btn.delete") || "Löschen"}</button>
          <button type="button" class="btn" data-act="close">${t("btn.cancel") || "Abbrechen"}</button>
          <button type="submit" class="btn primary">${t("btn.save") || "Speichern"}</button>
        </div>
      </form>
    `;

    UI.modal(t("cal.modalEditTitle") || "Eintrag bearbeiten", body);

    const f = $("#plan-edit-form");
    const allDayCb = $("#plan-allday");
    const timeFields = $("#plan-times");
    if (allDayCb && timeFields) {
      allDayCb.addEventListener("change", () => {
        timeFields.hidden = allDayCb.checked;
      });
    }

    $("#plan-del-btn").addEventListener("click", () => {
      if (confirm(t("cal.delConfirm") || "Diesen Eintrag wirklich löschen?")) {
        Store.removeStudyPlan(id);
        UI.closeModal();
        UI.toast(t("cal.deleted") || "Eintrag gelöscht");
      }
    });

    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = $("#plan-title").value.trim();
      if (!title) return;
      const type = $("#plan-type").value;
      const color = ($('input[name="planColor"]:checked') || {}).value || p.color;
      const startDate = $("#plan-start").value;
      const endDate = $("#plan-end").value || startDate;
      const allDay = allDayCb.checked;
      const startTime = allDay ? "" : $("#plan-start-time").value;
      const endTime = allDay ? "" : $("#plan-end-time").value;
      const done = $("#plan-done").checked;
      const note = $("#plan-note").value.trim();
      const syncModId = $("#plan-sync-mod").value || null;
      const syncType = syncModId ? $("#plan-sync-type").value : null;
      const syncNum = syncModId && $("#plan-sync-num").value ? +$("#plan-sync-num").value : null;

      Store.updateStudyPlan(id, {
        title,
        type,
        color,
        startDate: startDate <= endDate ? startDate : endDate,
        endDate: startDate <= endDate ? endDate : startDate,
        allDay,
        startTime,
        endTime,
        done,
        note,
        syncModId,
        syncType,
        syncNum,
      });

      UI.closeModal();
      UI.toast(t("cal.updated") || "Eintrag aktualisiert", "good");
    });
  };
})();
