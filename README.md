# GPA Planner — B.Sc. Informatik (PO 2023), TU Darmstadt

A single-file, offline grade planner that computes your **Gesamtnote exactly the way the
Prüfungsordnung defines it** — not the way TUCaN's live GPA field estimates it — and tells you what
you need to score in the modules you have left to hit a target.

Open `gpa.html` in any browser. No build, no server, no dependencies, no network calls.

## Why this exists

TUCaN prints a *Gesamt-GPA* at the bottom of the Leistungsspiegel, but that number is explicitly a
forecast: TU Darmstadt states that
*"TUCaN errechnet den vorläufigen GPA von offenen Modulen und Prüfungsordnungsbereichen über Schätzungen"*
and that it *"besser oder schlechter als der tatsächliche Wert ausfallen kann"*
([FAQ](https://www.tu-darmstadt.de/studieren/studierende_tu/studienorganisation_und_tucan/hilfe_und_faq/artikel_details_de_en_32704.de.jsp)).
It also prints three decimals where § 28 (2) APB truncates to two. Mid-degree the two numbers can differ
by several hundredths — which matters when you are planning against a master's application threshold.

This app implements the regulation itself.

## The formula

```
Gesamtnote = Σ (CP_i × Note_i) / Σ CP_i     →  keep 2 decimals, truncate, no rounding
```

Rules implemented, with their source:

| Rule | Source |
|---|---|
| Weight = CP earned in the module; no module carries a bonus factor, including the 12 CP thesis | Studiengangsordnung, *zu § 28 (2)*: *"Soweit in Anhang I nicht anders festgelegt, gehen die Modulnoten entsprechend der in den Modulen erworbenen Leistungspunkte in die Gesamtnote ein."* — and Anhang I leaves the column *Gewichtung f. Gesamtnote* empty for every module |
| `bestanden / nicht bestanden` modules are excluded | APB § 25 (1) |
| In elective areas, grades count **best first** up to the area's CP cap; the excess portion is dropped, partial CP included | APB § 25 (5) |
| Truncate the result to 2 decimals, no rounding | APB § 28 (2) |
| Grade bands: 1,0–1,59 sehr gut · 1,6–2,59 gut · 2,6–3,59 befriedigend · 3,6–4,09 ausreichend | APB § 28 (3) |

Area caps (printed on every Leistungsspiegel as *"Die Ergebnisse von maximal X Credits gehen in die
Notenberechnung ein"*), applied bottom-up:

| Area | Required | Counts for the grade |
|---|---|---|
| A — Pflichtbereich | 114 CP | all of it (113 CP graded) |
| B 1.1.1 — Wahlpflichtbereich | 10–35 CP | max 35 CP |
| B 1.1.2 — Informatik-Wahlbereiche | 5–30 CP | max 30 CP |
| B 1.1 — Fachprüfungen (both above) | 30–40 CP | max 40 CP |
| B 1.2 — Studienbegleitende Leistungen | 9–18 CP | max 18 CP |
| B 1 — Informatik | 48–49 CP | max 49 CP |
| B 2 — Studium Generale | 5–6 CP | max 6 CP |
| C — Bachelorarbeit | 12 CP | all of it |

A consequence worth knowing: because caps take the **best** grades, deliberately over-shooting an
elective area is a legal way to delete a bad elective grade.

## Does a 5,0 hurt the GPA?

**No.** A failed exam never enters the Gesamtnote. The module grade comes from the attempt you pass
(§ 25 (3)); the Gesamtnote is built from module grades (§ 28 (1)). An unpassed module has no grade at
all — it shows as *unvollständig*. A 5,0 costs attempts (two retries, then one *mündliche
Ergänzungsprüfung* per degree, § 30–32) and time. Nothing else.

**The rule that does hurt is the opposite one.** § 30 (1): *"Bestandene Prüfungen können nicht
wiederholt werden."* A voluntary retake to improve a passed grade (§ 30 Abs. 1a) exists only for exams
marked with an `x` in the Studien- und Prüfungsplan — **and the B.Sc. Informatik 2023 plan marks none.**
Every grade you already have is permanent.

Escape hatch: elective areas are marked *Typ § 30 Abs. 5* (one deselection) or *Typ § 30 Abs. 6*
(unlimited). A module there that you have **not yet completed** can be abgewählt on request — required
retakes disappear, failed attempts are not counted, and it never appears on the Zeugnis. Pflichtmodule
cannot be dropped (§ 30 (3)).

## Using it

1. Open `gpa.html`.
2. Set each module's status — `✓ passed` / `◻ planned` / `✕ not taking` — and its grade. For planned
   modules the grade is your **goal**, not a prediction.
3. Add or remove elective rows so the *Degree structure check* is green everywhere and totals 180 CP.
4. Set your goal GPA. The app tells you the CP-weighted average you need across everything still open,
   and can fill every open module with the grade that gets you there.
5. The **leverage** column shows what each module moves the final grade by — per 0,3 step, and if you
   ace it to 1,0. Big-CP modules are where the movement is.

Your edits are stored in the browser's `localStorage`. Nothing is uploaded. Use *Export JSON backup*
before clearing browser data.

### Keeping your grades out of git

`gpa.html` ships with a blank plan. To preload your own transcript, copy
`my-grades.example.js` to `my-grades.js` and fill it in — `gpa.html` loads that file if it is present.
`my-grades.js`, `private/`, and any `Leistungsspiegel*.pdf` are in `.gitignore`, so **personal data
never enters a commit**. Check with `git status` before you push.

## Layout

```
gpa.html                  the app — public data only
my-grades.example.js      template for your own transcript
my-grades.js              your transcript          (gitignored)
private/                  your Leistungsspiegel    (gitignored)
docs/                     the official TU Darmstadt documents this is built from
```

## Sources

- [Allgemeine Prüfungsbestimmungen (APB), Satzungsbeilage 2023-VII](https://www.intern.tu-darmstadt.de/media/dezernat_ii/ordnungen/apb.pdf)
- [Ordnung des Studiengangs B.Sc. Informatik 2023 (Satzungsbeilage 2023-II)](https://www.informatik.tu-darmstadt.de/media/informatik/fb20_studium/formulare_und_dokumente/ordnungen/ordnungen_bsc/pruefungsordnung_2023/Studiengangsordnung_Bachelor_Informatik_2023.pdf)
- [Studien- und Prüfungsplan B.Sc. Informatik (Anhang I)](https://www.informatik.tu-darmstadt.de/media/informatik/fb20_studium/formulare_und_dokumente/ordnungen/ordnungen_bsc/pruefungsordnung_2023/SPP_B.Sc._Informatik.pdf)
- [Modulhandbuch B.Sc. Informatik PO 2023](https://www.informatik.tu-darmstadt.de/media/informatik/fb20_studium/formulare_und_dokumente/ordnungen/ordnungen_bsc/pruefungsordnung_2023/2022_09_30_MHB_BSC_INF.pdf)
- [TUCaN FAQ — the GPA field is an estimate](https://www.tu-darmstadt.de/studieren/studierende_tu/studienorganisation_und_tucan/hilfe_und_faq/artikel_details_de_en_32704.de.jsp)

Copies of these documents are in `docs/` for offline reference. They are public TU Darmstadt statutes;
the linked originals are authoritative.

## Disclaimer

Unofficial tool, not affiliated with TU Darmstadt. The Prüfungsordnung is the only binding source. If
a number here matters to a decision, check it against your Studienbüro.
