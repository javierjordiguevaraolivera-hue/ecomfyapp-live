self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};

  event.waitUntil(
    self.registration.showNotification(data.title || "Metricas", {
      body: data.body || "Nueva notificacion",
      data: {
        url: data.url || "/dashboard",
      },
      icon: data.icon || "/assets/ecomfy-lead-icon-192.png",
      tag: data.tag,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ includeUncontrolled: true, type: "window" })
      .then((clients) => {
        const existingClient = clients.find((client) =>
          client.url.includes("/dashboard"),
        );

        if (existingClient) {
          existingClient.focus();
          return existingClient.navigate(targetUrl);
        }

        return self.clients.openWindow(targetUrl);
      }),
  );
});
