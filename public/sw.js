const ADMIN_RESERVATIONS_URL = "/admin/reservations";

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const title = typeof payload.title === "string" ? payload.title : "New Sakura reservation";
  const options = {
    body: typeof payload.body === "string" ? payload.body : "Open the owner dashboard to review the request.",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: typeof payload.tag === "string" ? payload.tag : "sakura-reservation",
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: { url: ADMIN_RESERVATIONS_URL },
  };
  event.waitUntil(Promise.all([
    self.registration.showNotification(title, options),
    "setAppBadge" in self.navigator ? self.navigator.setAppBadge().catch(() => undefined) : Promise.resolve(),
  ]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      if (new URL(client.url).origin === self.location.origin) {
        return client.focus().then(() => client.navigate(ADMIN_RESERVATIONS_URL));
      }
    }
    return self.clients.openWindow(ADMIN_RESERVATIONS_URL);
  }));
});
