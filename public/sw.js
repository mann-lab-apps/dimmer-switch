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
