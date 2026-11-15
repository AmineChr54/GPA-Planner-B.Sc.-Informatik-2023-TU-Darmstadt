/* ==========================================================================
   Store — state, scenarios, persistence (localStorage), undo, import merge.
   Facts (passed / dropped modules, attempts, exam dates) are shared across
   scenarios; plans (planned grades, elective choices) differ per scenario.
   ========================================================================== */
"use strict";

const Store = (() => {
  const KEY = "tud-notenplaner-v2";
  const LEGACY_KEY = "tud-gpa-planner-v1"; // Yacine's original app
  const uid = () => "m" + Math.random().toString(36).slice(2, 10);
  const clone = (x) => JSON.parse(JSON.stringify(x));

  function withIds(mods) { return mods.map((m) => ({ id: uid(), attempts: 0, diff: 2, ...m })); }

  function fresh(lang) {
    const s = {
      id: "s" + Date.now().toString(36),
      name: lang === "en" ? "My plan" : "Mein Plan",
      target: 2.5,
      modules: withIds(blankModules()),
    };
    return {
      v: 2, gradeV: 1, lang: lang || "de", theme: "light", goalOn: false,
      start: guessStart(), active: s.id, scenarios: [s],
      sems: Array.from({ length: 6 }, () => ({ t: "n" })), // n = normal · u = Urlaubssemester · a = Auslandssemester
      oral: null, tucan: null, savedAt: null,
      onboarded: false, dirty: false, lastExport: null, snoozeUntil: null, persistAsked: false,
      academicDates: {},
      studyPlans: [], tracker: {}, customTrackerTopics: [], // calendar + study tracker: global, not per scenario
    };
  }
  function guessStart() {
    const d = new Date(), y = d.getFullYear(), m = d.getMonth() + 1;
    return m >= 10 ? { term: "WS", year: y } : m <= 3 ? { term: "WS", year: y - 1 } : { term: "SS", year: y };
  }

  /* v1 (Yacine) → v2 */
  function fromLegacy(d) {
    const st = fresh("de");
    const s = st.scenarios[0];
    s.target = d.target ?? 2.5;
    st.goalOn = true; // the original planner was built around the goal
    s.modules = withIds(d.modules.map((m) => {
      const x = { ...m };
      if (x.a === "A" || x.a === "C") { const p = PFLICHT.find((p) => p[0] === x.code); if (p) x.rec = p[3]; }
      return x;
    }));
    return st;
  }

  function validate(d) {
    if (!d || typeof d !== "object") return null;
    if (d.v === 2 && Array.isArray(d.scenarios) && d.scenarios.length) {
      d.scenarios.forEach((s) => {
        s.modules = (s.modules || []).map((m) => ({ attempts: 0, diff: 2, ...m, id: m.id || uid() }));
      });
      // study plans + tracker used to live inside each scenario: merge them into the global lists (active scenario wins)
      if (!Array.isArray(d.studyPlans)) d.studyPlans = [];
      if (!d.tracker || typeof d.tracker !== "object") d.tracker = {};
      if (!Array.isArray(d.customTrackerTopics)) d.customTrackerTopics = [];
      const ordered = d.scenarios.slice().sort((a, b) => (b.id === d.active) - (a.id === d.active));
      ordered.forEach((s) => {
        if (Array.isArray(s.studyPlans)) s.studyPlans.forEach((p) => { if (p && !d.studyPlans.some((x) => x.id === p.id)) d.studyPlans.push(p); });
        if (s.tracker && typeof s.tracker === "object") Object.keys(s.tracker).forEach((k) => { if (!d.tracker[k]) d.tracker[k] = s.tracker[k]; });
        delete s.studyPlans; delete s.tracker;
      });
      if (!d.scenarios.some((s) => s.id === d.active)) d.active = d.scenarios[0].id;
      d.start = d.start || guessStart();
      ensureSems(d);
      // planned grades: a plain 2,0 was the old hard-coded default, so it becomes "auto"; anything else was chosen
      if (d.gradeV !== 1) {
        d.scenarios.forEach((s) => s.modules.forEach((m) => { if (m.status === "open" && !m.ungraded && m.gradeSet == null) m.gradeSet = m.grade != null && +m.grade !== 2.0; }));
        d.gradeV = 1;
      }
      if (d.onboarded == null) d.onboarded = true; // data from before the welcome screen existed
      // Ziel & Strategie became opt-in: keep it on for anyone who already set a goal of their own
      if (d.goalOn == null) d.goalOn = d.scenarios.some((s) => +s.target !== 2.5);
      return d;
    }
    if (Array.isArray(d.modules)) return fromLegacy(d);
    return null;
  }

  /* the semester columns are global (time is the same in every scenario) */
  function ensureSems(d) {
    if (!Array.isArray(d.sems)) d.sems = [];
    let max = 6;
    d.scenarios.forEach((s) => s.modules.forEach((m) => { if (+m.sem > max) max = +m.sem; }));
    while (d.sems.length < max) d.sems.push({ t: "n" });
  }

  let S = null;
  const undo = [];
  const listeners = [];

  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) { const d = validate(JSON.parse(raw)); if (d) { S = d; autoGrades(); return S; } } } catch (e) {}
    try { const raw = localStorage.getItem(LEGACY_KEY); if (raw) { const d = validate(JSON.parse(raw)); if (d) { S = d; S.migrated = true; S.onboarded = true; return S; } } } catch (e) {}
    S = fresh("de"); // German by default; DE/EN toggle in the sidebar
    autoGrades();
    return S;
  }
  let saveWarned = false;
  function save() {
    S.savedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(S)); saveWarned = false; }
    catch (e) { // quota full / storage blocked: tell the user once instead of silently losing changes
      if (!saveWarned && typeof UI !== "undefined" && UI.toast) { saveWarned = true; UI.toast("⚠ Speichern im Browser fehlgeschlagen – bitte Backup exportieren / saving failed, export a backup", "bad"); }
    }
  }
  function snapshot() { undo.push(JSON.stringify(S)); if (undo.length > 60) undo.shift(); }
  const nearest = (v) => GRADES.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
  /* the estimate for a planned module without a grade of one's own (Ziel & Strategie off):
     what students got there (Notenspiegel, average of the passes), else one's own average so far,
     else 2,0 → { g, src: "ns" | "avg" | "none" } */
  function estimate(m, modules) {
    const code = m.code || (m.choice && m.choice[0] && m.choice[0].code);
    const st = code && typeof GradeStats !== "undefined" ? GradeStats.summary(code) : null;
    if (st && st.avgPassed != null && st.passed >= 10) return { g: nearest(st.avgPassed), src: "ns", n: st.n };
    const now = Engine.gpa(modules || mods(), "done").official;
    return now == null ? { g: 2.0, src: "none" } : { g: nearest(now), src: "avg" };
  }
  /* unset planned grades = the grade needed for that scenario's goal (Ziel & Strategie on), else the estimate */
  function autoGrades() {
    if (typeof Engine === "undefined") return;
    for (const s of S.scenarios) {
      const open = s.modules.filter((m) => m.status === "open" && !m.ungraded && !m.gradeSet);
      if (!open.length) { s.auto = null; continue; }
      if (S.goalOn) {
        s.auto = Engine.goalGrade(s.modules, s.target);
        open.forEach((m) => { m.grade = s.auto.g; delete m.autoSrc; });
      } else {
        s.auto = { avg: true };
        open.forEach((m) => { const e = estimate(m, s.modules); m.grade = e.g; m.autoSrc = e.src; });
      }
    }
  }
  function setGoal(on) { commit((S) => { S.goalOn = !!on; }); }
  function emit() { autoGrades(); save(); listeners.forEach((f) => f()); }

  /* mutate with undo + re-render */
  function commit(fn) { snapshot(); fn(S); S.dirty = true; emit(); }
  function undoLast() { const raw = undo.pop(); if (!raw) return false; S = JSON.parse(raw); emit(); return true; }

  const sc = () => S.scenarios.find((s) => s.id === S.active);
  const mods = () => sc().modules;
  const byId = (id) => mods().find((m) => m.id === id);

  /* ---------------- facts propagate across scenarios ---------------- */
  const FACT_ALWAYS = ["attempts", "examDate"];
  const FACT_DONE = ["status", "grade", "cp", "name", "code", "sem", "ungraded", "g"];
  function propagate(m, wasFact) {
    const isFact = m.status === "done" || m.status === "dropped";
    for (const s of S.scenarios) {
      if (s.id === S.active) continue;
      let o = s.modules.find((x) => x.id === m.id);
      if (!o) {
        if (isFact) s.modules.push(clone(m));
        continue;
      }
      FACT_ALWAYS.forEach((k) => (o[k] = m[k]));
      if (isFact || wasFact) FACT_DONE.forEach((k) => (o[k] = m[k]));
    }
  }
  function updateModule(id, patch) {
    commit(() => {
      const m = byId(id); if (!m) return;
      const wasFact = m.status === "done" || m.status === "dropped";
      if ("grade" in patch && !("gradeSet" in patch)) patch.gradeSet = patch.grade != null;
      Object.assign(m, patch);
      if (m.status !== "off" && m.status !== "dropped" && !m.ungraded && m.grade == null) m.grade = 4.0; // refilled by autoGrades unless set
      if ("grade" in patch && m.ph) {} // placeholder stays placeholder until renamed
      if ("name" in patch || "code" in patch) m.ph = false;
      propagate(m, wasFact);
    });
  }
  function addModule(m) {
    const x = { id: uid(), attempts: 0, diff: 2, status: "open", grade: 2.0, ...m };
    commit(() => { mods().push(x); propagate(x, false); ensureSems(S); });
    return x;
  }
  function removeModule(id) { commit(() => { const s = sc(); s.modules = s.modules.filter((m) => m.id !== id); }); }

  /* ---------------- scenarios ---------------- */
  function newScenario(name, shift = 0) {
    commit(() => {
      const base = sc();
      const s = { id: "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 4), name, target: base.target, modules: clone(base.modules) };
      if (shift) s.modules.forEach((m) => {
        if (m.status !== "open" || m.ungraded) return;
        const i = GRADES.indexOf(+m.grade);
        if (i >= 0) { m.grade = GRADES[Math.max(0, Math.min(GRADES.length - 1, i + shift))]; m.gradeSet = true; }
      });
      S.scenarios.push(s); S.active = s.id;
    });
  }
  function renameScenario(id, name) { commit(() => { const s = S.scenarios.find((x) => x.id === id); if (s) s.name = name; }); }
  function deleteScenario(id) {
    if (S.scenarios.length < 2) return;
    commit(() => { S.scenarios = S.scenarios.filter((s) => s.id !== id); if (S.active === id) S.active = S.scenarios[0].id; });
  }
  function activate(id) { S.active = id; emit(); }

  /* ---------------- study plans & calendar events ---------------- */
  function studyPlans() {
    if (!Array.isArray(S.studyPlans)) S.studyPlans = [];
    return S.studyPlans;
  }
  function addStudyPlan(p) {
    let item;
    commit(() => {
      item = {
        id: "sp" + uid(),
        title: p.title || "Lernphase",
        type: p.type || "phase", // "phase" | "deadline" | "note"
        startDate: p.startDate || new Date().toISOString().slice(0, 10),
        endDate: p.endDate || p.startDate || new Date().toISOString().slice(0, 10),
        allDay: p.allDay !== false,
        startTime: p.startTime || "",
        endTime: p.endTime || "",
        color: p.color || "#fed7aa",
        note: p.note || "",
        done: !!p.done,
        syncModId: p.syncModId || null,
        syncType: p.syncType || null, // "uebung" | "folien"
        syncNum: p.syncNum != null ? +p.syncNum : null,
      };
      studyPlans().push(item);
    });
    return item;
  }
  function updateStudyPlan(id, patch) {
    commit(() => {
      const sp = studyPlans().find((x) => x.id === id);
      if (sp) {
        Object.assign(sp, patch);
        if (sp.syncModId && sp.syncType && sp.syncNum != null) {
          syncTrackerFromPlan(sp);
        }
      }
    });
  }
  function removeStudyPlan(id) {
    commit(() => {
      S.studyPlans = (S.studyPlans || []).filter((x) => x.id !== id);
    });
  }

  /* ---------------- tracker (Folien, Übungen, Altklausuren) ---------------- */
  function getTracker(modId) {
    if (!S.tracker) S.tracker = {};
    if (!S.tracker[modId]) {
      S.tracker[modId] = {
        folienCount: 0,
        folienDone: [],
        uebungenCount: 0,
        uebungenDone: [],
        altklausuren: [],
      };
    }
    return S.tracker[modId];
  }
  function setTrackerCounts(modId, type, count) {
    commit(() => {
      const t = getTracker(modId);
      const n = Math.max(0, Math.min(99, parseInt(count, 10) || 0));
      if (type === "folien") {
        t.folienCount = n;
        t.folienDone = (t.folienDone || []).filter((x) => x <= n);
      } else if (type === "uebungen") {
        t.uebungenCount = n;
        t.uebungenDone = (t.uebungenDone || []).filter((x) => x <= n);
      }
    });
  }
  function toggleTrackerItem(modId, type, num) {
    commit(() => {
      const t = getTracker(modId);
      const arr = type === "folien" ? (t.folienDone = t.folienDone || []) : (t.uebungenDone = t.uebungenDone || []);
      const idx = arr.indexOf(num);
      const isDone = idx < 0;
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(num);
      (S.studyPlans || []).forEach((sp) => {
        if (sp.syncModId === modId && sp.syncType === type && +sp.syncNum === +num) {
          sp.done = isDone;
        }
      });
    });
  }
  function addAltklausur(modId, name) {
    commit(() => {
      const t = getTracker(modId);
      if (!t.altklausuren) t.altklausuren = [];
      t.altklausuren.push({
        id: "ak" + uid(),
        name: (name || "").trim() || "Altklausur",
        done: false,
      });
    });
  }
  function toggleAltklausur(modId, akId) {
    commit(() => {
      const t = getTracker(modId);
      const ak = (t.altklausuren || []).find((x) => x.id === akId);
      if (ak) ak.done = !ak.done;
    });
  }
  function removeAltklausur(modId, akId) {
    commit(() => {
      const t = getTracker(modId);
      t.altklausuren = (t.altklausuren || []).filter((x) => x.id !== akId);
    });
  }
  function syncTrackerFromPlan(sp) {
    if (!sp.syncModId || !sp.syncType || sp.syncNum == null) return;
    const t = getTracker(sp.syncModId);
    const arr = sp.syncType === "folien" ? (t.folienDone = t.folienDone || []) : (t.uebungenDone = t.uebungenDone || []);
    const idx = arr.indexOf(+sp.syncNum);
    if (sp.done && idx < 0) arr.push(+sp.syncNum);
    else if (!sp.done && idx >= 0) arr.splice(idx, 1);
  }

  /* ---------------- TUCaN import merge ----------------
     imported: [{a,g,code,name,cp,status,grade,ungraded,attempts,date}]
     opts: {all: apply to every scenario, dropPh: remove placeholder electives}   */
  function applyImport(res, opts) {
    const report = { updated: 0, added: 0, removed: 0 };
    commit(() => {
      inferStart(res);
      const targets = opts.all ? S.scenarios : [sc()];
      for (const s of targets) {
        if (opts.dropPh) { const n = s.modules.length; s.modules = s.modules.filter((m) => !m.ph); if (s === sc()) report.removed = n - s.modules.length; }
        for (const im of res.modules) {
          const bc = Tucan.baseCode(im.code);
          let m = s.modules.find((x) => x.code && Tucan.baseCode(x.code) === bc);
          const sem = im.date ? Engine.semesterOfDate(S.start, new Date(im.date + "T00:00:00")) : undefined;
          const patch = { status: im.status, ungraded: im.ungraded, grade: im.ungraded ? null : im.grade ?? (m ? m.grade : 2.0) };
          if (im.cp != null) patch.cp = im.cp;
          if (im.attempts) patch.attempts = Math.max(im.attempts, m ? m.attempts || 0 : 0);
          if (sem) patch.sem = sem;
          if (im.g) patch.g = im.g;
          if (patch.status === "open" && patch.grade == null && !patch.ungraded) patch.grade = 2.0;
          if (m) {
            Object.assign(m, patch);
            if (!m.fixed) { m.name = im.name; m.a = im.a; }
            m.ph = false;
            if (s === sc()) report.updated++;
          } else {
            m = { id: uid(), attempts: 0, diff: 2, a: im.a, code: im.code, name: im.name, cp: im.cp ?? 5, ...patch };
            if (!m.sem) m.sem = undefined;
            // keep the same id across scenarios so facts stay linked
            const twin = S.scenarios.map((x) => x.modules.find((y) => y.code && Tucan.baseCode(y.code) === bc)).find(Boolean);
            if (twin) m.id = twin.id;
            s.modules.push(m);
            if (s === sc()) report.added++;
          }
        }
      }
      if (res.tucanGpa != null) S.tucan = { gpa: res.tucanGpa, at: new Date().toISOString().slice(0, 10) };
    });
    return report;
  }

  /* Study start, unless the user set it: from the earliest result date if TUCaN printed
     dates, else from progress (Pflicht done up to recommended semester k → now in k+1). */
  const ordOf = (s) => s.year * 2 + (s.term === "WS" ? 1 : 0);
  const fromOrd = (o) => (o % 2 ? { term: "WS", year: (o - 1) / 2 } : { term: "SS", year: o / 2 });
  function inferStart(res) {
    if (S.startSet) return;
    const dates = res.modules.filter((m) => m.date).map((m) => new Date(m.date + "T00:00:00")).sort((a, b) => a - b);
    if (dates.length) {
      const d = dates[0], mo = d.getMonth() + 1, y = d.getFullYear();
      S.start = mo >= 10 ? { term: "WS", year: y } : mo <= 4 ? { term: "WS", year: y - 1 } : { term: "SS", year: y };
      return;
    }
    const done = new Set(res.modules.filter((m) => m.a === "A" && m.status === "done").map((m) => Tucan.baseCode(m.code)));
    let k = 0;
    for (let sem = 1; sem <= 6; sem++) {
      const req = PFLICHT.filter((p) => p[3] === sem).map((p) => p[0]);
      if (req.length && req.every((c) => done.has(c))) k = sem; else break;
    }
    if (k) S.start = fromOrd(ordOf(guessStart()) - k);
  }

  /* fill CP gaps with placeholders so every area reaches its minimum */
  function fillGaps(labels) {
    commit(() => {
      const ms = mods();
      for (let guard = 0; guard < 30; guard++) {
        const rows = Engine.structure(ms);
        const r = (id) => rows.find((x) => x.id === id);
        const cpOf = (id) => r(id).cp;
        let area = null, need = 0;
        for (const id of ["B111", "B112", "B12", "B2"]) if (r(id).st === "low") { area = id; need = r(id).min - r(id).cp; break; }
        if (!area && r("B11").st === "low") { area = cpOf("B112") < 30 ? "B112" : "B111"; need = r("B11").min - cpOf("B11"); }
        if (!area && r("B1").st === "low") { area = cpOf("B11") < 40 ? (cpOf("B112") < 30 ? "B112" : "B111") : "B12"; need = r("B1").min - cpOf("B1"); }
        if (!area && r("TOTAL").st === "low") { area = cpOf("B2") < 6 ? "B2" : cpOf("B12") < 18 ? "B12" : "B112"; need = 180 - r("TOTAL").cp; }
        if (!area) break;
        const cp = Math.max(1, Math.min(need, area === "B12" ? 6 : area === "B2" ? need : 6));
        const g = area === "B112" ? "KI" : area === "B12" ? (ms.some((m) => m.a === "B12" && m.g === "PRAK" && Engine.counts(m)) ? "SEM" : "PRAK") : null;
        const x = { id: uid(), attempts: 0, diff: 2, a: area, g, code: "", name: labels[area] || "Platzhalter", cp, status: "open", grade: 2.0, ph: true };
        ms.push(x);
      }
    });
  }

  /* ---------------- semesters ---------------- */
  const allMods = () => S.scenarios.flatMap((s) => s.modules);
  function addSem(t = "n") { commit(() => S.sems.push({ t })); return S.sems.length; }
  // returns an i18n error key, or null on success
  function setSemType(n, t) {
    const inCol = allMods().filter((m) => +m.sem === n);
    if (t === "u" && inCol.length) return "sem.err.notEmpty";
    if (t === "a" && inCol.some((m) => !m.abroad)) return "sem.err.onlyAbroad";
    if (t === "n" && inCol.some((m) => m.abroad)) { /* abroad modules may stay in a normal semester */ }
    commit(() => { S.sems[n - 1].t = t; });
    return null;
  }
  function insertSem(n, t = "n") {
    commit(() => {
      S.sems.splice(n - 1, 0, { t });
      allMods().forEach((m) => { if (+m.sem >= n) m.sem = +m.sem + 1; });
    });
  }
  function removeSem(n) {
    if (allMods().some((m) => +m.sem === n)) return "sem.err.notEmpty";
    if (S.sems.length <= 1) return "sem.err.last";
    commit(() => {
      S.sems.splice(n - 1, 1);
      allMods().forEach((m) => { if (+m.sem > n) m.sem = +m.sem - 1; });
    });
    return null;
  }

  /* ---------------- data safety ---------------- */
  function markExported() { S.lastExport = new Date().toISOString(); S.dirty = false; save(); }
  function snooze(days) { S.snoozeUntil = new Date(Date.now() + days * 864e5).toISOString(); save(); listeners.forEach((f) => f()); }
  // wipes everything this app (and its predecessor) stored in this browser
  function deleteAll() {
    try { localStorage.removeItem(KEY); localStorage.removeItem(LEGACY_KEY); } catch (e) {}
    undo.length = 0;
    S = fresh(S ? S.lang : "de");
    listeners.forEach((f) => f()); // re-render without saving: storage stays empty until the next change
  }
  const hasData = () => { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } };

  function replaceAll(d) { const v = validate(d); if (!v) return false; snapshot(); S = v; emit(); return true; }
  function reset() { snapshot(); S = fresh(S.lang); emit(); }
  function set(fn) { commit(fn); }

  return {
    load, get: () => S, sc, mods, byId, on: (f) => listeners.push(f), commit, set, undoLast, canUndo: () => undo.length > 0,
    updateModule, addModule, removeModule, setGoal, estimate, newScenario, renameScenario, deleteScenario, activate,
    studyPlans, addStudyPlan, updateStudyPlan, removeStudyPlan,
    getTracker, setTrackerCounts, toggleTrackerItem, addAltklausur, toggleAltklausur, removeAltklausur,
    applyImport, fillGaps, replaceAll, reset, uid, emit, save,
    addSem, setSemType, insertSem, removeSem, markExported, snooze, deleteAll, hasData, ensureSems: () => ensureSems(S),
  };
})();
window.Store = Store;
