/* ==========================================================================
   Wahlbereich modules newer than the Modulhandbuch (Stand 30.09.2022), so
   tools/extract_catalog.py can't find them. Kept apart from the generated
   catalog.js so a re-run doesn't wipe them.
   Source: TUCaN's public Vorlesungsverzeichnis (WiSe 26/27, SoSe 26, WiSe 25/26)
   and the TU exam schedule WiSe 26/27.
   CP: from the old combined Modulhandbuch B.Sc./M.Sc. where listed, else from
   SWS (4 SWS → 6 CP, 2 SWS → 3 CP – holds for 38 of 40 catalog modules).
   Group: the VV doesn't say which PO 2023 Schwerpunkt a module counts for, so
   `est: true` marks a group (or CP) picked by research area – check TUCaN.
   Remove an entry once a newer Modulhandbuch contains the module.
   ========================================================================== */
"use strict";

(() => {
  const extra = [
    { code: "20-00-1233", name: "Introduction to Large Language Models", cp: 6, a: "B112", g: "KI", lang: "en", est: true },
    { code: "20-00-1193", name: "Multimodal Artificial Intelligence", cp: 6, a: "B112", g: "KI", lang: "en", est: true },
    { code: "20-00-1189", name: "Causality for Artificial Intelligence and Machine Learning", cp: 3, a: "B112", g: "KI", lang: "en", est: true },
    { code: "20-00-1181", name: "Intelligent Robotic Manipulation: Advanced Topics in Robot Perception, Planning and Control", cp: 6, a: "B112", g: "KI", lang: "en", est: true },
    { code: "20-00-1178", name: "Physical Attacks and Countermeasures", cp: 6, a: "B112", g: "CYB", lang: "en", est: true },
    { code: "20-00-0720", name: "Sichere Kritische Infrastrukturen", cp: 3, a: "B112", g: "CYB", lang: "de", est: true },
    { code: "20-00-1202", name: "Foundations of Modern Data Systems", cp: 6, a: "B112", g: "KVS", lang: "en", est: true },
    { code: "20-00-1180", name: "3D Scanning & Motion Capture", cp: 6, a: "B112", g: "SWHW", lang: "en", est: true },
    { code: "20-00-1192", name: "AI-based 3D Graphics & Vision", cp: 6, a: "B112", g: "SWHW", lang: "en", est: true },
    { code: "20-00-1229", name: "Computer Architekturen und ihre Implementierung", cp: 9, a: "B112", g: "SWHW", lang: "de/en", est: true }, // 6 SWS: 9 or 10 CP
    { code: "20-00-1117", name: "Konzepte der Programmiersprachen", cp: 6, a: "B112", g: "SWHW", lang: "en", est: true },
    { code: "20-00-1208", name: "Verteilte Robotersysteme", cp: 6, a: "B112", g: "SWHW", lang: "en", est: true },
    { code: "20-00-1144", name: "Quantum Information Science", cp: 6, a: "B112", g: "THEO", lang: "en", est: true },
    { code: "20-00-0186", name: "Optimierung statischer und dynamischer Systeme", cp: 10, a: "B112", g: "THEO", lang: "de", est: true },
  ];
  const have = new Set((window.CATALOG || []).map((c) => c.code));
  window.CATALOG = (window.CATALOG || []).concat(extra.filter((c) => !have.has(c.code)))
    .sort((x, y) => x.a.localeCompare(y.a) || (x.g || "").localeCompare(y.g || "") || x.name.localeCompare(y.name, "de", { sensitivity: "base" }));
})();
