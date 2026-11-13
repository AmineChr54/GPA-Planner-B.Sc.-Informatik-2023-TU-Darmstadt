"""Turn TUCaN "Notenspiegel" screenshots into js/gradestats.js.

    python tools/notenspiegel/extract.py <folder-or-images...> [--out js/gradestats.js]
                                         [--tesseract "C:/Program Files/Tesseract-OCR/tesseract.exe"]

Every screenshot has the same layout (module code + name + term, exam date,
"Noten 1,0 … 5,0", "Anzahl …", Durchschnitt, Vorliegende Ergebnisse, Fehlend …).
The tool OCRs each image with Tesseract (called directly), parses those lines and
checks itself. With Pillow installed it also retries small screenshots upscaled and
reads garbled tables cell by cell (see read_cells):

    * the 11 counts must add up to "Vorliegende Ergebnisse"
    * the average recomputed from the counts must match "Durchschnitt" (±0.001)

Only images that pass both checks go into the data file. Everything else is
listed in review.csv (next to --out) with the reason, so it can be fixed by hand.
Entries are merged into the existing file and de-duplicated by module + term +
distribution, so the tool can be re-run on new batches (see merge / drop_old_versions).
channels.csv and manual.json next to this file cover crops without a title and
screenshots read by hand. Only the numbers (and the posting date) are stored: no
file names, usernames or message text.
"""
import argparse, csv, json, os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

GRADES = [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0, 5.0]
IMAGE_EXT = (".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff")
MONTHS = {"jan": 1, "feb": 2, "mar": 3, "mär": 3, "mrz": 3, "apr": 4, "mai": 5, "may": 5, "jun": 6, "jul": 7,
          "aug": 8, "sep": 9, "okt": 10, "oct": 10, "nov": 11, "dez": 12, "dec": 12}
PREFIX = "window.GRADE_STATS = "


