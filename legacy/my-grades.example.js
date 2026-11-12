/* ---------------------------------------------------------------------------
   Copy this file to  my-grades.js  and fill in your own Leistungsspiegel.
   my-grades.js is in .gitignore, so your grades never leave your machine.
   If my-grades.js does not exist, gpa.html starts from the blank template.

   Fields
     a       area id — "A" Pflichtbereich · "B111" Wahlpflichtbereich
             "B112" Informatik-Wahlbereiche · "B12" Studienbegleitende Leistungen
             "B2" Studium Generale · "C" Bachelorarbeit
     code    TUCaN number, free text, may be ""
     name    module name shown in the table
     cp      credit points
     sem     recommended semester (optional, Pflichtbereich only)
     status  "done" passed and final · "open" still to come · "off" not taking it
     grade   1.0 1.3 1.7 2.0 2.3 2.7 3.0 3.3 3.7 4.0 — for "open" rows this is your goal
     ungraded true for bestanden/nicht-bestanden modules (never enter the Gesamtnote)
     fixed   true for Pflichtbereich + thesis rows, so name and CP cannot be edited
   --------------------------------------------------------------------------- */
window.MY_PLAN = {
  target: 2.50,
  modules: [
    // Pflichtbereich — the 20 modules of the PO 2023, adjust status/grade to yours
    {a:"A", code:"20-00-1141", name:"Erfolgreich ins Informatik-Studium starten", cp:1, sem:1, ungraded:true, status:"open", grade:null, fixed:true},
    {a:"A", code:"20-00-0004", name:"Funktionale und objektorientierte Programmierkonzepte", cp:10, sem:1, status:"open", grade:2.0, fixed:true},
    {a:"A", code:"20-00-0900", name:"Digitaltechnik", cp:5, sem:1, status:"open", grade:2.0, fixed:true},
    // … see gpa.html blankData() for the full list, or just start from the app and export JSON

    // Electives — add as many rows as you plan to take
    {a:"B111", code:"20-00-0903", name:"Betriebssysteme", cp:5, status:"open", grade:2.0},
    {a:"B112", code:"", name:"Wahlbereich-Modul", cp:5, status:"open", grade:2.0},
    {a:"B12",  code:"", name:"Seminar (min. 1 verpflichtend)", cp:3, status:"open", grade:2.0},
    {a:"B12",  code:"", name:"Praktikum / Projektpraktikum (min. 1 verpflichtend)", cp:6, status:"open", grade:2.0},
    {a:"B2",   code:"", name:"Studium Generale (anderer Fachbereich)", cp:5, status:"open", grade:2.0},
    {a:"C", code:"20-AM-4000", name:"Bachelorarbeit Informatik", cp:12, sem:6, status:"open", grade:2.0, fixed:true},
  ]
};
