# GPA Planner — B.Sc. Informatik (PO 2023), TU Darmstadt

A single-file, offline grade planner that computes your **Gesamtnote the way the Prüfungsordnung
defines it** — not the way TUCaN's live GPA field estimates it — and tells you what you still need to
score to hit a target.

## Run it

No build, no server, no dependencies, no network calls. Pick one:

**Download** — green *Code* button → *Download ZIP* → unzip → double-click `gpa.html`. No git needed.

**Clone** — if you want `git pull` to get later fixes:

```bash
git clone https://github.com/Yacine-DH/GPA-Planner-B.Sc.-Informatik-2023-TU-Darmstadt.git
```

Then open `gpa.html` in any browser. Fully offline; edits are saved in that browser's `localStorage`,
so use *Export JSON backup* before clearing browser data.

## Why this exists

The *Gesamt-GPA* on your Leistungsspiegel is a forecast: TUCaN fills open modules and areas with
estimates that *"besser oder schlechter als der tatsächliche Wert ausfallen"* können
([FAQ](https://www.tu-darmstadt.de/studieren/studierende_tu/studienorganisation_und_tucan/hilfe_und_faq/artikel_details_de_en_32704.de.jsp)),
and prints three decimals where § 28 (2) truncates to two. Mid-degree the two numbers can differ by
several hundredths — which matters when you plan against a master's threshold. This app implements the
regulation instead.

## The formula

```
Gesamtnote = Σ (CP_i × Note_i) / Σ CP_i     →  keep 2 decimals, truncate, no rounding
```

| Rule | Source |
|---|---|
| Weight = CP earned; no module carries a bonus factor, including the 12 CP thesis | Studiengangsordnung *zu § 28 (2)* — and Anhang I leaves *Gewichtung f. Gesamtnote* empty for every module |
| `bestanden / nicht bestanden` modules excluded | APB § 25 (1) |
| In elective areas grades count **best first** up to the area's cap; the excess is dropped, partial CP included | APB § 25 (5) |
| Truncate to 2 decimals, no rounding | APB § 28 (2) |
| 1,0–1,59 sehr gut · 1,6–2,59 gut · 2,6–3,59 befriedigend · 3,6–4,09 ausreichend | APB § 28 (3) |

Caps, printed on every Leistungsspiegel as *"Die Ergebnisse von maximal X Credits gehen in die
Notenberechnung ein"*, applied bottom-up:

| Area | Required | Counts |
|---|---|---|
| A — Pflichtbereich | 114 CP | all (113 graded) |
| B 1.1.1 — Wahlpflichtbereich | 10–35 CP | max 35 |
| B 1.1.2 — Informatik-Wahlbereiche | 5–30 CP | max 30 |
| B 1.1 — Fachprüfungen | 30–40 CP | max 40 |
| B 1.2 — Studienbegleitende Leistungen | 9–18 CP | max 18 |
| B 1 — Informatik | 48–49 CP | max 49 |
| B 2 — Studium Generale | 5–6 CP | max 6 |
| C — Bachelorarbeit | 12 CP | all |

Because caps take the **best** grades, deliberately over-shooting an elective area is a legal way to
delete a bad elective grade.

## Does a 5,0 hurt the GPA?

**No.** The module grade comes from the attempt you pass (§ 25 (3)); an unpassed module has no grade at
all and shows as *unvollständig*. A 5,0 costs attempts — two retries, then one *mündliche
Ergänzungsprüfung* per degree (§ 30–32) — and time. Nothing else.

**The opposite rule hurts.** § 30 (1): *"Bestandene Prüfungen können nicht wiederholt werden."*
Voluntary retakes to improve a passed grade (§ 30 Abs. 1a) exist only for exams marked `x` in the
Studien- und Prüfungsplan, and **the PO 2023 plan marks none** — every grade you have is permanent.

Escape hatch: elective areas are *Typ § 30 Abs. 5* (one deselection) or *Abs. 6* (unlimited). An
elective you have **not yet completed** can be abgewählt — retakes disappear, failed attempts are not
counted, it never reaches the Zeugnis. Pflichtmodule cannot (§ 30 (3)).

## Using it

1. Set each module's status — `✓ passed` / `◻ planned` / `✕ not taking` — and its grade. On planned
   modules the grade is your **goal**, not a prediction.
2. Add or remove elective rows until the *Degree structure check* is green and totals 180 CP.
3. Set your goal GPA. The app gives you the average you need across everything still open, and can fill
   every open module with the grade that gets you there.
4. The **leverage** column shows what each module moves the final grade by. Big-CP modules move it most.

## Keeping your grades out of git

`gpa.html` ships with a blank plan. To preload your transcript, copy `my-grades.example.js` to
`my-grades.js` and fill it in — the app loads it if present. That file, `private/`, and any
`Leistungsspiegel*.pdf` are in `.gitignore`, so personal data never enters a commit. Check
`git status` before pushing.

```
gpa.html                the app — public data only
my-grades.example.js    template for your own transcript
my-grades.js            your transcript          (gitignored)
private/                your Leistungsspiegel    (gitignored)
docs/                   the official TU Darmstadt documents this is built from
```

## Sources

- [APB, Satzungsbeilage 2023-VII](https://www.intern.tu-darmstadt.de/media/dezernat_ii/ordnungen/apb.pdf)
- [Ordnung des Studiengangs B.Sc. Informatik 2023](https://www.informatik.tu-darmstadt.de/media/informatik/fb20_studium/formulare_und_dokumente/ordnungen/ordnungen_bsc/pruefungsordnung_2023/Studiengangsordnung_Bachelor_Informatik_2023.pdf)
- [Studien- und Prüfungsplan (Anhang I)](https://www.informatik.tu-darmstadt.de/media/informatik/fb20_studium/formulare_und_dokumente/ordnungen/ordnungen_bsc/pruefungsordnung_2023/SPP_B.Sc._Informatik.pdf)
- [Modulhandbuch PO 2023](https://www.informatik.tu-darmstadt.de/media/informatik/fb20_studium/formulare_und_dokumente/ordnungen/ordnungen_bsc/pruefungsordnung_2023/2022_09_30_MHB_BSC_INF.pdf)
- [TUCaN FAQ — the GPA field is an estimate](https://www.tu-darmstadt.de/studieren/studierende_tu/studienorganisation_und_tucan/hilfe_und_faq/artikel_details_de_en_32704.de.jsp)

Copies live in `docs/` for offline reference; the linked originals are authoritative.

## Disclaimer

Unofficial, not affiliated with TU Darmstadt. The Prüfungsordnung is the only binding source. If a
number here matters to a decision, check it with your Studienbüro.
