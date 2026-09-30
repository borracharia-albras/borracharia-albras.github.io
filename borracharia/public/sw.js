/* Service worker: guarda o app no tablet para abrir sem internet */
const VERSAO = "borracharia-v1";
const ARQUIVOS = ["./", "index.html", "app.js", "firebase.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png", "icons/favicon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const mesmoSite = url.origin === self.location.origin;
  const fonte = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!mesmoSite && !fonte) return; // Firestore e login seguem direto pela rede
  if (mesmoSite && url.pathname.startsWith("/__/")) return;
  // Rede primeiro (para pegar atualizações); se estiver sem internet, usa a cópia guardada
  e.respondWith(
    fetch(req).then((resp) => {
      if (resp && (resp.ok || resp.type === "opaque")) { const copia = resp.clone(); caches.open(VERSAO).then((c) => c.put(req, copia)); }
      return resp;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
