/* ACNM 임상통계 해설 노트 — 오프라인 서비스워커 */
var CACHE = "acnm-notes-2026.09.22";
var ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "icon-180.png",
  "icon-maskable-512.png",
  "favicon-32.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  /* 페이지 이동 요청: 캐시된 셸을 먼저 돌려주고, 뒤에서 갱신 */
  if (req.mode === "navigate") {
    e.respondWith(
      caches.match("index.html").then(function (hit) {
        var net = fetch(req).then(function (res) {
          caches.open(CACHE).then(function (c) { c.put("index.html", res.clone()); });
          return res;
        }).catch(function () { return hit; });
        return hit || net;
      })
    );
    return;
  }

  /* 그 밖의 자원: 캐시 우선 + 백그라운드 갱신 */
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
