/* ==========================================================================
   Notenspiegel statistics (js/gradestats.js, generated from TUCaN screenshots
   by tools/notenspiegel/extract.py). Pure helpers, no DOM.
   ========================================================================== */
"use strict";

const GradeStats = (() => {
  const G = [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0, 5.0];
  let index = null;
  function idx() {
    if (index) return index;
    index = new Map();
    for (const [code, es] of Object.entries(window.GRADE_STATS || {})) index.set(Tucan.baseCode(code), es);
    return index;
  }
  const entries = (code) => (code ? idx().get(Tucan.baseCode(code)) || [] : []);

  /* all exam dates of a module (or one term) added up */
  function summary(code, term) {
    const es = entries(code).filter((e) => !term || e.term === term);
    if (!es.length) return null;
    const counts = G.map((_, i) => es.reduce((s, e) => s + (e.counts[i] || 0), 0));
    const n = counts.reduce((a, b) => a + b, 0);
    if (!n) return null;
    const passed = n - counts[10];
    const sum = (k) => counts.slice(0, k).reduce((s, c, i) => s + c * G[i], 0);
    const missing = es.reduce((m, e) => { for (const [k, v] of Object.entries(e.missing || {})) m[k] = (m[k] || 0) + v; return m; }, {});
    return { counts, n, passed, failRate: counts[10] / n, avgAll: sum(11) / n, avgPassed: passed ? sum(10) / passed : null, exams: es.length, missing };
  }
  const terms = (code) => [...new Set(entries(code).map((e) => e.term))];
  const count = () => idx().size;

  return { G, entries, summary, terms, count };
})();
