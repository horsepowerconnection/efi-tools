/* EFI Tools — bump CACHE on ANY shipped change or phones keep serving the old one. */
const CACHE = "efi-tools-4abf149320";
const SHELL = ["./", "./index.html", "./injector.html", "./pump.html", "./shift.html",
  "./manifest.webmanifest", "./assets/efi-store-logo.png", "./assets/icon-192.png",
  "./assets/injector-catalog.json", "./assets/pump-catalog.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  /* Navigations go to the network first so an update actually lands, and fall back to
     the cache when there is no signal - which is the whole point of it being an app. */
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok && new URL(req.url).origin === self.location.origin) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
    }
    return res;
  })));
});
