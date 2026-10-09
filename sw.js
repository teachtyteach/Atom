const CACHE = "atom-v75", STATIC = "atom-static-1";
const PAGES = ["./", "index.html", "manifest.json"], DATA = ["classlib.json", "storylib.json"];
const ASSETS = ["icon-192.png", "icon-512.png", "apple-touch-icon.png", "Lexend-Regular.woff2", "Lexend-Bold.woff2", "OpenDyslexic-Regular.woff2", "OpenDyslexic-Bold.woff2", "pdf.min.js", "pdf.worker.min.js", "dictionary.json", "mascot.png",
  "ico-cream.png", "ico-coral.png", "ico-robot.png", "ico-gold.png", "ico-diamond.png", "ico-a-blue.png", "ico-a-green.png", "ico-a-orange.png", "ico-a-purple.png", "ico-a-pink.png", "ico-a-teal.png", "ico-fern.png", "ico-hat.png", "ico-moth.png", "ico-stag.png", "ico-flame.png", "ico-owl.png", "ico-ghost.png"];
self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const pc = await caches.open(CACHE); await pc.addAll(PAGES);
    for (const f of DATA) { try { await pc.add(f); } catch (err) {} }
    // big files are kept between updates, so only new ones download
    const s = await caches.open(STATIC);
    for (const f of ASSETS) { if (!(await s.match(f))) { try { await s.add(f); } catch (err) {} } }
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.open(STATIC).then(s => Promise.all(DATA.map(f => s.delete(f, { ignoreSearch: true })))).catch(() => {}).then(() => caches.keys()).then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== STATIC).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;
  const path = new URL(req.url).pathname;
  const page = req.mode === "navigate" || path.endsWith("/") || /\.(html)$/.test(path) || /(manifest|amb|classlib|storylib)\.json$/.test(path);
  if (page) {
    // online: always get the newest copy. offline: use the saved one.
    e.respondWith(
      fetch(req).then(res => {
        if (!res.ok) return caches.match(req, { ignoreSearch: true }).then(hit => hit || res);
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match("index.html")))
    );
  } else {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(STATIC).then(c => c.put(req, copy)).catch(() => {}); }
      return res;
    })));
  }
});
