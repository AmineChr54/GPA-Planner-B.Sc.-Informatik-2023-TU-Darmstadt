/* ==========================================================================
   i18n — German (default) and English.
   ========================================================================== */
"use strict";

const I18N = (() => {
  const de = {
    "app.name": "Notenplaner", "app.sub": "B.Sc. Informatik · PO 2023 · TU Darmstadt",
    "nav.overview": "Übersicht", "nav.plan": "Studienplan", "nav.strategy": "Ziel & Strategie", "nav.exams": "Prüfungen",
    "nav.optimizer": "Optimierer", "nav.scenarios": "Szenarien", "nav.rules": "Regeln & Hintergrund",
    "scen.active": "Aktives Szenario", undo: "Rückgängig", undone: "Rückgängig gemacht",
    "menu.title": "Einstellungen & Daten", "menu.import": "Leistungsspiegel importieren", "menu.lang": "Sprache", "menu.theme": "Design",
    "theme.light": "Hell", "theme.dark": "Dunkel", "theme.system": "System", "theme.toDark": "Dunkles Design", "theme.toLight": "Helles Design",
    "grade.auto": "Auto", "grade.autoOpt": "≈ {g} automatisch (nötig fürs Ziel)", "grade.autoTitle": "Automatisch: so viel brauchst du für dein Ziel {t}. Rechtsklick oder Klick zum Festlegen.",
    "grade.impossible": "Ziel nicht erreichbar – selbst mit 1,0 in allen offenen Modulen",
    "foot.unofficial": "Inoffiziell – verbindlich ist nur die Prüfungsordnung.", "foot.local": "Deine Daten bleiben in diesem Browser.", "foot.credit": "Basiert auf Yacines GPA-Planner.",
    "stufe.sehrgut": "sehr gut", "stufe.gut": "gut", "stufe.befriedigend": "befriedigend", "stufe.ausreichend": "ausreichend", "stufe.nichtausreichend": "nicht ausreichend",
    total: "Gesamt", tooFew: "zu wenig", tooMany: "zu viel",
    "k.now": "Jetzt", "k.plan": "Plan", "k.proj": "Voraussichtliche Endnote", "k.target": "Ziel", "k.best": "Bestmöglich", "k.worst": "Schlechtestmöglich",
    term: "Semester", year: "Jahr", "term.WS": "Wintersemester", "term.SS": "Sommersemester", "term.WSshort": "WiSe", "term.SSshort": "SoSe",

    "welcome.title": "Willkommen beim Notenplaner",
    "welcome.lede": "Plane dein Informatikstudium an der TU Darmstadt: Studienplan zum Verschieben, deine Endnote genau nach Prüfungsordnung und was du für dein Ziel noch brauchst.",
    "welcome.s1": "Wann hast du angefangen?", "welcome.s2": "Leistungsspiegel laden", "welcome.s2p": "PDF aus TUCaN (Drucken → als PDF speichern) unten ablegen – deine Noten werden automatisch übernommen.",
    "welcome.s3": "Ziel setzen & planen", "welcome.s3p": "Zieh Wahlmodule in deine Semester und lass dir zeigen, welche Noten du brauchst.",
    "welcome.empty": "Ohne Import starten", "welcome.privacy": "Alles bleibt in deinem Browser – nichts wird hochgeladen.",

    "overview.title": "Übersicht", "overview.lede": "Deine Note, dein Ziel und was als Nächstes ansteht.",
    migrated: "Deine Daten aus Yacines GPA-Planner wurden übernommen.",
    "hero.help": "Nach § 28 APB: Modulnoten mit ihren CP gewichtet, in Wahlbereichen zählen nur die besten CP, das Ergebnis wird nach zwei Stellen abgeschnitten (nicht gerundet). Geplante Module zählen mit ihrer Zielnote.",
    "hero.cp": "{done} von 180 CP bestanden · {planned} CP geplant",
    "tucan.line": "TUCaN zeigt {tucan} (Schätzung), nach Prüfungsordnung stehst du bei {ours}.", "tucan.why": "Warum?",
    "next.title": "Als Nächstes", "hints.none": "Alles im grünen Bereich – Plan vollständig, keine Risiken.",
    "progress.title": "Fortschritt nach Bereichen", "progress.legend": "Dunkel = bestanden, hell = geplant, Strich = Mindest-CP.",
    "v.final": "Nichts mehr offen – die Note ist endgültig.",
    "v.out": "Ziel {target} ist nicht mehr erreichbar – selbst mit 1,0 überall landest du bei {best}.",
    "v.safe": "Dein Ziel ist sicher: selbst mit 4,0 in allen offenen Modulen landest du bei {worst}.",
    "v.aimHigher": "Ehrgeizigeres Ziel finden →",
    "v.need": "Du brauchst im Schnitt <b>{avg}</b> auf deinen {cp} offenen CP.",
    "btn.toOpt": "Besten Weg berechnen →", "btn.flat": "Alle offenen auf {g}", flatDone: "Alle offenen Module auf {g} gesetzt",
    "hint.low": "<b>{area}</b>: es fehlen noch {n} CP.", "hint.high": "<b>{area}</b>: {cp} CP geplant, Höchstgrenze {max} CP – nur die besten zählen.",
    "hint.b12.SEM.low": "Mindestens <b>ein Seminar</b> ist Pflicht.", "hint.b12.SEM.high": "Seminare: mehr als 12 CP ({cp} CP).",
    "hint.b12.PRAK.low": "Mindestens <b>ein Praktikum</b> (≥ 6 CP) ist Pflicht.", "hint.b12.PRAK.high": "Praktika: mehr als 15 CP ({cp} CP).",
    "hint.b12.PIL.high": "Höchstens <b>ein Praktikum in der Lehre</b> (max. 5 CP).", "hint.b12.PIL.low": "Praktikum in der Lehre: Regel verletzt.",
    "hint.b12.SA.high": "Höchstens <b>eine Studienarbeit</b> (max. 9 CP).", "hint.b12.SA.low": "Studienarbeit: Regel verletzt.",
    "hint.b12untyped": "{n} studienbegleitende Leistung(en) ohne Art (Seminar/Praktikum) – im Modul festlegen.",
    "hint.last": "<b>Letzter Versuch:</b> {name}.", "hint.oralUsed": "Die mündliche Ergänzungsprüfung ist schon verbraucht.", "hint.oralFree": "Bei Nichtbestehen bleibt einmal die mündliche Ergänzungsprüfung (§ 32).",
    "hint.second": "<b>{name}</b>: nächster Antritt ist eine Wiederholung.", "hint.canDrop": "Noch abwählbar.",
    "hint.ph": "{n} Platzhalter im Plan – ersetze sie durch echte Module.", "hint.choices": "{n} Auswahlblock/-blöcke noch nicht entschieden.",
    "hint.regel": "Dein Plan geht bis ins {n}. Fachsemester – Regelstudienzeit sind 6.",
    "btn.fill": "Lücken auffüllen", filled: "Fehlende CP mit Platzhaltern aufgefüllt",
    today: "heute", tomorrow: "morgen", inDays: "in {n} Tagen", daysAgo: "vor {n} Tagen",
    "att.last": "letzter Versuch", "att.second": "Wiederholung", "att.opt0": "1. Versuch", "att.opt1": "2. Versuch (1 Fehlversuch)", "att.opt2": "3. Versuch – letzter",

    "plan.title": "Studienplan", "plan.lede": "Dein Studium auf einen Blick. Ziehe Module zwischen Semestern hin und her, klicke ein Modul an, um Note und Status zu ändern.",
    "plan.mode": "Ansicht", "plan.grid": "Plan", "plan.list": "Liste", "plan.export": "Exportieren",
    "plan.cp": "{cp} von 180 CP", "plan.allOk": "Struktur vollständig ✓",
    "plan.png": "Als Bild (PNG) speichern", "plan.pdf": "Als PDF drucken", "plan.pngWorking": "Bild wird erstellt …", "plan.pngFail": "Bild konnte nicht erstellt werden.",
    "issue.low": "{n} CP fehlen", "issue.high": "{n} CP zu viel",
    "issue.b12.SEM.low": "Seminar fehlt", "issue.b12.PRAK.low": "Praktikum fehlt", "issue.b12.PIL.high": "max. 1 Praktikum in der Lehre", "issue.b12.SA.high": "max. 1 Studienarbeit",
    "issue.b12.SEM.high": "Seminare > 12 CP", "issue.b12.PRAK.high": "Praktika > 15 CP", "issue.b12.PIL.low": "Praktikum in der Lehre", "issue.b12.SA.low": "Studienarbeit",
    "timeline.start": "Studienbeginn", semN: "{n}. Semester", semShortN: "{n}. Sem.",
    "sem.urlaub": "Urlaubssemester", "sem.abroad": "Ausland", "sem.notCounted": "zählt nicht als Fachsemester",
    "sem.urlaubNote": "Keine Module – zählt nicht als Fachsemester.", "sem.abroadHint": "Auslandssemester – eigene Module",
    "sem.avgTitle": "Schnitt der Module dieses Semesters", "sem.menu": "Semester-Optionen",
    "sem.typeN": "Normales Semester", "sem.typeU": "Urlaubssemester", "sem.typeA": "Auslandssemester",
    "sem.insertBefore": "Semester davor einfügen", "sem.remove": "Semester entfernen", "sem.removeFull": "Entfernen (erst leeren)",
    "sem.add": "Semester hinzufügen", "sem.addN": "+ Semester", "sem.addU": "+ Urlaubs­semester", "sem.addA": "+ Auslands­semester", "sem.added": "{label} hinzugefügt", "sem.tileN": "Semester", "sem.tileU": "Urlaub", "sem.tileA": "Ausland", "sem.addTitle": "{type} hinzufügen",
    "ctx.hint": "Rechtsklick auf Modul, Semester oder Bereich: Schnellmenü", "ctx.planHere": "Hier einplanen", "ctx.fromCat": "{area} aus dem Katalog",
    "ctx.own": "Eigenes Modul", "ctx.semType": "Art des Semesters", "ctx.move": "Verschieben nach", "ctx.pool": "Ohne Semester (in den Bereich)", "ctx.open": "Alle Details …",
    "sem.err.notEmpty": "Das Semester enthält noch Module – verschiebe sie zuerst.", "sem.err.onlyAbroad": "Ein Auslandssemester enthält nur eigene Auslandsmodule – verschiebe die anderen zuerst.", "sem.err.last": "Mindestens ein Semester muss bleiben.",
    dropHere: "hierher ziehen", unplanned: "Nicht eingeplant",
    "drop.wrongBand": "Das Modul gehört in einen anderen Bereich.", "drop.urlaub": "Im Urlaubssemester werden keine Module geplant.", "drop.abroadOnly": "Ins Auslandssemester kommen nur eigene Auslandsmodule (+ Modul aus dem Ausland).",
    "band.open": "offener Wahlkatalog", "band.planned": "{cp} CP geplant", "band.empty": "Alles eingeplant – ziehe ein Modul hierher, um es aus dem Semester zu nehmen.",
    "band.desc.B111": "Auswahl aktuell aus: Betriebssysteme; Einführung in den Compilerbau; Scientific Computing; Formale Methoden im Softwareentwurf; Visual Computing",
    "band.desc.B112": "Lehrveranstaltungen aus den Forschungsschwerpunkten der Informatik",
    "band.desc.B12": "Seminare; Praktikum in der Lehre; Praktika, Projektpraktika und ähnliche Veranstaltungen; Studienarbeit",
    "band.desc.B2": "Wahl aus den Gesamtkatalogen aller Fachbereiche der TU Darmstadt außer dem Fachbereich Informatik",
    "band.core": "Pflichtmodule ohne Semester",
    "legend.sl": "Benötigt zur Klausurzulassung eine Studienleistung, in der Regel durch Hausaufgabenpunkte zu erwerben",
    "legend.done": "bestanden", "legend.open": "geplant", "legend.height": "Höhe ≈ CP",
    "choice.or": "oder", "choice.tag": "Auswahl", "choice.new": "+ Auswahlblock", "choice.blockName": "Auswahl {area}",
    "choice.title": "Auswahlblock", "choice.help": "Noch nicht entschieden? Sammle Kandidaten – der Block zählt als ein Modul mit seinen CP und deiner Zielnote. Wenn du dich festlegst, klick „Nehmen“.",
    "choice.take": "Nehmen", "choice.none": "Noch keine Optionen.", "choice.fromCatalog": "Option aus Katalog", "choice.custom": "Eigene Option",
    "choice.convert": "In Auswahlblock umwandeln („das oder das“)", "choice.added": "„{name}“ als Option hinzugefügt", "choice.decided": "Entschieden: {name}", "choice.customPrompt": "Name der Option:",
    "abroad.tag": "Ausland", "abroad.add": "Modul aus dem Ausland", "abroad.newName": "Modul im Ausland",
    "abroad.note": "Auslandsmodule werden per Anerkennung in einen Bereich eingebracht. Trage die erwartete deutsche Note ein – die Umrechnung legt das Studienbüro fest.",
    passedShort: "bestanden", goalShort: "Ziel",
    "chart.title": "Notenschnitt im Verlauf", "chart.sub": "Schnitt aller Module bis einschließlich des jeweiligen Semesters",
    "chart.legend": "Durchgezogen = bestanden, gestrichelt = geplant (mit Zielnoten). Die gepunktete Linie ist dein Ziel.",
    "chart.aria": "Notenschnitt je Semester: {list}", "chart.cum": "Schnitt bis hier", "chart.own": "Dieses Semester", "chart.isDone": "abgeschlossen", "chart.isPlan": "geplant",
    "col.module": "Modul", "col.sem": "Semester", "col.status": "Status", "col.grade": "Note", "col.date": "Prüfungstermin", "col.attempt": "Versuch", "col.rule": "Abwahl",
    "status.done": "Bestanden", "status.open": "Geplant", "status.off": "Nicht belegt", "status.dropped": "Abgewählt",
    details: "Details", remove: "Entfernen", close: "Schließen", done: "Fertig", cancel: "Abbrechen", all: "Alle", add: "Hinzufügen",
    "f.goalGrade": "Zielnote", "f.sem": "Semester", "f.name": "Name", "f.code": "Modulnummer", "f.area": "Bereich (Anerkennung)", "f.type": "Art", "f.group": "Schwerpunkt",
    "f.exam": "Prüfung", "f.strategy": "Für den Optimierer",
    ungradedNote: "Unbenotet (bestanden / nicht bestanden) – zählt nicht in die Note.",
    "btn.catalog": "+ Aus Katalog", "btn.custom": "+ Eigenes Modul", "btn.drop": "Abwählen", "btn.undrop": "Wieder aufnehmen",
    "cat.title": "Modulkatalog", "cat.titleChoice": "Optionen für den Auswahlblock", "cat.search": "Name oder Nummer …", "cat.inPlan": "im Plan", "cat.inChoice": "Option", "cat.asOption": "Als Option",
    "cat.none": "Nichts gefunden.", "cat.note": "Modulhandbuch 09/2022 – das aktuelle Angebot steht in TUCaN.", "cat.backTo": "Zurück zu {name}",
    "ph.B111": "Platzhalter Wahlpflicht", "ph.B112": "Platzhalter Wahlbereich", "ph.B12": "Platzhalter Seminar/Praktikum", "ph.B2": "Platzhalter Studium Generale",
    newModule: "Neues Modul", added: "„{name}“ hinzugefügt", delConfirm: "„{name}“ entfernen?",
    "area.A": "Pflichtbereich", "area.B": "Wahlbereiche", "area.B1": "Informatik", "area.B11": "Fachprüfungen",
    "area.B111": "Wahlpflichtbereich", "area.B112": "Wahlbereiche Informatik", "area.B12": "Studienbegleitende Leistungen", "area.B2": "Studium Generale", "area.C": "Bachelorarbeit",
    "areaShort.A": "Pflicht", "areaShort.B": "Wahl", "areaShort.B1": "Informatik (B 1)", "areaShort.B11": "Fachprüfungen (B 1.1)",
    "areaShort.B111": "Wahlpflicht", "areaShort.B112": "Wahlbereiche", "areaShort.B12": "Seminare & Praktika", "areaShort.B2": "Studium Generale", "areaShort.C": "Bachelorarbeit",

    "strategy.title": "Ziel & Strategie", "strategy.lede": "Welche Noten brauchst du wirklich? Und welcher Plan führt mit dem wenigsten Aufwand ans Ziel?",
    "opt.nothing": "Keine offenen benoteten Module – nichts zu optimieren.",
    "opt.safe": "Ziel <b>{target}</b> ist ohnehin sicher – selbst mit 4,0 überall landest du bei <b>{worst}</b>. Wähle ein ehrgeizigeres Ziel zwischen <b>{best}</b> (bestmöglich) und {worst}:",
    "opt.reached": "Ziel <b>{target}</b> erreicht mit <b>{res}</b>.", "opt.saving": "≈ {p} % weniger Aufwand als pauschal {flat} überall.",
    "opt.notReached": "Ziel <b>{target}</b> mit deinen Obergrenzen nicht erreichbar – bestenfalls <b>{res}</b>. Lockere „Bestenfalls“ oder plane zusätzliche Wahlmodule.",
    "opt.apply": "Plan übernehmen", "opt.asScenario": "Als neues Szenario", "opt.applied": "Empfohlene Noten übernommen", "opt.saved": "Neues Szenario mit optimiertem Plan angelegt", "opt.scenName": "Optimiert für {t}",
    "opt.plan": "Empfohlene Noten", "opt.planSub": "Sag pro Modul, wie schwer es dir fällt – der Optimierer verteilt den Aufwand.",
    "opt.diff": "Schwierigkeit", "opt.floor": "Bestenfalls", "opt.current": "Geplant", "opt.rec": "Empfohlen", "diff.1": "leicht", "diff.2": "normal", "diff.3": "schwer",
    "opt.how": "Wie wird gerechnet?",
    "opt.method": "Jedes Modul kostet CP × Schwierigkeit × (4 − Note)² – jeder Schritt Richtung 1,0 ist teurer als der vorige. Der Optimierer kauft immer die Notenstufe mit der größten Wirkung pro Aufwand, inklusive Kappung nach § 25 (5): Module, die ohnehin gestrichen werden, bekommen keinen Aufwand.",
    "opt.over": "Ein Modul mehr belegen?", "opt.overSub": "Weil in Wahlbereichen nur die besten CP zählen, kann ein zusätzliches gutes Modul eine schwache Note verdrängen (§ 25 Abs. 5).",
    "opt.extraGrade": "Angenommene Note:", "opt.overRow": "+{cp} CP <b>{area}</b> mit {g} → Endnote <b>{d}</b>, verdrängt {loser}", "opt.overNone": "Mit {g} bringt ein zusätzliches Modul gerade nichts.",
    "opt.drop": "Abwählen statt wiederholen", "opt.dropSub": "Nicht abgeschlossene Wahlmodule kannst du abwählen (§ 30 Abs. 5/6): Wiederholungen entfallen, Fehlversuche zählen nicht.",
    "opt.dropAtt": "{n} Fehlversuch(e).", "opt.dropWeak": "geplant nur {g}.", "opt.drop5": "Noch abwählbar (einmal in diesem Bereich).", "opt.drop6": "Beliebig oft abwählbar.", "opt.dropUsed": "Abwahl in diesem Bereich verbraucht.",
    "opt.dropNone": "Keine Kandidaten – keine Fehlversuche und keine schwachen Wahlmodule.", droppedByCap: "zählt wegen Kappung nicht",
    "scen.copy": "Kopie", "scen.opt": "+ Optimistisch", "scen.pess": "+ Pessimistisch", "scen.optName": "Optimistisch", "scen.pessName": "Pessimistisch", "scen.copyName": "{name} (Kopie)",
    "scen.isActive": "aktiv", "scen.activate": "Aktivieren", "scen.rename": "Umbenennen", "scen.need": "Benötigter Schnitt", "scen.impossible": "unerreichbar", "scen.safe": "sicher",
    "scen.cp": "Geplante CP", "scen.diff": "Unterschiede", "scen.diffSub": "{n} Module unterscheiden sich",
    "scen.noDiff": "Die Szenarien sind (noch) identisch.", "scen.onlyOne": "Lege ein zweites Szenario an, um Pläne zu vergleichen – z. B. optimistisch und pessimistisch. Bestandene Module, Fehlversuche und Termine gelten in allen Szenarien.",
    "scen.renamePrompt": "Neuer Name:", "scen.delConfirm": "Szenario „{name}“ löschen?",

    "exams.title": "Prüfungen", "exams.lede": "Termine, Versuche und was du abwählen darfst.",
    "exams.upcoming": "Nächste Prüfungen", "exams.noneYet": "Noch keine Termine – trag sie unten ein, dann erscheinen sie hier mit Countdown.",
    "ed.none.title": "Offizielle Prüfungstermine", "ed.none.text": "Noch keine Terminliste geladen. Wähle die Excel-Datei mit den Prüfungsterminen der TU (z. B. „Pruefungen_WiSe_…_Studierende.xlsx“) – die Informatik-Prüfungen werden automatisch herausgesucht.",
    "ed.pick": "Excel-Datei wählen", "ed.title": "Prüfungstermine {term}", "ed.asOf": "Stand {d}", "ed.count": "{n} Informatik-Prüfungen", "ed.repo": "gemeinsame Liste",
    "ed.ownFile": "aus deiner Datei {f}", "ed.forget": "Datei entfernen", "ed.disclaimer": "Ohne Gewähr – verbindlich sind TUCaN und die Aushänge.",
    "ed.official": "offizieller Termin", "ed.resetTo": "offizieller Termin: {d}", "ed.clash": "Überschneidung mit {other}", "ed.ics": "In Kalender (.ics)",
    "ed.icsSummary": "Prüfung: {name}", "ed.all": "Alle Informatik-Prüfungen {term}", "ed.allSub": "{n} Termine – hilft bei der Wahl der Wahlmodule",
    "ed.search": "Modul oder Nummer suchen …", "ed.date": "Datum", "ed.time": "Zeit", "ed.second": "Zweittermin", "ed.inPlan": "in deinem Plan",
    "ed.noneMine": "Für deine geplanten Module im {term} stehen noch keine Termine in der Liste.", "ed.loaded": "{n} Informatik-Prüfungen ({term}) geladen",
    "ed.badFile": "Das sieht nicht wie die Prüfungsterminliste aus.", "ed.unsupported": "Dein Browser kann .xlsx nicht lesen – bitte aktuellen Chrome, Firefox oder Safari nutzen.",
    "ed.chipTitle": "Prüfungstermin laut Liste {term}",
    "exams.all": "Offene Prüfungen", "exams.allSub": "Jede Fachprüfung hat 3 Versuche (§ 30, § 31)",
    "oral.title": "Mündliche Ergänzungsprüfung (§ 32)", "oral.text": "Einmal im Studium: nach dem Nichtbestehen der 2. Wiederholung einer schriftlichen Prüfung, Antrag innerhalb von 4 Wochen. Bestehen = 4,0.",
    "oral.used": "bereits genutzt", "oral.free": "noch verfügbar", "oral.which": "In welchem Modul?",
    "abwahl.title": "Abwahl-Kontingent (§ 30)", "abwahl.text": "Wahlpflicht und jeder Wahlbereich-Schwerpunkt: je einmal ein nicht abgeschlossenes Modul abwählen. Seminare/Praktika und Studium Generale: unbegrenzt.",
    "rule.pflicht": "Pflicht – muss bestanden werden", "rule.six": "beliebig abwählbar", "rule.five": "einmal abwählbar", "rule.fiveUsed": "Abwahl verbraucht",
    "dropped.title": "Abgewählte Module",
    "drop.no.notopen": "Nur nicht abgeschlossene Module können abgewählt werden.", "drop.no.pflicht": "Pflichtmodule und die Bachelorarbeit können nicht abgewählt werden.", "drop.no.used": "In diesem Bereich ist die einmalige Abwahl schon verbraucht.",
    "drop.confirm5": "„{name}“ abwählen? Das verbraucht die einmalige Abwahl in diesem Bereich (§ 30 Abs. 5). Der Antrag läuft über das Studienbüro.", "drop.confirm6": "„{name}“ abwählen? In diesem Bereich beliebig oft möglich (§ 30 Abs. 6).",
    "drop.done": "„{name}“ abgewählt",

    "import.title": "Import & Backup", "import.lede": "Leistungsspiegel aus TUCaN einlesen, Daten sichern oder auf ein anderes Gerät mitnehmen.",
    "imp.tucan": "Leistungsspiegel aus TUCaN", "imp.steps": "<li>TUCaN → <i>Prüfungen</i> → <i>Leistungsspiegel</i></li><li>Auf <i>Drucken</i> klicken und als PDF speichern</li><li>Die PDF hier ablegen</li>",
    "imp.dropTitle": "Leistungsspiegel-PDF hierher ziehen oder klicken", "imp.dropSub": "aus TUCaNs Druckfunktion – wird nur in deinem Browser gelesen",
    "imp.pasteTitle": "Oder: Text aus TUCaN einfügen", "imp.pastePh": "Leistungsspiegel-Seite markieren (Strg+A), kopieren und hier einfügen …", "imp.parse": "Text auswerten",
    "imp.privacy": "Die Datei wird nur in diesem Browser gelesen. Nichts wird hochgeladen.",
    "imp.reading": "Lese PDF …", "imp.error": "Konnte die PDF nicht lesen: {e}", "imp.noTable": "Keine Leistungsspiegel-Tabelle gefunden (Spalten „Credits“ und „Note“ fehlen).",
    "imp.nothing": "Keine Module erkannt.", "imp.noArea": "„{name}“ steht vor jeder Bereichsüberschrift – übersprungen.", "imp.failed": "„{name}“: nicht bestanden – als offen mit 1 Fehlversuch übernommen.",
    "imp.preview": "Vorschau – bitte prüfen", "imp.found": "{n} Module erkannt – {done} bestanden, {open} offen",
    "imp.match": "Aktion", "imp.update": "aktualisieren", "imp.new": "neu", "imp.failedShort": "nicht bestanden", "imp.inProgress": "offen",
    "imp.optAll": "In alle Szenarien übernehmen", "imp.optPh": "Platzhalter entfernen", "imp.apply": "Übernehmen", "imp.done": "Import: {updated} aktualisiert, {added} neu, {removed} Platzhalter entfernt",
    "backup.title": "Backup", "backup.text": "Deine Daten liegen nur in diesem Browser. Exportiere regelmäßig eine Sicherung – damit kannst du auch das Gerät wechseln. Dateien aus Yacines GPA-Planner lassen sich ebenfalls importieren.",
    "backup.export": "Backup exportieren", "backup.import": "Backup importieren", "backup.done": "Backup gespeichert", "backup.last": "Letztes Backup: {d}",
    "backup.loaded": "Backup geladen", "backup.invalid": "Keine gültige Sicherungsdatei.",
    "remind.text": "Dein letztes Backup ist {d} Tage alt und du hast seitdem etwas geändert.", "remind.never": "Du hast noch nie ein Backup gemacht – wenn du die Browserdaten löschst, ist dein Plan weg.", "remind.later": "Später",
    "del.btn": "Alle Daten löschen", "del.title": "Alle Daten in diesem Browser löschen?", "del.text": "Szenarien, Noten, Termine und Einstellungen werden aus diesem Browser entfernt. Das kann nicht rückgängig gemacht werden.",
    "del.note": "Tipp: Exportiere vorher ein Backup, falls du den Plan später wiederherstellen willst.", "del.exportFirst": "Erst Backup exportieren", "del.confirm": "Endgültig löschen", "del.done": "Alle Daten gelöscht",
    "rules.title": "Regeln & Hintergrund", "rules.lede": "Wie die Note berechnet wird – direkt aus APB und Studien- und Prüfungsplan.",
    "privacy.title": "Datenschutz", "privacy.storage": "Speicher in diesem Browser", "privacy.checking": "Prüfe …",
    "privacy.local": "Deine Daten liegen im localStorage dieses Browsers.", "privacy.persisted": "Der Browser hat dauerhaften Speicher gewährt – er löscht sie nicht von selbst.", "privacy.notPersisted": "Der Browser kann sie bei Speichermangel löschen – exportiere regelmäßig ein Backup.",
  };

  const en = {
    "app.name": "Grade Planner", "app.sub": "B.Sc. Computer Science · PO 2023 · TU Darmstadt",
    "nav.overview": "Overview", "nav.plan": "Study plan", "nav.strategy": "Goal & strategy", "nav.exams": "Exams",
    "nav.optimizer": "Optimizer", "nav.scenarios": "Scenarios", "nav.rules": "Rules & background",
    "scen.active": "Active scenario", undo: "Undo", undone: "Undone",
    "menu.title": "Settings & data", "menu.import": "Import Leistungsspiegel", "menu.lang": "Language", "menu.theme": "Theme",
    "theme.light": "Light", "theme.dark": "Dark", "theme.system": "System", "theme.toDark": "Dark theme", "theme.toLight": "Light theme",
    "grade.auto": "Auto", "grade.autoOpt": "≈ {g} automatic (what your goal needs)", "grade.autoTitle": "Automatic: what you need for your goal {t}. Right-click or click to set your own.",
    "grade.impossible": "Goal out of reach – even with 1.0 in every open module",
    "foot.unofficial": "Unofficial – only the Prüfungsordnung is binding.", "foot.local": "Your data stays in this browser.", "foot.credit": "Based on Yacine's GPA Planner.",
    "stufe.sehrgut": "very good", "stufe.gut": "good", "stufe.befriedigend": "satisfactory", "stufe.ausreichend": "sufficient", "stufe.nichtausreichend": "insufficient",
    total: "Total", tooFew: "too few", tooMany: "too many",
    "k.now": "Now", "k.plan": "Plan", "k.proj": "Expected final grade", "k.target": "Goal", "k.best": "Best possible", "k.worst": "Worst case",
    term: "Semester", year: "Year", "term.WS": "Winter semester", "term.SS": "Summer semester", "term.WSshort": "Winter", "term.SSshort": "Summer",

    "welcome.title": "Welcome to the Grade Planner",
    "welcome.lede": "Plan your CS degree at TU Darmstadt: a drag-and-drop study plan, your final grade exactly as the regulation defines it, and what you still need for your goal.",
    "welcome.s1": "When did you start?", "welcome.s2": "Load your Leistungsspiegel", "welcome.s2p": "Drop the PDF from TUCaN (print → save as PDF) below – your grades are filled in automatically.",
    "welcome.s3": "Set a goal & plan", "welcome.s3p": "Drag electives into your semesters and see which grades you need.",
    "welcome.empty": "Start without import", "welcome.privacy": "Everything stays in your browser – nothing is uploaded.",

    "overview.title": "Overview", "overview.lede": "Your grade, your goal and what's next.",
    migrated: "Your data from Yacine's GPA Planner was carried over.",
    "hero.help": "Per APB § 28: module grades weighted by CP, in elective areas only the best CP count, the result is truncated after two decimals (not rounded). Planned modules count with their goal grade.",
    "hero.cp": "{done} of 180 CP passed · {planned} CP planned",
    "tucan.line": "TUCaN shows {tucan} (an estimate); per the regulation you're at {ours}.", "tucan.why": "Why?",
    "next.title": "Up next", "hints.none": "All good – plan complete, no risks.",
    "progress.title": "Progress by area", "progress.legend": "Dark = passed, light = planned, tick = minimum CP.",
    "v.final": "Nothing left open – the grade is final.",
    "v.out": "Goal {target} is out of reach – even a 1.0 everywhere ends at {best}.",
    "v.safe": "Your goal is safe: even a 4.0 in every open module ends at {worst}.",
    "v.aimHigher": "Find a more ambitious goal →",
    "v.need": "You need an average of <b>{avg}</b> across your {cp} open CP.",
    "btn.toOpt": "Find the best path →", "btn.flat": "Set all open to {g}", flatDone: "All open modules set to {g}",
    "hint.low": "<b>{area}</b>: {n} CP still missing.", "hint.high": "<b>{area}</b>: {cp} CP planned, limit {max} CP – only the best count.",
    "hint.b12.SEM.low": "At least <b>one seminar</b> is required.", "hint.b12.SEM.high": "Seminars: more than 12 CP ({cp} CP).",
    "hint.b12.PRAK.low": "At least <b>one lab</b> (≥ 6 CP) is required.", "hint.b12.PRAK.high": "Labs: more than 15 CP ({cp} CP).",
    "hint.b12.PIL.high": "At most <b>one teaching practicum</b> (max 5 CP).", "hint.b12.PIL.low": "Teaching practicum: rule violated.",
    "hint.b12.SA.high": "At most <b>one Studienarbeit</b> (max 9 CP).", "hint.b12.SA.low": "Studienarbeit: rule violated.",
    "hint.b12untyped": "{n} seminar/lab module(s) without a type – set it in the module.",
    "hint.last": "<b>Last attempt:</b> {name}.", "hint.oralUsed": "The oral supplementary exam is already used.", "hint.oralFree": "If you fail, the one-time oral supplementary exam (§ 32) is still available.",
    "hint.second": "<b>{name}</b>: next sitting is a retake.", "hint.canDrop": "Can still be deselected.",
    "hint.ph": "{n} placeholders in the plan – replace them with real modules.", "hint.choices": "{n} choice block(s) not decided yet.",
    "hint.regel": "Your plan runs into semester {n} – the standard period is 6.",
    "btn.fill": "Fill gaps", filled: "Missing CP filled with placeholders",
    today: "today", tomorrow: "tomorrow", inDays: "in {n} days", daysAgo: "{n} days ago",
    "att.last": "last attempt", "att.second": "retake", "att.opt0": "1st attempt", "att.opt1": "2nd attempt (1 fail)", "att.opt2": "3rd attempt – last",

    "plan.title": "Study plan", "plan.lede": "Your degree at a glance. Drag modules between semesters, click a module to change its grade and status.",
    "plan.mode": "View", "plan.grid": "Plan", "plan.list": "List", "plan.export": "Export",
    "plan.cp": "{cp} of 180 CP", "plan.allOk": "Structure complete ✓",
    "plan.png": "Save as image (PNG)", "plan.pdf": "Print as PDF", "plan.pngWorking": "Creating image …", "plan.pngFail": "Could not create the image.",
    "issue.low": "{n} CP missing", "issue.high": "{n} CP too many",
    "issue.b12.SEM.low": "seminar missing", "issue.b12.PRAK.low": "lab missing", "issue.b12.PIL.high": "max 1 teaching practicum", "issue.b12.SA.high": "max 1 Studienarbeit",
    "issue.b12.SEM.high": "seminars > 12 CP", "issue.b12.PRAK.high": "labs > 15 CP", "issue.b12.PIL.low": "teaching practicum", "issue.b12.SA.low": "Studienarbeit",
    "timeline.start": "Start of studies", semN: "Semester {n}", semShortN: "Sem. {n}",
    "sem.urlaub": "Leave semester", "sem.abroad": "abroad", "sem.notCounted": "doesn't count as a semester of study",
    "sem.urlaubNote": "No modules – doesn't count as a semester of study.", "sem.abroadHint": "Semester abroad – your own modules",
    "sem.avgTitle": "Average of this semester's modules", "sem.menu": "Semester options",
    "sem.typeN": "Regular semester", "sem.typeU": "Leave semester (Urlaub)", "sem.typeA": "Semester abroad",
    "sem.insertBefore": "Insert semester before", "sem.remove": "Remove semester", "sem.removeFull": "Remove (empty it first)",
    "sem.add": "Add semester", "sem.addN": "+ Semester", "sem.addU": "+ Leave semester", "sem.addA": "+ Semester abroad", "sem.added": "{label} added", "sem.tileN": "Semester", "sem.tileU": "Leave", "sem.tileA": "Abroad", "sem.addTitle": "Add {type}",
    "ctx.hint": "Right-click a module, semester or area for quick actions", "ctx.planHere": "Plan here", "ctx.fromCat": "{area} from the catalog",
    "ctx.own": "Own module", "ctx.semType": "Semester type", "ctx.move": "Move to", "ctx.pool": "No semester (back to the area)", "ctx.open": "All details …",
    "sem.err.notEmpty": "This semester still has modules – move them first.", "sem.err.onlyAbroad": "A semester abroad only holds your own abroad modules – move the others first.", "sem.err.last": "At least one semester must remain.",
    dropHere: "drop here", unplanned: "Not scheduled",
    "drop.wrongBand": "This module belongs to a different area.", "drop.urlaub": "No modules are planned in a leave semester.", "drop.abroadOnly": "Only your own abroad modules go into a semester abroad (+ module from abroad).",
    "band.open": "open catalogue", "band.planned": "{cp} CP planned", "band.empty": "All scheduled – drop a module here to take it out of its semester.",
    "band.desc.B111": "Currently one of: Operating Systems; Compiler Construction; Scientific Computing; Formal Methods in Software Design; Visual Computing",
    "band.desc.B112": "Courses from the department's research focus areas",
    "band.desc.B12": "Seminars; teaching practicum; labs, project labs and similar; Studienarbeit",
    "band.desc.B2": "Any course from the other departments of TU Darmstadt (not Computer Science)",
    "band.core": "Compulsory modules without a semester",
    "legend.sl": "Exam admission requires a Studienleistung, usually earned through homework points",
    "legend.done": "passed", "legend.open": "planned", "legend.height": "height ≈ CP",
    "choice.or": "or", "choice.tag": "Choice", "choice.new": "+ Choice block", "choice.blockName": "Choice {area}",
    "choice.title": "Choice block", "choice.help": "Not decided yet? Collect candidates – the block counts as one module with its CP and your goal grade. When you decide, click “Take”.",
    "choice.take": "Take", "choice.none": "No options yet.", "choice.fromCatalog": "Option from catalog", "choice.custom": "Custom option",
    "choice.convert": "Turn into a choice block (“this or that”)", "choice.added": "“{name}” added as an option", "choice.decided": "Decided: {name}", "choice.customPrompt": "Option name:",
    "abroad.tag": "abroad", "abroad.add": "Module from abroad", "abroad.newName": "Module abroad",
    "abroad.note": "Modules from abroad are brought into an area via recognition (Anerkennung). Enter the expected German grade – the Studienbüro decides the conversion.",
    passedShort: "passed", goalShort: "goal",
    "chart.title": "Grade over time", "chart.sub": "Average of all modules up to and including each semester",
    "chart.legend": "Solid = passed, dashed = planned (with goal grades). The dotted line is your goal.",
    "chart.aria": "Grade per semester: {list}", "chart.cum": "Average so far", "chart.own": "This semester", "chart.isDone": "completed", "chart.isPlan": "planned",
    "col.module": "Module", "col.sem": "Semester", "col.status": "Status", "col.grade": "Grade", "col.date": "Exam date", "col.attempt": "Attempt", "col.rule": "Deselection",
    "status.done": "Passed", "status.open": "Planned", "status.off": "Not taking", "status.dropped": "Deselected",
    details: "Details", remove: "Remove", close: "Close", done: "Done", cancel: "Cancel", all: "All", add: "Add",
    "f.goalGrade": "Goal grade", "f.sem": "Semester", "f.name": "Name", "f.code": "Module number", "f.area": "Area (recognition)", "f.type": "Type", "f.group": "Focus area",
    "f.exam": "Exam", "f.strategy": "For the optimizer",
    ungradedNote: "Pass/fail – does not count towards the grade.",
    "btn.catalog": "+ From catalog", "btn.custom": "+ Custom module", "btn.drop": "Deselect", "btn.undrop": "Restore",
    "cat.title": "Module catalog", "cat.titleChoice": "Options for the choice block", "cat.search": "Name or number …", "cat.inPlan": "in plan", "cat.inChoice": "option", "cat.asOption": "As option",
    "cat.none": "Nothing found.", "cat.note": "Modulhandbuch 09/2022 – TUCaN has the current offering.", "cat.backTo": "Back to {name}",
    "ph.B111": "Placeholder compulsory elective", "ph.B112": "Placeholder elective area", "ph.B12": "Placeholder seminar/lab", "ph.B2": "Placeholder Studium Generale",
    newModule: "New module", added: "“{name}” added", delConfirm: "Remove “{name}”?",
    "area.A": "Compulsory modules", "area.B": "Electives", "area.B1": "Computer science", "area.B11": "Exams",
    "area.B111": "Compulsory electives", "area.B112": "CS elective areas", "area.B12": "Seminars & labs", "area.B2": "Studium Generale", "area.C": "Bachelor thesis",
    "areaShort.A": "Compulsory", "areaShort.B": "Electives", "areaShort.B1": "CS (B 1)", "areaShort.B11": "Exams (B 1.1)",
    "areaShort.B111": "Comp. electives", "areaShort.B112": "Elective areas", "areaShort.B12": "Seminars & labs", "areaShort.B2": "Studium Generale", "areaShort.C": "Thesis",

    "strategy.title": "Goal & strategy", "strategy.lede": "Which grades do you really need? And which plan reaches your goal with the least effort?",
    "opt.nothing": "No open graded modules – nothing to optimize.",
    "opt.safe": "Goal <b>{target}</b> is already safe – even a 4.0 everywhere ends at <b>{worst}</b>. Pick a more ambitious goal between <b>{best}</b> (best possible) and {worst}:",
    "opt.reached": "Goal <b>{target}</b> reached with <b>{res}</b>.", "opt.saving": "≈ {p} % less effort than a flat {flat} everywhere.",
    "opt.notReached": "Goal <b>{target}</b> is out of reach with your caps – best is <b>{res}</b>. Relax “best case” or plan extra electives.",
    "opt.apply": "Apply plan", "opt.asScenario": "Save as new scenario", "opt.applied": "Recommended grades applied", "opt.saved": "New scenario with the optimized plan created", "opt.scenName": "Optimized for {t}",
    "opt.plan": "Recommended grades", "opt.planSub": "Tell it how hard each module is for you – the optimizer spreads the effort.",
    "opt.diff": "Difficulty", "opt.floor": "Best case", "opt.current": "Planned", "opt.rec": "Recommended", "diff.1": "easy", "diff.2": "normal", "diff.3": "hard",
    "opt.how": "How is this computed?",
    "opt.method": "Each module costs CP × difficulty × (4 − grade)², so every step towards 1.0 costs more than the last. The optimizer always buys the grade step with the largest effect per effort, including § 25 (5) caps: modules that get capped out receive no effort.",
    "opt.over": "Take one more module?", "opt.overSub": "Since only the best CP count in elective areas, an extra good module can push out a weak grade (§ 25 (5)).",
    "opt.extraGrade": "Assumed grade:", "opt.overRow": "+{cp} CP <b>{area}</b> at {g} → final grade <b>{d}</b>, pushes out {loser}", "opt.overNone": "At {g}, an extra module doesn't help right now.",
    "opt.drop": "Deselect instead of retaking", "opt.dropSub": "Unfinished electives can be deselected (§ 30 (5)/(6)): retakes disappear, failed attempts don't count.",
    "opt.dropAtt": "{n} failed attempt(s).", "opt.dropWeak": "planned at only {g}.", "opt.drop5": "Still deselectable (once in this area).", "opt.drop6": "Unlimited deselection.", "opt.dropUsed": "Deselection in this area used.",
    "opt.dropNone": "No candidates – no failed attempts and no weak electives.", droppedByCap: "doesn't count (cap)",
    "scen.copy": "Copy", "scen.opt": "+ Optimistic", "scen.pess": "+ Pessimistic", "scen.optName": "Optimistic", "scen.pessName": "Pessimistic", "scen.copyName": "{name} (copy)",
    "scen.isActive": "active", "scen.activate": "Activate", "scen.rename": "Rename", "scen.need": "Required average", "scen.impossible": "out of reach", "scen.safe": "safe",
    "scen.cp": "Planned CP", "scen.diff": "Differences", "scen.diffSub": "{n} modules differ",
    "scen.noDiff": "The scenarios are identical (so far).", "scen.onlyOne": "Create a second scenario to compare plans – e.g. optimistic and pessimistic. Passed modules, failed attempts and dates apply to all scenarios.",
    "scen.renamePrompt": "New name:", "scen.delConfirm": "Delete scenario “{name}”?",

    "exams.title": "Exams", "exams.lede": "Dates, attempts and what you may deselect.",
    "exams.upcoming": "Upcoming exams", "exams.noneYet": "No dates yet – add them below and they show up here with a countdown.",
    "ed.none.title": "Official exam dates", "ed.none.text": "No schedule loaded yet. Pick TU's exam schedule Excel file (e.g. “Pruefungen_WiSe_…_Studierende.xlsx”) – the computer science exams are picked out automatically.",
    "ed.pick": "Choose Excel file", "ed.title": "Exam dates {term}", "ed.asOf": "as of {d}", "ed.count": "{n} computer science exams", "ed.repo": "shared list",
    "ed.ownFile": "from your file {f}", "ed.forget": "Remove file", "ed.disclaimer": "No guarantee – TUCaN and official notices are binding.",
    "ed.official": "official date", "ed.resetTo": "official date: {d}", "ed.clash": "Clashes with {other}", "ed.ics": "Add to calendar (.ics)",
    "ed.icsSummary": "Exam: {name}", "ed.all": "All computer science exams {term}", "ed.allSub": "{n} dates – helps when choosing electives",
    "ed.search": "Search module or number …", "ed.date": "Date", "ed.time": "Time", "ed.second": "Second date", "ed.inPlan": "in your plan",
    "ed.noneMine": "No dates in the schedule yet for your modules planned in {term}.", "ed.loaded": "{n} computer science exams ({term}) loaded",
    "ed.badFile": "This doesn't look like the exam schedule.", "ed.unsupported": "Your browser can't read .xlsx – please use a current Chrome, Firefox or Safari.",
    "ed.chipTitle": "Exam date according to the {term} schedule",
    "exams.all": "Open exams", "exams.allSub": "Every exam has 3 attempts (§ 30, § 31)",
    "oral.title": "Oral supplementary exam (§ 32)", "oral.text": "Once per degree: after failing the second retake of a written exam, apply within 4 weeks. Passing = 4.0.",
    "oral.used": "already used", "oral.free": "still available", "oral.which": "Which module?",
    "abwahl.title": "Deselection budget (§ 30)", "abwahl.text": "Compulsory electives and each elective focus area: deselect one unfinished module once each. Seminars/labs and Studium Generale: unlimited.",
    "rule.pflicht": "compulsory – must be passed", "rule.six": "unlimited deselection", "rule.five": "deselectable once", "rule.fiveUsed": "deselection used",
    "dropped.title": "Deselected modules",
    "drop.no.notopen": "Only unfinished modules can be deselected.", "drop.no.pflicht": "Compulsory modules and the thesis cannot be deselected.", "drop.no.used": "The one-time deselection in this area is already used.",
    "drop.confirm5": "Deselect “{name}”? This uses the one-time deselection in this area (§ 30 (5)). The application goes through the Studienbüro.", "drop.confirm6": "Deselect “{name}”? Unlimited in this area (§ 30 (6)).",
    "drop.done": "“{name}” deselected",

    "import.title": "Import & backup", "import.lede": "Read your Leistungsspiegel from TUCaN, back up your data or move it to another device.",
    "imp.tucan": "Leistungsspiegel from TUCaN", "imp.steps": "<li>TUCaN → <i>Prüfungen</i> → <i>Leistungsspiegel</i></li><li>Click <i>Drucken</i> and save as PDF</li><li>Drop the PDF here</li>",
    "imp.dropTitle": "Drop your Leistungsspiegel PDF here or click", "imp.dropSub": "from TUCaN's print button – read only inside your browser",
    "imp.pasteTitle": "Or: paste text from TUCaN", "imp.pastePh": "Select the Leistungsspiegel page (Ctrl+A), copy and paste it here …", "imp.parse": "Parse text",
    "imp.privacy": "The file is only read inside this browser. Nothing is uploaded.",
    "imp.reading": "Reading PDF …", "imp.error": "Could not read the PDF: {e}", "imp.noTable": "No Leistungsspiegel table found (columns “Credits” and “Note” missing).",
    "imp.nothing": "No modules recognized.", "imp.noArea": "“{name}” appears before any area heading – skipped.", "imp.failed": "“{name}”: failed – imported as open with 1 failed attempt.",
    "imp.preview": "Preview – please check", "imp.found": "{n} modules found – {done} passed, {open} open",
    "imp.match": "Action", "imp.update": "update", "imp.new": "new", "imp.failedShort": "failed", "imp.inProgress": "open",
    "imp.optAll": "Apply to all scenarios", "imp.optPh": "Remove placeholders", "imp.apply": "Apply", "imp.done": "Import: {updated} updated, {added} new, {removed} placeholders removed",
    "backup.title": "Backup", "backup.text": "Your data only lives in this browser. Export a backup regularly – that's also how you move to another device. Files from Yacine's GPA Planner can be imported too.",
    "backup.export": "Export backup", "backup.import": "Import backup", "backup.done": "Backup saved", "backup.last": "Last backup: {d}",
    "backup.loaded": "Backup loaded", "backup.invalid": "Not a valid backup file.",
    "remind.text": "Your last backup is {d} days old and you've changed things since.", "remind.never": "You've never made a backup – if you clear your browser data, your plan is gone.", "remind.later": "Later",
    "del.btn": "Delete all data", "del.title": "Delete all data in this browser?", "del.text": "Scenarios, grades, dates and settings are removed from this browser. This cannot be undone.",
    "del.note": "Tip: export a backup first if you might want the plan back later.", "del.exportFirst": "Export backup first", "del.confirm": "Delete permanently", "del.done": "All data deleted",
    "rules.title": "Rules & background", "rules.lede": "How the grade is computed – straight from the APB and the Studien- und Prüfungsplan.",
    "privacy.title": "Privacy", "privacy.storage": "Storage in this browser", "privacy.checking": "Checking …",
    "privacy.local": "Your data lives in this browser's localStorage.", "privacy.persisted": "The browser granted persistent storage – it won't clear it on its own.", "privacy.notPersisted": "The browser may clear it when disk space runs low – export a backup regularly.",
  };

  const SRC = `<ul>
    <li><a href="https://www.intern.tu-darmstadt.de/media/dezernat_ii/ordnungen/apb.pdf">APB, Satzungsbeilage 2023-VII</a></li>
    <li><a href="https://www.informatik.tu-darmstadt.de/media/informatik/fb20_studium/formulare_und_dokumente/ordnungen/ordnungen_bsc/pruefungsordnung_2023/Studiengangsordnung_Bachelor_Informatik_2023.pdf">Ordnung des Studiengangs B.Sc. Informatik 2023</a></li>
    <li><a href="https://www.informatik.tu-darmstadt.de/media/informatik/fb20_studium/formulare_und_dokumente/ordnungen/ordnungen_bsc/pruefungsordnung_2023/SPP_B.Sc._Informatik.pdf">Studien- und Prüfungsplan (Anhang I)</a></li>
    <li><a href="https://www.informatik.tu-darmstadt.de/media/informatik/fb20_studium/formulare_und_dokumente/ordnungen/ordnungen_bsc/pruefungsordnung_2023/2022_09_30_MHB_BSC_INF.pdf">Modulhandbuch PO 2023</a></li>
    <li><a href="https://www.tu-darmstadt.de/studieren/studierende_tu/studienorganisation_und_tucan/hilfe_und_faq/artikel_details_de_en_32704.de.jsp">TUCaN-FAQ: GPA ist eine Schätzung</a></li></ul>`;
  const FORMULA = `<div class="formula">Gesamtnote = Σ (CP<sub>i</sub> × Note<sub>i</sub>) / Σ CP<sub>i</sub>   →   2 Nachkommastellen, abschneiden</div>`;
  const CAPS = (h) => `<table class="tbl compact"><thead><tr><th>${h[0]}</th><th class="num">${h[1]}</th><th class="num">${h[2]}</th></tr></thead><tbody>
    <tr><td>A ${h[3]}</td><td class="num">114</td><td class="num">${h[10]}</td></tr><tr><td>B 1.1.1 ${h[4]}</td><td class="num">10–35</td><td class="num">35</td></tr>
    <tr><td>B 1.1.2 ${h[5]}</td><td class="num">5–30</td><td class="num">30</td></tr><tr><td>B 1.1 ${h[6]}</td><td class="num">30–40</td><td class="num">40</td></tr>
    <tr><td>B 1.2 ${h[7]}</td><td class="num">9–18</td><td class="num">18</td></tr><tr><td>B 1 Informatik</td><td class="num">48–49</td><td class="num">49</td></tr>
    <tr><td>B 2 ${h[8]}</td><td class="num">5–6</td><td class="num">6</td></tr><tr><td>C ${h[9]}</td><td class="num">12</td><td class="num">${h[10]}</td></tr></tbody></table>`;

  const RULES = {
    de: `
    <section><h2>Die Formel</h2><p><b>§ 28 APB</b> und Studiengangsordnung (<i>zu § 28 (2)</i>): Modulnoten gehen <q>entsprechend der in den Modulen erworbenen Leistungspunkte</q> in die Gesamtnote ein. Anhang I lässt <i>Gewichtung f. Gesamtnote</i> überall leer – <b>jedes Modul zählt mit seinen CP, auch die Bachelorarbeit. Kein Bonusfaktor.</b></p>${FORMULA}
      <ul><li><b>§ 25 (1)</b> – unbenotete Module zählen nicht (z. B. „Erfolgreich ins Informatik-Studium starten“).</li><li><b>§ 25 (5)</b> – in Wahlbereichen zählen die besten Noten bis zur CP-Grenze, der Rest fällt weg – auch anteilig.</li><li><b>§ 28 (2)</b> – zwei Nachkommastellen, abgeschnitten, nicht gerundet.</li><li><b>§ 28 (3)</b> – 1,0–1,59 sehr gut · 1,6–2,59 gut · 2,6–3,59 befriedigend · 3,6–4,09 ausreichend.</li></ul></section>
    <section><h2>Kappungsgrenzen</h2><p>Auf jedem Leistungsspiegel steht <q>Die Ergebnisse von maximal X Credits gehen in die Notenberechnung ein</q>. Die App wendet das von unten nach oben an:</p>${CAPS(["Bereich", "Gefordert (CP)", "Zählt max. (CP)", "Pflichtbereich", "Wahlpflichtbereich", "Wahlbereiche Informatik", "Fachprüfungen", "Studienbegleitende Leistungen", "Studium Generale", "Bachelorarbeit", "alles"])}
      <p>Weil die besten Noten zählen, kann ein zusätzliches gutes Wahlmodul eine schwache Wahlnote verdrängen – siehe <i>Ziel &amp; Strategie</i>.</p></section>
    <section><h2>Studienbegleitende Leistungen</h2><p>Mindestens <b>ein Seminar</b> (3–12 CP), mindestens <b>ein Praktikum / Projektpraktikum</b> (6–15 CP), höchstens <b>ein Praktikum in der Lehre</b> (max. 5 CP), höchstens <b>eine Studienarbeit</b> (max. 9 CP).</p></section>
    <section><h2>Schadet eine 5,0? – Nein.</h2><p>Die Modulnote kommt aus dem bestandenen Versuch (§ 25 (3)). Eine 5,0 kostet <b>Versuche</b> (zwei Wiederholungen, danach einmal im Studium die mündliche Ergänzungsprüfung, § 32) und <b>Zeit</b> – sonst nichts.</p>
      <p><b>Gefährlich ist die Gegenregel:</b> <q>Bestandene Prüfungen können nicht wiederholt werden</q> (§ 30 (1)). Notenverbesserung (§ 30 Abs. 1a) gibt es nur für im Studienplan mit <i>x</i> markierte Prüfungen – die PO 2023 markiert keine. Jede Note ist endgültig.</p></section>
    <section><h2>Abwählen (§ 30 Abs. 3–6)</h2><ul><li>Pflichtmodule müssen bestanden werden.</li><li><b>§ 30 Abs. 5</b> – Wahlpflichtbereich und <b>jeder Schwerpunkt</b> der Wahlbereiche (KI, Cybersicherheit, Komplexe vernetzte Systeme, Software &amp; Hardware, Theorie): einmal ein nicht abgeschlossenes Modul abwählen.</li><li><b>§ 30 Abs. 6</b> – Studienbegleitende Leistungen und Studium Generale: beliebig oft.</li></ul><p>Abgewählt heißt: Wiederholungen entfallen, Fehlversuche zählen nicht, das Modul erscheint nicht im Zeugnis.</p></section>
    <section><h2>Urlaubs- und Auslandssemester</h2><p>Ein Urlaubssemester zählt nicht als Fachsemester – der Plan nummeriert die Fachsemester deshalb ohne es weiter. Leistungen aus dem Ausland werden per Anerkennung in einen Bereich eingebracht; über Bereich und Notenumrechnung entscheidet das Studienbüro.</p></section>
    <section><h2>Warum TUCaNs GPA anders aussieht</h2><p>Der <i>Gesamt-GPA</i> ist eine Prognose: <q>TUCaN errechnet den vorläufigen GPA von offenen Modulen und Prüfungsordnungsbereichen über Schätzungen</q>. Außerdem zeigt TUCaN drei Nachkommastellen, § 28 (2) kürzt auf zwei. Plane gegen die Note nach Prüfungsordnung – sie steht im Zeugnis.</p></section>
    <section><h2>Quellen</h2>${SRC}<p class="fine">Basiert auf <i>GPA Planner – B.Sc. Informatik (PO 2023)</i> von Yacine. Inoffiziell, nicht mit der TU Darmstadt verbunden. Verbindlich ist allein die Prüfungsordnung – wenn eine Zahl wichtig ist, frag das Studienbüro.</p></section>`,
    en: `
    <section><h2>The formula</h2><p><b>APB § 28</b> and the Studiengangsordnung (<i>zu § 28 (2)</i>): module grades enter the final grade <q>entsprechend der in den Modulen erworbenen Leistungspunkte</q>. Anhang I leaves <i>Gewichtung f. Gesamtnote</i> empty everywhere – <b>every module counts by its CP, the thesis included. No bonus factor.</b></p>${FORMULA}
      <ul><li><b>§ 25 (1)</b> – pass/fail modules don't count.</li><li><b>§ 25 (5)</b> – in elective areas the best grades count up to the CP cap; the rest is dropped, partial CP included.</li><li><b>§ 28 (2)</b> – two decimals, truncated, not rounded.</li><li><b>§ 28 (3)</b> – 1.0–1.59 very good · 1.6–2.59 good · 2.6–3.59 satisfactory · 3.6–4.09 sufficient.</li></ul></section>
    <section><h2>Caps</h2><p>Every Leistungsspiegel prints <q>Die Ergebnisse von maximal X Credits gehen in die Notenberechnung ein</q>. The app applies them bottom-up:</p>${CAPS(["Area", "Required (CP)", "Counts max (CP)", "Compulsory", "Compulsory electives", "CS elective areas", "Exams", "Seminars & labs", "Studium Generale", "Bachelor thesis", "all"])}
      <p>Because the best grades count, an extra good elective can push out a weak elective grade – see <i>Goal &amp; strategy</i>.</p></section>
    <section><h2>Seminars &amp; labs</h2><p>At least <b>one seminar</b> (3–12 CP), at least <b>one lab / project lab</b> (6–15 CP), at most <b>one teaching practicum</b> (max 5 CP), at most <b>one Studienarbeit</b> (max 9 CP).</p></section>
    <section><h2>Does a 5.0 hurt? – No.</h2><p>The module grade comes from the attempt you pass (§ 25 (3)). A 5.0 costs <b>attempts</b> (two retakes, then once per degree the oral supplementary exam, § 32) and <b>time</b> – nothing else.</p>
      <p><b>The opposite rule is the dangerous one:</b> <q>Bestandene Prüfungen können nicht wiederholt werden</q> (§ 30 (1)). Grade improvement (§ 30 (1a)) only exists for exams marked <i>x</i> in the study plan – the PO 2023 marks none. Every grade is final.</p></section>
    <section><h2>Deselection (§ 30 (3)–(6))</h2><ul><li>Compulsory modules must be passed.</li><li><b>§ 30 (5)</b> – compulsory electives and <b>each focus area</b> of the elective areas (AI, Cybersecurity, Complex Networked Systems, Software &amp; Hardware, Theory): deselect one unfinished module once.</li><li><b>§ 30 (6)</b> – seminars/labs and Studium Generale: unlimited.</li></ul><p>Deselected means: retakes disappear, failed attempts don't count, the module never appears on the transcript.</p></section>
    <section><h2>Leave and abroad semesters</h2><p>A leave semester (Urlaubssemester) doesn't count as a semester of study – the plan keeps numbering without it. Courses taken abroad are brought into an area via recognition; the Studienbüro decides the area and the grade conversion.</p></section>
    <section><h2>Why TUCaN's GPA looks different</h2><p>The <i>Gesamt-GPA</i> is a forecast: <q>TUCaN errechnet den vorläufigen GPA von offenen Modulen und Prüfungsordnungsbereichen über Schätzungen</q>. TUCaN also prints three decimals where § 28 (2) truncates to two. Plan against the regulation's grade – that's the one on your Zeugnis.</p></section>
    <section><h2>Sources</h2>${SRC}<p class="fine">Based on <i>GPA Planner – B.Sc. Informatik (PO 2023)</i> by Yacine. Unofficial, not affiliated with TU Darmstadt. Only the Prüfungsordnung is binding – if a number matters, ask the Studienbüro.</p></section>`,
  };

  const PRIVACY = {
    de: `<section><h2>Deine Daten bleiben bei dir</h2><p>Der Notenplaner speichert alles – Noten, Pläne, Termine – ausschließlich im Speicher deines Browsers (localStorage). Es gibt keinen Server, kein Konto, kein Tracking und keine Analyse. Ein importierter Leistungsspiegel wird nur in deinem Browser gelesen und nicht hochgeladen.</p>
      <p>Die Seite wird über <b>GitHub Pages</b> ausgeliefert. Beim Abruf verarbeitet GitHub technisch notwendige Daten wie deine IP-Adresse; Details stehen in der <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement">Datenschutzerklärung von GitHub</a>. Die App selbst lädt keine Inhalte von Drittanbietern nach.</p>
      <p>Daten löschen: über <b>⚙ → Alle Daten löschen</b> oder indem du die Websitedaten im Browser entfernst. Vorher kannst du ein Backup exportieren.</p></section>`,
    en: `<section><h2>Your data stays with you</h2><p>The Grade Planner stores everything – grades, plans, dates – only in your browser's storage (localStorage). There is no server, no account, no tracking and no analytics. An imported Leistungsspiegel is only read inside your browser and never uploaded.</p>
      <p>The page is served by <b>GitHub Pages</b>. When you load it, GitHub processes technically necessary data such as your IP address; see the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub Privacy Statement</a>. The app itself loads no third-party content.</p>
      <p>Deleting your data: <b>⚙ → Delete all data</b>, or clear the site data in your browser. You can export a backup first.</p></section>`,
  };

  const D = { de, en };
  function t(lang, key, vars) {
    let s = (D[lang] && D[lang][key]) ?? D.de[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
    return s;
  }
  return { t, rules: (lang) => RULES[lang] || RULES.de, privacy: (lang) => PRIVACY[lang] || PRIVACY.de, dict: D };
})();
window.I18N = I18N;
