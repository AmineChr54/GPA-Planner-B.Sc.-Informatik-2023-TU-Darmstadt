/* ==========================================================================
   Regulation data — B.Sc. Informatik (PO 2023), TU Darmstadt
   Sources: APB (Satzungsbeilage 2023-VII), Studiengangsordnung 2023,
   Studien- und Prüfungsplan (Anhang I). Copies in upstream/docs/.
   ========================================================================== */
"use strict";

window.GRADES = [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0];

/* PO tree. capGrade = "Die Ergebnisse von maximal X Credits gehen in die
   Notenberechnung ein" (printed on the Leistungsspiegel, APB § 25 (5)).
   abwahl: "5" = Typ § 30 Abs. 5 (one deselection), "6" = Abs. 6 (unlimited). */
window.PO = {
  id: "root", children: [
    { id: "A", min: 114, max: 114, capGrade: null, leaf: true },
    { id: "B", min: 54, max: 54, capGrade: null, children: [
      { id: "B1", min: 48, max: 49, capGrade: 49, children: [
        { id: "B11", min: 30, max: 40, capGrade: 40, children: [
          { id: "B111", min: 10, max: 35, capGrade: 35, leaf: true, addable: true, abwahl: "5" },
          { id: "B112", min: 5, max: 30, capGrade: 30, leaf: true, addable: true, abwahl: "5", groups: true },
        ]},
        { id: "B12", min: 9, max: 18, capGrade: 18, leaf: true, addable: true, abwahl: "6", groups: true },
      ]},
      { id: "B2", min: 5, max: 6, capGrade: 6, leaf: true, addable: true, abwahl: "6" },
    ]},
    { id: "C", min: 12, max: 12, capGrade: 12, leaf: true },
  ],
};

/* Groups inside an area.
   B112: each Schwerpunkt is its own Typ § 30 Abs. 5 area (one Abwahl each), 0–30 CP.
   B12: sub-catalogues with their own counting rules (SPP Anhang I).            */
window.GROUPS = {
  B112: [
    { id: "KI",   de: "Künstliche Intelligenz",          en: "Artificial Intelligence" },
    { id: "CYB",  de: "Cybersicherheit und Privatheit",  en: "Cybersecurity and Privacy" },
    { id: "KVS",  de: "Komplexe vernetzte Systeme",      en: "Complex Networked Systems" },
    { id: "SWHW", de: "Software & Hardware",             en: "Software & Hardware" },
    { id: "THEO", de: "Theorie",                         en: "Theory" },
  ],
  B12: [
    { id: "SEM",  de: "Seminar",                         en: "Seminar",            minCount: 1, minCp: 3, maxCp: 12 },
    { id: "PRAK", de: "Praktikum / Projektpraktikum",    en: "Lab / project lab",  minCount: 1, minCp: 6, maxCp: 15 },
    { id: "PIL",  de: "Praktikum in der Lehre",          en: "Teaching practicum", maxCount: 1, maxCp: 5 },
    { id: "SA",   de: "Studienarbeit",                   en: "Study project",      maxCount: 1, maxCp: 9 },
  ],
};

/* Pflichtbereich (114 CP) + Bachelorarbeit, Studien- und Prüfungsplan PO 2023
   [code, name, CP, recommended semester, ungraded, sl = needs a Studienleistung for exam admission (*)] */
window.PFLICHT = [
  ["20-00-1141", "Erfolgreich ins Informatik-Studium starten", 1, 1, true],
  ["20-00-0004", "Funktionale und objektorientierte Programmierkonzepte", 10, 1, false, true],
  ["20-00-0900", "Digitaltechnik", 5, 1, false, true],
  ["04-10-0118", "Mathematik I für Informatik", 9, 1, false, true],
  ["04-10-0120", "Automaten, formale Sprachen und Entscheidbarkeit", 5, 1, false, true],
  ["20-00-0005", "Algorithmen und Datenstrukturen", 10, 2, false, true],
  ["20-00-0902", "Rechnerorganisation", 5, 2, false, true],
  ["04-10-0119", "Mathematik II für Informatik", 9, 2, false, true],
  ["04-10-0121", "Aussagen- und Prädikatenlogik", 5, 2, false, true],
  ["20-00-0017", "Software Engineering", 5, 3],
  ["20-00-0018", "Computersystemsicherheit", 5, 3],
  ["20-00-1058", "Einführung in die Künstliche Intelligenz", 5, 3],
  ["20-00-1150", "Probabilistische Methoden der Informatik", 5, 3],
  ["20-00-0013", "Modellierung, Spezifikation und Semantik", 5, 3],
  ["20-00-0015", "Informationsmanagement", 5, 4],
  ["20-00-1151", "Computernetze und verteilte Systeme", 5, 4],
  ["20-00-1154", "Einführung in wissenschaftliches Arbeiten", 3, 5],
  ["20-00-1155", "Teamprojekt Softwareentwicklung", 9, 5],
  ["20-00-1152", "Parallele Programmierung", 5, 5],
  ["20-00-1153", "Informatik und Gesellschaft", 3, 5],
];
window.THESIS = ["20-AM-4000", "Bachelorarbeit Informatik", 12, 6];

/* blank plan: Pflicht + thesis + placeholder electives (ph:true → removed on TUCaN import) */
window.blankModules = function () {
  const mods = PFLICHT.map(([code, name, cp, sem, ungraded, sl]) => ({
    a: "A", code, name, cp, sem, rec: sem, fixed: true, sl: !!sl,
    status: "open", grade: ungraded ? null : 2.0, ungraded: !!ungraded,
  }));
  const ph = (a, g, name, cp, sem) => ({ a, g, code: "", name, cp, sem, status: "open", grade: 2.0, ph: true });
  // spread so that every semester lands near 30 CP (Pflicht per Studienübersicht 2025: 30/29/25/10/20/12)
  mods.push(
    ph("B111", null, "Wahlpflicht-Modul 1", 5, 3),
    ph("B111", null, "Wahlpflicht-Modul 2", 5, 4),
    ph("B111", null, "Wahlpflicht-Modul 3", 5, 6),
    ph("B111", null, "Wahlpflicht-Modul 4", 5, 6),
    ph("B112", "KI", "Wahlbereich-Modul 1", 6, 4),
    ph("B112", "KI", "Wahlbereich-Modul 2", 6, 5),
    ph("B112", "SWHW", "Wahlbereich-Modul 3", 6, 6),
    ph("B112", "THEO", "Wahlbereich-Modul 4", 2, 5),
    ph("B12", "SEM", "Seminar", 3, 5),
    ph("B12", "PRAK", "Praktikum", 6, 4),
    ph("B2", null, "Studium Generale", 5, 6),
  );
  const [code, name, cp, sem] = THESIS;
  mods.push({ a: "C", code, name, cp, sem, rec: sem, fixed: true, status: "open", grade: 2.0 });
  return mods;
};
