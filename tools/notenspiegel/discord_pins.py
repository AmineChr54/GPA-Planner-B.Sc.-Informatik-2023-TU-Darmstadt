"""Download every image from the pinned messages of a Discord server's channels.

    set DISCORD_BOT_TOKEN=...          (PowerShell: $env:DISCORD_BOT_TOKEN = "...")
    python tools/notenspiegel/discord_pins.py <guild-id> [<guild-id> ...] [--out private/notenspiegel-discord]
    python tools/notenspiegel/extract.py private/notenspiegel-discord

Without a bot: collect the image links in the browser with collect_pins.js, then
    python tools/notenspiegel/discord_pins.py --from-list notenspiegel-urls.json

Bot mode uses a Discord *bot* account (official API, allowed by Discord's terms). Setup:
  1. https://discord.com/developers/applications -> New Application -> Bot -> Reset Token (copy it)
  2. Same page: enable "Message Content Intent" (without it the API hides attachments)
  3. OAuth2 -> URL Generator: scope "bot", permissions "View Channels" + "Read Message History"
     -> a server admin opens that URL and adds the bot to the server
  4. Guild id: Discord settings -> Advanced -> Developer Mode, then right-click the server -> Copy Server ID

The script walks all text channels the bot can see, reads all pins (paginated) and
saves image attachments and embedded images. Re-runs skip files already downloaded.
It does not filter: extract.py rejects anything that is not a valid Notenspiegel
(Gedächtnisprotokoll links, memes, ...) and lists it in review.csv.
Only images are saved: no usernames or message text.
"""
import argparse, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request

API = "https://discord.com/api/v10"
UA = "DiscordBot (notenspiegel-fetch, 1.0)"
TEXT_TYPES = {0, 5}  # text, announcement
IMAGE_EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp")


def api(token, path, params=None):
    url = API + path + ("?" + urllib.parse.urlencode(params) if params else "")
    while True:
        req = urllib.request.Request(url, headers={"Authorization": "Bot " + token, "User-Agent": UA})
        try:
            with urllib.request.urlopen(req) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(float(json.load(e).get("retry_after", 1)) + 0.2)
                continue
            if e.code in (403, 404):
                return e.code
            raise


def pinned_messages(token, channel_id):
    """All pinned messages; new paginated endpoint, falls back to the legacy one (max 50)."""
    out, before = [], None
    while True:
        params = {"limit": 50}
        if before:
            params["before"] = before
        page = api(token, "/channels/%s/messages/pins" % channel_id, params)
        if page == 404 and not out:
            legacy = api(token, "/channels/%s/pins" % channel_id)
            return legacy if isinstance(legacy, list) else []
        if not isinstance(page, dict):
            return out
        items = page.get("items", [])
        out += [i["message"] for i in items]
        if not page.get("has_more") or not items:
            return out
        before = items[-1]["pinned_at"]


def image_urls(msg):
    for a in msg.get("attachments", []):
        if (a.get("content_type") or "").startswith("image/") or a["filename"].lower().endswith(IMAGE_EXT):
            yield a["url"], os.path.splitext(a["filename"])[1].lower() or ".png"
    for e in msg.get("embeds", []):
        for key in ("image", "thumbnail"):
            u = (e.get(key) or {}).get("url")
            if u:
                ext = os.path.splitext(urllib.parse.urlparse(u).path)[1].lower()
                if ext in IMAGE_EXT:  # skips link-preview icons (svg, favicons without extension)
                    yield u, ext
                break


def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r, open(path + ".part", "wb") as f:
        f.write(r.read())
    os.replace(path + ".part", path)


def safe(s):
    return re.sub(r"[^A-Za-z0-9_-]+", "_", s)[:40]


def from_list(list_path, out):
    with open(list_path, encoding="utf-8") as f:
        items = json.load(f)
    os.makedirs(out, exist_ok=True)
    ok = 0
    for it in items:
        parts = urllib.parse.urlparse(it["url"]).path.split("/")  # /attachments/<channel>/<id>/<file>
        ext = os.path.splitext(parts[-1])[1].lower() or ".png"
        where = re.sub(r"^(\(\d+\)\s*)?Discord\s*\|\s*", "", it.get("where", ""))
        path = os.path.join(out, "%s_%s%s" % (safe(where), parts[-2], ext))
        if not os.path.exists(path):
            try:
                download(it["url"], path)
            except (urllib.error.URLError, OSError) as e:
                print("failed %s: %s" % (it.get("where"), e))
                continue
        ok += 1
    print("%d/%d images in %s\nNext: python tools/notenspiegel/extract.py %s" % (ok, len(items), out, out))
    if ok < len(items):
        print("Failures are usually expired links (older than ~1 day): collect again and re-run.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("guilds", nargs="*", help="server (guild) ids")
    ap.add_argument("--out", default="private/notenspiegel-discord")
    ap.add_argument("--token", default=os.environ.get("DISCORD_BOT_TOKEN"))
    ap.add_argument("--from-list", help="notenspiegel-urls.json saved by collect_pins.js (no bot needed)")
    a = ap.parse_args()
    if a.from_list:
        return from_list(a.from_list, a.out)
    if not a.guilds:
        ap.error("give guild ids or --from-list")
    if not a.token:
        sys.exit("No bot token: set DISCORD_BOT_TOKEN or pass --token.")

    total = 0
    for gid in a.guilds:
        guild = api(a.token, "/guilds/%s" % gid)
        if not isinstance(guild, dict):
            print("guild %s: not accessible (is the bot in that server?)" % gid)
            continue
        gdir = os.path.join(a.out, safe(guild["name"]))
        os.makedirs(gdir, exist_ok=True)
        channels = api(a.token, "/guilds/%s/channels" % gid)
        for ch in sorted(channels, key=lambda c: c.get("position", 0)):
            if ch["type"] not in TEXT_TYPES:
                continue
            pins = pinned_messages(a.token, ch["id"])
            got = 0
            for msg in pins:
                for i, (url, ext) in enumerate(image_urls(msg)):
                    path = os.path.join(gdir, "%s_%s_%d%s" % (safe(ch["name"]), msg["id"], i, ext))
                    if not os.path.exists(path):
                        try:
                            download(url, path)
                        except (urllib.error.URLError, OSError) as e:
                            print("  failed %s: %s" % (path, e))
                            continue
                    got += 1
            if pins:
                print("%-28s %3d pins, %3d images" % ("#" + ch["name"], len(pins), got))
            total += got
    print("\n%d images in %s\nNext: python tools/notenspiegel/extract.py %s" % (total, a.out, a.out))


if __name__ == "__main__":
    main()
