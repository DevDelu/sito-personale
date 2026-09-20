// Service worker di Radar: installabilità PWA + Web Push. Un solo service
// worker per tutto il progetto — non crearne un secondo, estendere questo.
// Ancora nessuna cache/offline: install/activate immediati, fetch
// pass-through (richiesto da Chrome per considerare l'app installabile),
// più i handler push/notificationclick per le notifiche (lib/push/send.ts
// lato server, /impostazioni lato client).

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pass-through: nessuna strategia di cache in questa fase.
});

// Su iOS ogni push DEVE mostrare una notifica visibile: un push "silenzioso"
// (nessuna showNotification) porta il sistema a revocare la subscription.
// Per questo qui non si valuta mai se mostrarla o no, solo cosa mostrare.
self.addEventListener("push", (event) => {
  let data = { title: "Radar", body: "" };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const { title, body, tag, url } = data;

  event.waitUntil(
    self.registration.showNotification(title || "Radar", {
      body: body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag,
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Solo URL same-origin: un payload push arbitrario non deve poter aprire
  // l'app su un dominio esterno. /spese resta il fallback (nessuna home
  // dedicata nell'area privata, stesso default del redirect di login).
  let target = "/spese";
  const requested = event.notification.data?.url;
  if (requested) {
    try {
      const resolved = new URL(requested, self.location.origin);
      if (resolved.origin === self.location.origin) {
        target = resolved.pathname + resolved.search + resolved.hash;
      }
    } catch {
      // URL non valido: resta il fallback.
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) client.navigate(target);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