def find_tesseract(explicit):
    for c in [explicit, shutil.which("tesseract"), r"C:\Program Files\Tesseract-OCR\tesseract.exe",
              r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe", "/usr/bin/tesseract", "/opt/homebrew/bin/tesseract"]:
        if c and os.path.isfile(c):
            return c
    sys.exit("Tesseract not found. Install it (Windows: winget install UB-Mannheim.TesseractOCR) or pass --tesseract.")


def ocr(tess, path, scale=1):
    """scale > 1 upscales a grayscale copy first (needs Pillow); small screenshots OCR much better."""
    tmp = None
    if scale > 1:
        try:
            from PIL import Image
        except ImportError:
            return ""
        im = load_gray(path)
        im = im.resize((im.width * scale, im.height * scale), Image.LANCZOS)
        fd, tmp = tempfile.mkstemp(suffix=".png")
        os.close(fd)
        im.save(tmp)
        path = tmp
    try:
        r = subprocess.run([tess, path, "-", "--psm", "6"], capture_output=True)
        return r.stdout.decode("utf-8", "replace")
    finally:
        if tmp:
            os.remove(tmp)


def load_gray(path):
    """grayscale, dark text on light background (dark-mode screenshots get inverted)"""
    from PIL import Image, ImageOps, ImageStat
    im = Image.open(path).convert("L")
    return ImageOps.invert(im) if ImageStat.Stat(im).mean[0] < 110 else im


def num(s):
    return float(s.replace(",", "."))


def exam_date(joined):
    m = re.search(r"(\d{1,2})\.\s*([A-Za-zäÄ]{3})[a-zäÄ]*\.?\s*(\d{4})", joined)
    if m and m.group(2).lower()[:3] in MONTHS:
        return "%s-%02d-%02d" % (m.group(3), MONTHS[m.group(2).lower()[:3]], int(m.group(1)))
    return None


def header(joined):
    """module code, name, term and exam date, or None"""
    # codes: 20-00-0018-iv, 04-10-0120/de, 18-su-2020, 20-AM-4000; long names wrap onto a second line
    head = re.search(r"(\d\d-[0-9A-Za-z]{2}-[0-9A-Za-z]{4})(?:-[a-z]{1,3}|/[a-z]{1,3})?\s+(.{3,200}?),\s*((?:SoSe|WiSe)\s*\d{4}(?:/\d{2,4})?)", joined, re.S)
    if not head:
        return None
    if re.search(r"(Modul\w*|offering)\W*$", joined[max(0, head.start() - 25):head.start()], re.I):
        # only the "Modulangebot <code> <name>, <term>" context line is visible (cropped below the
        # title): its term is when the module offering started, not the exam - use the exam date
        date = exam_date(joined)
        if not date:
            return None
        return {"code": head.group(1), "name": re.sub(r"\s+", " ", head.group(2)).strip(),
                "term": term_from_date(date), "date": date, "termFromDate": True}
    return {"code": head.group(1), "name": re.sub(r"\s+", " ", head.group(2)).strip(),
            "term": re.sub(r"\s+", " ", head.group(3)), "date": exam_date(joined)}


# ---- screenshots cropped below the title: module from the Discord channel, term from the date ----

def term_from_date(date):
    """exams sit at the end of their semester: Oct-Apr -> WiSe, May-Sep -> SoSe"""
    y, m = int(date[:4]), int(date[5:7])
    if m >= 10:
        return "WiSe %d/%02d" % (y, (y + 1) % 100)
    if m <= 4:
        return "WiSe %d/%02d" % (y - 1, y % 100)
    return "SoSe %d" % y


def channel_of(path):
    """'_css_tud_geekhub_1234.png' (browser list) or 'css_1234_0.png' (bot) -> 'css'"""
    ch = re.sub(r"_\d+(_\d+)?\.\w+$", "", os.path.basename(path)).lstrip("_")
    return re.sub(r"_(tud_geekhub|TU(_\w*)?|T)$", "", ch)


def load_channels(path):
    """channels.csv -> {channel: [(since, code, name), ...] sorted by since}"""
    out = {}
    if path and os.path.isfile(path):
        rows = [l for l in open(path, encoding="utf-8").read().splitlines() if l and not l.startswith("#")]
        for r in csv.DictReader(rows, delimiter=";"):
            out.setdefault(r["channel"], []).append((r.get("since") or "", r["code"], r["name"]))
    for v in out.values():
        v.sort()
    return out


def posted_date(path):
    """date the image was posted, from the Discord id in the file name (snowflake), or None"""
    import datetime
    m = re.search(r"_(\d{17,20})(?:_\d+)?\.\w+$", os.path.basename(path))
    if not m:
        return None
    ms = (int(m.group(1)) >> 22) + 1420070400000
    return datetime.datetime.fromtimestamp(ms / 1000, datetime.timezone.utc).date()


def channel_header(path, joined, channels):
    """header for a crop without title: module from the channel; term from the exam date, or,
    when even the date is cropped away, from the posting date (results come out a few weeks
    after the exam, so 30 days are taken off before applying the semester rule)"""
    import datetime
    ch = channel_of(path)
    keys = [k for k in channels if ch == k or ch.startswith(k) or k.startswith(ch)]
    if not keys:
        return None
    date = exam_date(joined)
    when = date
    if not date:
        posted = posted_date(path)
        if not posted:
            return None
        when = (posted - datetime.timedelta(days=30)).isoformat()
    rows = [r for r in channels[max(keys, key=len)] if r[0] <= when]
    if not rows:
        return None
    _, code, name = rows[-1]
    return {"code": code, "name": name, "term": term_from_date(when), "date": date, "termFromDate": True}


def missing_counts(joined):
    missing = {}
    for key, pat in (("listener", r"H\S*rer"), ("sick", r"Krank\S*"), ("absent", r"(?:ohne\s+Grund|without\s+reason)")):
        mm = re.search(r"(?:Fehlend|Missing)\s*\(" + pat + r"\)\s*:?\s*(\d+)", joined, re.I)
        if mm:
            missing[key] = int(mm.group(1))
    return missing


def parse(text, fallback=None):
    """→ (entry, None) or (None, reason); fallback(joined) supplies the header for untitled crops"""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    joined = "\n".join(lines)
    h = header(joined) or (fallback and fallback(joined))
    if not h:
        return None, "no module code / term line"
    counts = None
    for l in lines:
        m = re.match(r"^(?:Anzahl|Number)\b(.*)", l, re.I)
        if m:
            # TUCaN prints 0 as a dash; OCR turns that into -, —, _, ---, "aaa" ...
            toks = [t.strip(")(|'‘’.,") for t in m.group(1).split()]
            toks = [t for t in toks if t and t != "I"]
            vals = [int(t) if t.isdigit() else 0 if re.fullmatch(r"[-—–_~=a]+", t) else None for t in toks]
            # one unreadable count is allowed: it is solved from the total below and then
            # confirmed by the average check (two equations, one unknown)
            if len(vals) == 11 and vals.count(None) <= 1:
                counts = vals
            break
    if counts is None:
        return None, "Anzahl row not found or not 11 numbers"
    avg = re.search(r"(?:Durchschnitt|Average):?\s*(\d[.,]\d{1,3})", joined)
    n = re.search(r"(?:Vorliegende\s+Ergebnisse|Available\s+Results):?\s*(\d+)", joined)
    if not avg or not n:
        return None, "Durchschnitt / Vorliegende Ergebnisse missing"
    avg, n = num(avg.group(1)), int(n.group(1))
    if None in counts:
        rest = n - sum(c for c in counts if c is not None)
        if rest < 0:
            return None, "unreadable count and the others already exceed %d" % n
        counts[counts.index(None)] = rest
    if sum(counts) != n:
        return None, "counts add up to %d, not %d" % (sum(counts), n)
    recomputed = sum(g * c for g, c in zip(GRADES, counts)) / n if n else 0
    if abs(recomputed - avg) > 0.001:
        return None, "average %.3f does not match recomputed %.3f" % (avg, recomputed)
    return dict(h, counts=counts, n=n, avg=round(avg, 3), missing=missing_counts(joined)), None


# ---- cell reader: fallback for clean screenshots whose counts row the page OCR garbles ----
# Tesseract often drops or misreads short numbers like "1", "8", "11" when it reads the
# whole page. Here the "Anzahl" row is located, split into its 11 columns by the gaps
# between the ink, dashes are recognised by their shape (flat = 0), and every other cell
# is read on its own in several ways. All readings are kept as candidates; one cell that
# nobody could read is solved from the total. A result is accepted only when exactly
# one combination matches both the total and the average to all 3 decimals.

def _tess_img(tess, img, psm, extra=()):
    fd, p = tempfile.mkstemp(suffix=".png")
    os.close(fd)
    img.save(p)
    try:
        return subprocess.run([tess, p, "-", "--psm", str(psm), *extra], capture_output=True).stdout.decode("utf-8", "replace")
    finally:
        os.remove(p)


def _words(tess, img):
    out = _tess_img(tess, img, 6, ["tsv"])
    rows = csv.DictReader(out.splitlines(), delimiter="\t", quoting=csv.QUOTE_NONE)
    return [r for r in rows if (r.get("text") or "").strip()]


def _box(w):
    return tuple(int(w[k]) for k in ("left", "top", "width", "height"))


def _ink_columns(bw, min_gap):
    """[(x0, x1)] of the text blobs in a row strip, ignoring table and window border lines"""
    w, h = bw.size
    px = bw.load()
    lines = {y for y in range(h) if sum(px[x, y] == 0 for x in range(w)) > w * 0.5}  # horizontal rules
    ys = [y for y in range(h) if y not in lines]
    ink = [any(px[x, y] == 0 for y in ys) for x in range(w)]
    out, start, gap, end = [], None, 0, 0
    for x, v in enumerate(ink + [False] * (min_gap + 1)):
        if v:
            if start is None:
                start = x
            gap, end = 0, x
        elif start is not None:
            gap += 1
            if gap > min_gap:
                out.append((start, end))
                start = None

    def vertical_line(x0, x1):  # touches the top and the bottom of the strip: a border, not a digit
        col = [y for y in ys if any(px[x, y] == 0 for x in range(x0, x1 + 1))]
        return col and col[0] <= ys[0] + 1 and col[-1] >= ys[-1] - 1
    return [c for c in out if not vertical_line(*c)]


def _read_variants(tess, img, whitelist):
    """the distinct readings of one small image across a few preprocessing variants"""
    from PIL import Image, ImageOps
    seen = []
    bw = img.point(lambda v: 0 if v < 150 else 255)
    for src in (img, bw):
        for sc in (1, 2):
            c = ImageOps.expand(src, border=30, fill=255)
            if sc > 1:
                c = c.resize((c.width * sc, c.height * sc), Image.LANCZOS)
            for psm in (7, 8):
                s = _tess_img(tess, c, psm, ["-c", "tessedit_char_whitelist=" + whitelist]).strip()
                if s and s not in seen:
                    seen.append(s)
    return seen


def _line_value(tess, big, ws, pattern, whitelist):
    for w in ws:
        if re.match(pattern, w["text"], re.I):
            key = (w["block_num"], w["par_num"], w["line_num"])
            same = [_box(x) for x in ws if (x["block_num"], x["par_num"], x["line_num"]) == key]
            l, t, wd, h = _box(w)
            r = max(x[0] + x[2] for x in same)
            crop = big.crop((l + wd, max(0, t - h // 2), min(big.width, r + 2 * h), t + h + h // 2))
            return _read_variants(tess, crop, whitelist)
    return []


def read_cells(tess, path):
    """→ (11 candidate lists ([] = unreadable), average candidates, total candidates) or None"""
    try:
        from PIL import Image
    except ImportError:
        return None
    g = load_gray(path)
    big = g.resize((g.width * 3, g.height * 3), Image.LANCZOS)
    ws = _words(tess, big)
    label = next((w for w in ws if re.match(r"^(Anz|Anahl|Anhl|Number)", w["text"], re.I)), None)
    if label:
        l, t, wd, h = _box(label)
        pad = int(h * 0.6)
        row = big.crop((l + wd + h, max(0, t - pad), big.width, min(big.height, t + h + pad)))
    else:
        # tiny screenshots: the table text is too small for "Anzahl" to be read, but the larger
        # "Durchschnitt" line right below the table is; the counts are the last line of ink above it
        avg_w = next((w for w in ws if re.match(r"^(Durch|Average)", w["text"], re.I)), None)
        if not avg_w:
            return None
        l, t, wd, h = _box(avg_w)
        y1 = t - h // 4
        y0 = max(0, y1 - 3 * h)
        band = big.crop((l, y0, big.width, y1)).point(lambda v: 0 if v < 150 else 255)
        px = band.load()
        inked = [0 < sum(px[x, y] == 0 for x in range(band.width)) < band.width * 0.5 for y in range(band.height)]  # rules excluded
        if True not in inked:
            return None
        bottom = max(y for y, v in enumerate(inked) if v)
        top = bottom
        while top > 0 and inked[top - 1]:
            top -= 1
        h = bottom - top + 1
        pad = int(h * 0.6)
        row = big.crop((l, max(0, y0 + top - pad), big.width, min(big.height, y0 + bottom + pad)))
    for threshold in (150, 180, 200):  # small anti-aliased text is lighter: dashes vanish at 150
        bw = row.point(lambda v, th=threshold: 0 if v < th else 255)
        cols = _ink_columns(bw, int(h * 1.2))
        if not label and len(cols) == 12:
            cols = cols[1:]  # the unread "Anzahl" label
        if len(cols) == 11:
            break
    else:
        return None
    cells = []
    for x0, x1 in cols:
        ink = bw.crop((x0, 0, x1 + 1, bw.height)).point(lambda v: 255 - v).getbbox()
        if ink and ink[3] - ink[1] < h * 0.35:  # flat mark = TUCaN's dash = 0
            cells.append([0])
            continue
        reads = _read_variants(tess, row.crop((max(0, x0 - 4), 0, x1 + 5, row.height)), "0123456789-")
        cells.append([int(s) for s in reads if s.isdigit()])
    avgs = [num(s) for s in _line_value(tess, big, ws, r"^(Durch|Average)", "0123456789,") if re.fullmatch(r"\d,\d{3}", s)]
    ns = [int(s) for s in _line_value(tess, big, ws, r"^(Vorlieg|Available)", "0123456789") if s.isdigit()]
    return cells, avgs, ns


def solve(cells, avgs, ns, limit=50000):
    """all count vectors that fit a total in ns and an average in avgs (to 3 decimals)"""
    import itertools
    unknown = [i for i, c in enumerate(cells) if not c]
    if len(unknown) > 1:
        return []
    known = [i for i, c in enumerate(cells) if c]
    combos = 1
    for i in known:
        combos *= len(cells[i])
    if combos > limit:
        return []
    found = set()
    for n in set(ns):
        for pick in itertools.product(*(cells[i] for i in known)):
            counts = [0] * 11
            for i, v in zip(known, pick):
                counts[i] = v
            if unknown:
                rest = n - sum(counts)
                if rest < 0:
                    continue
                counts[unknown[0]] = rest
            if sum(counts) != n or n == 0:
                continue
            avg = sum(g * c for g, c in zip(GRADES, counts)) / n
            if any(abs(avg - a) <= 0.0005 + 1e-9 for a in avgs):
                found.add((tuple(counts), n))
    return sorted(found)


def parse_cells(tess, path, text, fallback=None):
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    joined = "\n".join(lines)
    h = header(joined) or (fallback and fallback(joined))
    got = h and read_cells(tess, path)
    if not got:
        return None, None
    cells, avgs, ns = got
    m = re.search(r"(?:Durchschnitt|Average):?\s*(\d[.,]\d{3})", joined)
    avgs += [num(m.group(1))] if m else []
    m = re.search(r"(?:Vorliegende\s+Ergebnisse|Available\s+Results):?\s*(\d+)", joined)
    ns += [int(m.group(1))] if m else []
    sols = solve(cells, avgs, ns)
    if not sols and all(cells):
        # every reading of some cell may be wrong (an 8 read as 7 everywhere): let each
        # cell in turn be the unknown; still has to be the single fit
        sols = sorted({s for i in range(11) if cells[i] != [0]
                       for s in solve(cells[:i] + [[]] + cells[i + 1:], avgs, ns)})
    if len(sols) != 1:
        return None, "cell reader: %d fitting combinations" % len(sols)
    counts, n = sols[0]
    avg = round(sum(g * c for g, c in zip(GRADES, counts)) / n, 3)
    return dict(h, counts=list(counts), n=n, avg=avg, missing=missing_counts(joined)), None


def drop_old_versions(data):
    """TUCaN updates a Notenspiegel after the Klausureinsicht: same module, term and exam date,
    (nearly) the same number of results, slightly different grades. Screenshots of both states
    get posted; only the one posted last is kept. Clearly different totals on the same day
    (e.g. a Studienleistung and a Fachprüfung) stay separate."""
    dropped = 0
    for code, es in data.items():
        groups, drop = {}, set()
        for e in es:
            if e.get("date"):
                groups.setdefault((e["term"], e["date"]), []).append(e)
        for g in groups.values():
            g.sort(key=lambda e: (e.get("posted") or "", e["n"]), reverse=True)  # newest first
            for i, e in enumerate(g):
                if id(e) in drop:
                    continue
                for o in g[i + 1:]:
                    if id(o) not in drop and abs(o["n"] - e["n"]) <= max(2, 0.05 * e["n"]):
                        drop.add(id(o))
        if drop:
            data[code] = [e for e in es if id(e) not in drop]
            dropped += len(drop)
    return dropped


def load_existing(path):
    if not os.path.isfile(path):
        return {}
    s = open(path, encoding="utf-8").read()
    i = s.find(PREFIX)
    if i < 0:
        return {}
    body = s[i + len(PREFIX):].strip().rstrip(";")
    return json.loads(body) if body else {}


def write(path, data):
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("/* Notenspiegel (grade distributions) from TUCaN screenshots.\n"
                "   Generated by tools/notenspiegel/extract.py - edit by re-running the tool.\n"
                "   GRADE_STATS[code] = [{ name, term, date, counts: [1,0 … 4,0, 5,0], n, avg, missing }] */\n")
        rows = [" %s: %s" % (json.dumps(k), json.dumps(data[k], ensure_ascii=False, separators=(",", ":"), sort_keys=True)) for k in sorted(data)]
        f.write(PREFIX + ("{\n" + ",\n".join(rows) + "\n}" if rows else "{}") + ";\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("inputs", nargs="+", help="image files or folders")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "..", "js", "gradestats.js"))
    ap.add_argument("--tesseract")
    ap.add_argument("--channels", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "channels.csv"),
                    help="Discord channel -> module map for screenshots cropped below the title")
    a = ap.parse_args()
    tess = find_tesseract(a.tesseract)
    files = []
    for p in a.inputs:
        if os.path.isdir(p):
            for root, _, names in os.walk(p):
                files += [os.path.join(root, n) for n in sorted(names) if n.lower().endswith(IMAGE_EXT)]
        else:
            files.append(p)
    channels = load_channels(a.channels)
    exact, loose = {}, {}

    def merge(code, e):
        """add e unless it is an exam already known; → True if added.
        Same exam = same module + term + distribution (the date is not always readable).
        A term guessed from the date only matches on module + distribution, and a real
        title always replaces a guessed term."""
        counts = tuple(e["counts"])
        old = exact.get((code, e["term"], counts))
        if not old:
            old = next((o for o in loose.get((code, counts), []) if o.get("termFromDate") or e.get("termFromDate")), None)
        if old:
            old["date"] = old.get("date") or e.get("date")
            if e.get("posted") and (old.get("posted") or "") < e["posted"]:
                old["posted"] = e["posted"]
            if old.get("termFromDate") and not e.get("termFromDate"):
                old["term"] = e["term"]
                del old["termFromDate"]
            return False
        exact[(code, e["term"], counts)] = e
        loose.setdefault((code, counts), []).append(e)
        data.setdefault(code, []).append(e)
        return True

    data, manual_sources = {}, set()
    manual = os.path.join(os.path.dirname(os.path.abspath(__file__)), "manual.json")
    if os.path.isfile(manual):  # hand-read screenshots (photos, charts); checked like OCR results
        for m in json.load(open(manual, encoding="utf-8")):
            manual_sources.add(m.get("_source"))
            m = {k: v for k, v in m.items() if not k.startswith("_")}
            if sum(m["counts"]) != m["n"] or abs(sum(g * c for g, c in zip(GRADES, m["counts"])) / m["n"] - m["avg"]) > 0.0005 + 1e-9:
                sys.exit("manual.json: %s %s does not add up" % (m["code"], m["term"]))
            merge(m.pop("code"), m)

    old_data = load_existing(a.out)
    for c, es in old_data.items():  # also merges duplicates left in the file by older versions of this tool
        for e in sorted(es, key=lambda e: bool(e.get("termFromDate"))):
            merge(c, e)

    def read(f):
        entry, reason = read_one(f)
        if entry and posted_date(f):
            entry["posted"] = posted_date(f).isoformat()
        return entry, reason

    def read_one(f):
        fallback = (lambda joined: channel_header(f, joined, channels)) if channels else None
        first, texts = None, []
        for scale in (1, 2, 3):
            try:
                texts.append(ocr(tess, f, scale))
                entry, reason = parse(texts[-1], fallback)
            except Exception as e:  # one odd image must not stop the batch
                entry, reason = None, "parse error: %s" % e
            if entry:
                return entry, None
            first = first or reason
        for text in texts:  # title readable but counts not: read the table cell by cell
            try:
                entry, reason = parse_cells(tess, f, text, fallback)
            except Exception as e:
                entry, reason = None, "cell reader error: %s" % e
            if entry:
                return entry, None
            if reason:
                return None, "%s; %s" % (first, reason)
        return None, first

    added, dup, bad = 0, 0, []
    with ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as pool:
        results = pool.map(read, files)
        for i, (f, (entry, reason)) in enumerate(zip(files, results), 1):
            if i % 50 == 0:
                print("  %d/%d …" % (i, len(files)), flush=True)
            if not entry:
                if not any(src and src in os.path.basename(f) for src in manual_sources):
                    bad.append((f, reason))  # (images read by hand in manual.json are not listed again)
                continue
            code = entry.pop("code")
            if merge(code, entry):
                added += 1
            else:
                dup += 1
    replaced = drop_old_versions(data)
    for es in data.values():
        es.sort(key=lambda e: (e.get("date") or "", e["term"]))
    write(a.out, data)
    review = os.path.join(os.path.dirname(os.path.abspath(a.out)), "review.csv")
    if bad:
        try:
            open(review, "a").close()
        except PermissionError:  # open in Excel
            review = review[:-4] + "-new.csv"
        with open(review, "w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(["file", "reason"])
            w.writerows(bad)
    print("%d images: %d added, %d duplicates, %d older versions replaced, %d need review%s"
          % (len(files), added, dup, replaced, len(bad), (" -> " + review) if bad else ""))
    print("modules with data: %d" % len(data))


if __name__ == "__main__":
    main()
