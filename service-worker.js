const CACHE_NAME = "kids-learning-app-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/image/icon-192x192.png",  // パス修正
  "/image/icon-512x512.png"   // パス修正
];

// インストール時にキャッシュを作成
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache).catch((error) => {
        console.error("Failed to cache resources:", error);  // エラーハンドリング追加
      });
    })
  );
});

// リクエストが発生したときにキャッシュをチェック
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch((error) => {
        console.error("Failed to fetch resource:", error);  // フェッチエラー時のハンドリング
      });
    })
  );
});

// 古いキャッシュを削除
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
