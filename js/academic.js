/* ==========================================================================
   Academic Calendar — TU Darmstadt semester schedules & automatic breaks.
   Official dates (Vorlesungsbeginn, Vorlesungsende, Weihnachtspause,
   Vorlesungsfreie Zeit / Semesterferien).
   ========================================================================== */
"use strict";

const AcademicCalendar = (() => {
  /* TU Darmstadt schedule registry */
  const SCHEDULES = {
    "WiSe 2026/27": {
      term: "WiSe 2026/27",
      label: "Wintersemester 2026/27",
      lectureStart: "2026-10-12",
      lectureEnd: "2027-02-12",
      breakStart: "2027-02-13",
      breakEnd: "2027-04-11", // until start of SoSe 2027
      holidays: [
        { id: "xmas", name: "Weihnachtspause", start: "2026-12-21", end: "2027-01-08", color: "#fed7aa" },
      ],
    },
    "SoSe 2026": {
      term: "SoSe 2026",
      label: "Sommersemester 2026",
      lectureStart: "2026-04-13",
      lectureEnd: "2026-07-17",
      breakStart: "2026-07-18",
      breakEnd: "2026-10-11",
      holidays: [
        { id: "pfingsten", name: "Pfingstpause", start: "2026-05-26", end: "2026-05-26", color: "#fef08a" },
      ],
    },
    "WiSe 2025/26": {
      term: "WiSe 2025/26",
      label: "Wintersemester 2025/26",
      lectureStart: "2025-10-13",
      lectureEnd: "2026-02-13",
      breakStart: "2026-02-14",
      breakEnd: "2026-04-12",
      holidays: [
        { id: "xmas-25", name: "Weihnachtspause", start: "2025-12-22", end: "2026-01-09", color: "#fed7aa" },
      ],
    },
  };

  /* Project schedule for terms not explicitly in registry */
  function projectSchedule(termStr) {
    const isWiSe = /WiSe|WS/i.test(termStr);
    const m = termStr.match(/\b(20\d{2}|\d{2})\b/);
    let y = m ? +m[1] : new Date().getFullYear();
    if (y < 100) y += 2000;

    if (isWiSe) {
      // WiSe starts mid-October, ends mid-February
      const lStart = `${y}-10-12`;
      const lEnd = `${y + 1}-02-12`;
      return {
        term: `WiSe ${y}/${String(y + 1).slice(2)}`,
        label: `Wintersemester ${y}/${String(y + 1).slice(2)}`,
        lectureStart: lStart,
        lectureEnd: lEnd,
        breakStart: `${y + 1}-02-13`,
        breakEnd: `${y + 1}-04-11`,
        holidays: [
          { id: `xmas-${y}`, name: "Weihnachtspause", start: `${y}-12-21`, end: `${y + 1}-01-08`, color: "#fed7aa" },
        ],
      };
    } else {
      // SoSe starts mid-April, ends mid-July
      return {
        term: `SoSe ${y}`,
        label: `Sommersemester ${y}`,
        lectureStart: `${y}-04-13`,
        lectureEnd: `${y}-07-17`,
        breakStart: `${y}-07-18`,
        breakEnd: `${y}-10-11`,
        holidays: [],
      };
    }
  }

  function getSchedule(term) {
    if (!term) return SCHEDULES["WiSe 2026/27"];
    if (SCHEDULES[term]) return SCHEDULES[term];
    const norm = term.replace(/\s+/g, " ");
    for (const [k, v] of Object.entries(SCHEDULES)) {
      if (k.toLowerCase() === norm.toLowerCase() || k.replace(/\s+/g, "").toLowerCase() === norm.replace(/\s+/g, "").toLowerCase()) {
        return v;
      }
    }
    return projectSchedule(term);
  }

  function scheduleOfDate(isoDate) {
    for (const s of Object.values(SCHEDULES)) {
      if (isoDate >= s.lectureStart && isoDate <= s.breakEnd) return s;
      if (isoDate >= s.breakStart && isoDate <= s.breakEnd) return s;
    }
    // project from year and month
    const parts = isoDate.split("-");
    const y = +parts[0], m = +parts[1];
    const term = m >= 10 || m <= 3 ? `WiSe ${m <= 3 ? y - 1 : y}/${String(m <= 3 ? y : y + 1).slice(2)}` : `SoSe ${y}`;
    return projectSchedule(term);
  }

  /* Check if date falls in Vorlesungsfreie Zeit (disabled shading per user preference) */
  function isBreakDay(isoDate) {
    return false;
  }

  /* Check if date falls inside a specific holiday (e.g. Weihnachtspause) */
  function getHoliday(isoDate) {
    const s = scheduleOfDate(isoDate);
    if (!s || !s.holidays) return null;
    return s.holidays.find((h) => isoDate >= h.start && isoDate <= h.end) || null;
  }

  /* Check if date is Vorlesungsbeginn, Vorlesungsende, or Vorlesungsfreie Zeit Start/Ende */
  function getBoundaryEvent(isoDate) {
    const s = scheduleOfDate(isoDate);
    if (!s) return null;
    if (isoDate === s.lectureStart) {
      return { id: `start-${s.term}`, type: "lectureStart", title: `Vorlesungsbeginn (${s.term})`, date: isoDate, term: s.term };
    }
    if (isoDate === s.lectureEnd) {
      return { id: `end-${s.term}`, type: "lectureEnd", title: `Vorlesungsende (${s.term})`, date: isoDate, term: s.term };
    }
    if (isoDate === s.breakStart) {
      return { id: `bstart-${s.term}`, type: "breakStart", title: `🏖️ Vorlesungsfreie Zeit Beginn`, date: isoDate, term: s.term };
    }
    if (isoDate === s.breakEnd) {
      return { id: `bend-${s.term}`, type: "breakEnd", title: `🏖️ Vorlesungsfreie Zeit Ende`, date: isoDate, term: s.term };
    }
    return null;
  }

  /* Return all academic spanning spans and milestones for a given month or range */
  function getAcademicEventsForRange(startIso, endIso) {
    const events = [];
    const seen = new Set();
    const cur = new Date(startIso + "T00:00:00");
    const end = new Date(endIso + "T00:00:00");

    while (cur <= end) {
      const iso = cur.toISOString().slice(0, 10);
      const s = scheduleOfDate(iso);
      if (s) {
        // Boundary milestones
        if (s.lectureStart >= startIso && s.lectureStart <= endIso && !seen.has(`start-${s.term}`)) {
          seen.add(`start-${s.term}`);
          events.push({
            id: `acad-start-${s.term}`,
            type: "academic-milestone",
            subType: "lectureStart",
            title: `Vorlesungsbeginn ${s.term}`,
            startDate: s.lectureStart,
            endDate: s.lectureStart,
            allDay: true,
            color: "#60a5fa", // blue
          });
        }
        if (s.lectureEnd >= startIso && s.lectureEnd <= endIso && !seen.has(`end-${s.term}`)) {
          seen.add(`end-${s.term}`);
          events.push({
            id: `acad-end-${s.term}`,
            type: "academic-milestone",
            subType: "lectureEnd",
            title: `Vorlesungsende ${s.term}`,
            startDate: s.lectureEnd,
            endDate: s.lectureEnd,
            allDay: true,
            color: "#f59e0b", // amber
          });
        }
        if (s.breakStart && s.breakStart >= startIso && s.breakStart <= endIso && !seen.has(`bstart-${s.term}`)) {
          seen.add(`bstart-${s.term}`);
          events.push({
            id: `acad-bstart-${s.term}`,
            type: "academic-milestone",
            subType: "breakStart",
            title: `🏖️ Vorlesungsfreie Zeit Beginn`,
            startDate: s.breakStart,
            endDate: s.breakStart,
            allDay: true,
            color: "#64748b",
          });
        }
        if (s.breakEnd && s.breakEnd >= startIso && s.breakEnd <= endIso && !seen.has(`bend-${s.term}`)) {
          seen.add(`bend-${s.term}`);
          events.push({
            id: `acad-bend-${s.term}`,
            type: "academic-milestone",
            subType: "breakEnd",
            title: `🏖️ Vorlesungsfreie Zeit Ende`,
            startDate: s.breakEnd,
            endDate: s.breakEnd,
            allDay: true,
            color: "#64748b",
          });
        }
        // Holidays (e.g. Weihnachtspause)
        (s.holidays || []).forEach((h) => {
          if (!seen.has(h.id) && h.end >= startIso && h.start <= endIso) {
            seen.add(h.id);
            events.push({
              id: `acad-holiday-${h.id}`,
              type: "academic-span",
              subType: "holiday",
              title: h.name,
              startDate: h.start,
              endDate: h.end,
              allDay: true,
              color: h.color || "#fed7aa", // warm pastel
            });
          }
        });
      }
      cur.setDate(cur.getDate() + 1);
    }
    return events;
  }

  return {
    SCHEDULES,
    getSchedule,
    scheduleOfDate,
    isBreakDay,
    getHoliday,
    getBoundaryEvent,
    getAcademicEventsForRange,
  };
})();
window.AcademicCalendar = AcademicCalendar;
