self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // 기본 네트워크 패스스루 (추후 필요 시 캐싱 정책 구현 가능)
  event.respondWith(fetch(event.request));
});

self.addEventListener("push", (event) => {
  let title = "화이팅 만마에!";
  let options = {
    body: "오늘 하루도 힘차게 극복해봐요!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
  };

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) title = data.title;
      if (data.body) options.body = data.body;
    } catch (e) {
      options.body = event.data.text() || options.body;
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});
