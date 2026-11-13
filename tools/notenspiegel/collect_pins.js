// Collect Notenspiegel screenshots while you browse Discord (no bot needed).
//
// 1. Open https://discord.com/app in Chrome/Edge/Firefox (the desktop app has DevTools disabled).
// 2. F12 -> Console -> paste this file -> Enter. (Chrome may ask you to type "allow pasting" first.)
// 3. A badge appears bottom-right. Go to each module channel, open the pins and scroll them
//    to the end. Every image attachment that shows up on screen gets counted.
// 4. Click "Save list" -> notenspiegel-urls.json lands in your Downloads, then:
//      python tools/notenspiegel/discord_pins.py --from-list %USERPROFILE%\Downloads\notenspiegel-urls.json
//      python tools/notenspiegel/extract.py private/notenspiegel-discord
//    Download right away: Discord's image links expire after about a day.
//
// It only reads what is already on your screen: no API calls and no automatic clicking.
// It also catches normal chat images. extract.py throws out anything that isn't a Notenspiegel.
(() => {
  if (window.__nsCollector) return console.log("collector already running");
  const found = new Map();
  const where = () => document.title.replace(/^\(\d+\)\s*/, "").replace(/^Discord\s*\|\s*/, "");

  const grab = () => {
    document.querySelectorAll('a[href*="/attachments/"], img[src*="/attachments/"]').forEach((el) => {
      let u;
      try { u = new URL(el.href || el.src); } catch { return; }
      if (!/discordapp\.(com|net)$/.test(u.hostname) || !/\.(png|jpe?g|webp)$/i.test(u.pathname)) return;
      if (found.has(u.pathname)) return;
      const q = ["ex", "is", "hm"].filter((k) => u.searchParams.get(k)).map((k) => k + "=" + u.searchParams.get(k));
      found.set(u.pathname, { url: "https://cdn.discordapp.com" + u.pathname + (q.length ? "?" + q.join("&") : ""), where: where() });
    });
    label.textContent = found.size + " images";
  };

  const box = document.createElement("div");
  box.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:99999;background:#1e1f22;color:#fff;padding:8px 12px;border-radius:8px;font:13px sans-serif;display:flex;gap:8px;align-items:center;box-shadow:0 2px 10px #0008";
  const label = document.createElement("span");
  const save = document.createElement("button");
  save.textContent = "Save list";
  save.style.cssText = "background:#5865f2;color:#fff;border:0;border-radius:4px;padding:4px 8px;cursor:pointer";
  save.onclick = () => {
    const blob = new Blob([JSON.stringify([...found.values()], null, 1)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "notenspiegel-urls.json" });
    a.click();
  };
  box.append(label, save);
  document.body.append(box);

  let t;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(grab, 300); }).observe(document.body, { childList: true, subtree: true });
  window.__nsCollector = found;
  grab();
})();
