// Service worker minimo per rendere Radar installabile come PWA.
// Nessuna cache/offline in questa fase: solo install/activate immediati e un
// fetch handler pass-through (richiesto da Chrome per considerare l'app
// installabile). Estendere qui (push, notificationclick, ecc.) nelle fasi
// successive, non creare un secondo service worker.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pass-through: nessuna strategia di cache in questa fase.
});
