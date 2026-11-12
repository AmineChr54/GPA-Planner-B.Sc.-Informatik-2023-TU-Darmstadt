/* Service worker: makes the app work offline after the first visit.
   Network first (so updates arrive immediately), cache as fallback.
   Bump VERSION when the file list changes. Nothing personal is cached:
   grades live in localStorage, not in this cache. */
const VERSION = "notenplaner-v3";
const CORE = [
  "./", "index.html", "manifest.webmanifest", "css/fonts.css", "css/app.css", "icons/logo.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
  "js/data.js", "js/catalog.js", "js/i18n.js", "js/engine.js", "js/tucan.js", "js/store.js", "js/ui.js",
  "js/views/common.js", "js/views/overview.js", "js/views/plan.js", "js/views/strategy.js", "js/views/exams.js", "js/views/settings.js", "js/app.js",
  "vendor/pdfjs/pdf.min.js", "vendor/pdfjs/pdf.worker.min.js", "vendor/html-to-image/html-to-image.js",
];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html"))));
});
