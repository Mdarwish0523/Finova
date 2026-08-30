/* global self */

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Finova free trial reminder", body: event.data ? event.data.text() : "Review your upcoming free trial charge." };
  }
  const title = payload.title || "Finova free trial reminder";
  event.waitUntil(self.registration.showNotification(title, {
    body: payload.body || "Review your upcoming free trial charge.",
    icon: "/icon",
    badge: "/icon",
    tag: payload.tag || "finova-trial-reminder",
    data: { url: payload.url || "/protected/trials" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/protected/trials";
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("navigate" in client) await client.navigate(url);
      if ("focus" in client) return client.focus();
    }
    return self.clients.openWindow(url);
  })());
});
