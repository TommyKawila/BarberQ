/* ClipperQ Web Push service worker */
self.addEventListener("push", (event) => {
  let data = { title: "ClipperQ", body: "", url: "/admin", tag: "barberqx" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "ClipperQ", {
      body: data.body || "",
      tag: data.tag || "barberqx",
      data: { url: data.url || "/admin" },
      icon: "/brand/clipperq/app-icon-dark.png",
      badge: "/brand/clipperq/mark-cream-64.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
