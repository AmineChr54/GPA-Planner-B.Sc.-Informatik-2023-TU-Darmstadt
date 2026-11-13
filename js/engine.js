/* ==========================================================================
   Engine — pure functions, no DOM.
   GPA per APB § 25 / § 28, best-first caps bottom-up through the PO tree,
   goal solver, effort-aware optimizer, structure + B 1.2 sub-rule checks.
   ========================================================================== */
"use strict";

const Engine = (() => {
  const EPS = 1e-9;

  // § 28 (2): keep the first two decimals, truncate the rest (no rounding)
  const truncate2 = (x) => Math.floor(x * 100 + 1e-7) / 100;

  // § 28 (3) — returns a key for i18n
  function stufe(x) {
    if (x == null || !isFinite(x)) return "";
    if (x < 1.6) return "sehrgut";
    if (x < 2.6) return "gut";
    if (x < 3.6) return "befriedigend";
    if (x < 4.1) return "ausreichend";
    return "nichtausreichend";
  }
  const tone = (x) => (x == null || !isFinite(x) ? "" : x < 2.6 ? "good" : x < 3.6 ? "warn" : "bad");

  const counts = (m) => m.status === "done" || m.status === "open";
  const graded = (m) => !m.ungraded && m.grade != null && isFinite(+m.grade);

  function nodeById(id, n = PO) {
    if (n.id === id) return n;
    for (const c of n.children || []) { const f = nodeById(id, c); if (f) return f; }
    return null;
  }
  function leaves(n = PO, out = []) {
    if (n.children) n.children.forEach((c) => leaves(c, out)); else out.push(n);
    return out;
  }

  /* § 25 (5): best grades first, up to the cap; partial CP of the boundary module counts */
  function capEntries(entries, cap) {
    const sorted = entries.slice().sort((x, y) => x.grade - y.grade || y.cp - x.cp);
    if (cap == null) return sorted.map((e) => ({ ...e, counted: e.cp }));
    let left = cap;
    return sorted.map((e) => { const take = Math.max(0, Math.min(e.cp, left)); left -= take; return { ...e, counted: take }; });
  }

  function nodeEntries(node, mods, marks) {
    let raw = [];
    if (node.children) for (const ch of node.children) raw = raw.concat(nodeEntries(ch, mods, marks));
    else raw = mods.filter((m) => m.a === node.id && graded(m)).map((m) => ({ cp: +m.cp || 0, grade: +m.grade, ref: m }));
    const capped = capEntries(raw, node.capGrade);
    for (const e of capped) {
      const prev = marks.get(e.ref);
      marks.set(e.ref, prev == null ? e.counted : Math.min(prev, e.counted));
    }
    return capped.filter((e) => e.counted > 0).map((e) => ({ cp: e.counted, grade: e.grade, ref: e.ref }));
  }

  /**
   * mode "done" → passed modules only; "proj" → passed + planned.
   * override(m) → grade to use for a planned module (optimizer / what-if).
   * filter(m)   → extra predicate (e.g. semester ≤ s for the timeline).
   * marks: Map(original module → CP that survive all caps)
   */
  function gpa(modules, mode = "proj", override, filter) {
    const pick = [], back = new Map();
    for (const m of modules) {
      if (!counts(m)) continue;
      if (mode === "done" && m.status !== "done") continue;
      if (filter && !filter(m)) continue;
      const c = m.status === "open" && override ? { ...m, grade: override(m) } : m;
      pick.push(c); back.set(c, m);
    }
    const tmp = new Map();
    const entries = nodeEntries(PO, pick, tmp);
    const marks = new Map();
    for (const [k, v] of tmp) marks.set(back.get(k), v);
    let num = 0, den = 0;
    for (const e of entries) { num += e.cp * e.grade; den += e.cp; }
    const exact = den > 0 ? num / den : null;
    return { exact, official: exact == null ? null : truncate2(exact), cp: den, num, marks };
  }

  /* CP planned / done under a node (ignores "off" and "dropped") */
  function cpUnder(node, modules, pred = counts) {
    if (node.children) return node.children.reduce((s, c) => s + cpUnder(c, modules, pred), 0);
    return modules.filter((m) => m.a === node.id && pred(m)).reduce((s, m) => s + (+m.cp || 0), 0);
  }

  /* one uniform grade for every planned module that lands exactly on the target (bisection) */
  function uniformGrade(modules, target) {
    const f = (g) => gpa(modules, "proj", () => g).exact;
    if (f(1.0) == null) return null;
    if (f(1.0) > target + EPS) return { g: 1.0, impossible: true };
    if (f(4.0) <= target + EPS) return { g: 4.0, trivial: true };
    let lo = 1.0, hi = 4.0;
    for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; f(mid) <= target ? (lo = mid) : (hi = mid); }
    return { g: lo };
  }
  /* the default for planned grades the student hasn't set: the worst grade step that,
     used for every unset planned module (set ones stay fixed), still meets the target */
  function goalGrade(modules, target) {
    const ok = (g) => { const r = gpa(modules, "proj", (m) => (m.gradeSet ? +m.grade : g)); return r.official != null && r.official <= target + EPS; };
    let best = null;
    for (const g of GRADES) if (ok(g)) best = g;
    if (best == null) return { g: 1.0, impossible: true };
    return { g: best, safe: best === 4.0 };
  }
  // the worst valid grade that still meets the target when used everywhere
  function flatGradeFor(modules, target) {
    let best = null;
    for (const g of GRADES) {
      const r = gpa(modules, "proj", () => g);
      if (r.official != null && r.official <= target + EPS) best = g;
    }
    return best;
  }

  /* ---------------- effort-aware optimizer ----------------
     Each planned module costs  cp × difficulty × f(grade),  f(g) = (4 − g)²  (convex:
     every step towards 1,0 is harder than the previous one). Greedy: starting from 4,0
     everywhere, repeatedly buy the grade step with the best ΔGPA / Δeffort until the
     official (truncated) grade meets the target. Modules dropped by a § 25 (5) cap
     gain nothing and therefore get no effort.                                        */
  const DIFF = { 1: 0.6, 2: 1, 3: 1.8 };
  const f = (g) => (4 - g) * (4 - g);
  const effortOf = (m, g) => (+m.cp || 0) * (DIFF[m.diff || 2]) * f(g);

  function optimize(modules, target) {
    const open = modules.filter((m) => m.status === "open" && !m.ungraded);
    if (!open.length) return null;
    const g = new Map(open.map((m) => [m, 4.0]));
    const ov = (m) => (g.has(m) ? g.get(m) : m.grade);
    let cur = gpa(modules, "proj", ov).exact;
    let guard = 0;
    while (truncate2(cur) > target + EPS && guard++ < 2000) {
      let best = null;
      for (const m of open) {
        const gi = g.get(m), idx = GRADES.indexOf(gi);
        if (idx <= 0) continue;
        const ng = GRADES[idx - 1];
        if (ng < (m.floor || 1.0) - EPS) continue;
        g.set(m, ng);
        const val = gpa(modules, "proj", ov).exact;
        g.set(m, gi);
        const gain = cur - val;
        if (gain <= 1e-12) continue;
        const ratio = gain / (effortOf(m, ng) - effortOf(m, gi));
        if (!best || ratio > best.ratio + 1e-15) best = { m, ng, val, ratio };
      }
      if (!best) break;
      g.set(best.m, best.ng);
      cur = best.val;
    }
    const effort = open.reduce((s, m) => s + effortOf(m, g.get(m)), 0);
    const res = gpa(modules, "proj", ov);
    return { grades: g, exact: cur, official: truncate2(cur), reached: truncate2(cur) <= target + EPS, effort, marks: res.marks };
  }
  function flatEffort(modules, grade) {
    return modules.filter((m) => m.status === "open" && !m.ungraded).reduce((s, m) => s + effortOf(m, grade), 0);
  }

  /* what does one extra planned elective in an area do? (§ 25 (5) over-shooting) */
  function overshoot(modules, area, cp, grade) {
    const base = gpa(modules, "proj");
    const extra = { a: area, cp, grade, status: "open", name: "+" };
    const withX = gpa(modules.concat([extra]), "proj");
    // which existing module loses weight?
    let loser = null, lost = 0;
    for (const m of modules) {
      const before = base.marks.get(m) ?? 0, after = withX.marks.get(m) ?? 0;
      if (before - after > lost + EPS) { lost = before - after; loser = m; }
    }
    return { before: base.exact, after: withX.exact, delta: base.exact - withX.exact, loser, lost };
  }

  /* leverage of a planned module: GPA change for one grade step better / worse */
  function leverage(modules, m, base) {
    if (m.status !== "open" || m.ungraded) return null;
    const idx = GRADES.indexOf(+m.grade);
    const at = (g) => gpa(modules, "proj", (x) => (x === m ? g : x.grade)).exact;
    const better = idx > 0 ? base - at(GRADES[idx - 1]) : 0;
    const worse = idx >= 0 && idx < GRADES.length - 1 ? at(GRADES[idx + 1]) - base : 0;
    const ace = base - at(1.0);
    return { better, worse, ace };
  }

  /* ---------------- structure checks ---------------- */
  function structure(modules) {
    const rows = [];
    const add = (id, label) => {
      const n = nodeById(id);
      const cp = cpUnder(n, modules);
      const st = cp < n.min ? "low" : n.max != null && cp > n.max ? "high" : "ok";
      rows.push({ id, label, cp, min: n.min, max: n.max, cap: n.capGrade, st });
    };
    ["A", "B111", "B112", "B11", "B12", "B1", "B2", "C"].forEach((id) => add(id));
    const total = ["A", "B1", "B2", "C"].reduce((s, id) => s + cpUnder(nodeById(id), modules), 0);
    rows.push({ id: "TOTAL", cp: total, min: 180, max: 180, st: total < 180 ? "low" : total > 180 ? "high" : "ok" });
    return rows;
  }

  /* B 1.2 sub-rules: ≥1 Seminar, ≥1 Praktikum, ≤1 PiL, ≤1 Studienarbeit (+ CP bounds) */
  function b12Rules(modules) {
    const out = [];
    for (const gr of GROUPS.B12) {
      const ms = modules.filter((m) => m.a === "B12" && counts(m) && (m.g || "") === gr.id);
      const cp = ms.reduce((s, m) => s + (+m.cp || 0), 0);
      let st = "ok";
      if (gr.minCount && ms.length < gr.minCount) st = "low";
      if (gr.maxCount && ms.length > gr.maxCount) st = "high";
      if (gr.maxCp && cp > gr.maxCp) st = "high";
      if (gr.minCp && ms.length && cp < gr.minCp) st = "low";
      out.push({ g: gr, n: ms.length, cp, st });
    }
    const untyped = modules.filter((m) => m.a === "B12" && counts(m) && !GROUPS.B12.some((x) => x.id === m.g));
    return { rows: out, untyped: untyped.length };
  }

  /* ---------------- Abwahl budget (§ 30 (5)/(6)) ----------------
     § 30 (5) areas: B 1.1.1 and each Wahlbereich Schwerpunkt → one deselection each.
     § 30 (6) areas: B 1.2 and Studium Generale → unlimited.                     */
  function abwahlAreas() {
    return [{ key: "B111", a: "B111", g: null }].concat(GROUPS.B112.map((gr) => ({ key: "B112:" + gr.id, a: "B112", g: gr.id })));
  }
  function abwahlKey(m) {
    if (m.a === "B111") return "B111";
    if (m.a === "B112") return "B112:" + (m.g || "?");
    return null;
  }
  function abwahlUsed(modules, key) { return modules.filter((m) => m.status === "dropped" && abwahlKey(m) === key).length; }
  function canDrop(modules, m) {
    if (m.status !== "open") return { ok: false, why: "notopen" };
    if (m.a === "A" || m.a === "C") return { ok: false, why: "pflicht" };
    if (m.a === "B12" || m.a === "B2") return { ok: true, unlimited: true };
    const key = abwahlKey(m);
    return abwahlUsed(modules, key) >= 1 ? { ok: false, why: "used", key } : { ok: true, key };
  }

  /* ---------------- semesters ---------------- */
  // start = {term:"WS"|"SS", year}. Semester n → label
  // ordinal: SoSe y = 2y, WiSe y/y+1 = 2y+1  (SoSe 2024 directly follows WiSe 23/24)
  const ord = (t, y) => y * 2 + (t === "WS" ? 1 : 0);
  function termOf(start, n) {
    const o = ord(start.term, start.year) + n - 1;
    if (o % 2 === 1) { const y = (o - 1) / 2; return { term: "WS", label: `WiSe ${String(y).slice(2)}/${String(y + 1).slice(2)}` }; }
    return { term: "SS", label: `SoSe ${String(o / 2).slice(2)}` };
  }
  // date of a result → semester number relative to start (Oct–Apr results → WiSe, May–Sep → SoSe)
  function semesterOfDate(start, d) {
    const y = d.getFullYear(), mo = d.getMonth() + 1;
    let term, ty;
    if (mo >= 10) { term = "WS"; ty = y; } else if (mo <= 4) { term = "WS"; ty = y - 1; } else { term = "SS"; ty = y; }
    const n = ord(term, ty) - ord(start.term, start.year) + 1;
    return n >= 1 ? n : 1;
  }

  return {
    truncate2, stufe, tone, gpa, cpUnder, nodeById, leaves, uniformGrade, flatGradeFor,
    optimize, flatEffort, overshoot, leverage, structure, b12Rules,
    abwahlAreas, abwahlKey, abwahlUsed, canDrop, termOf, semesterOfDate, counts, goalGrade,
  };
})();
window.Engine = Engine;
