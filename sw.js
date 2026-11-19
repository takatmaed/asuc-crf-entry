"use strict";
// ASUC 症例入力アプリ（Web版）のオフライン用の仕組み（service worker）。
// アプリのファイルだけをこの端末に保存し、ネットがなくても開けるようにする。入力内容は扱わない
// （入力内容はアプリがこの端末のブラウザ内に保存し、外部へは送らない）。
const CACHE = "asuc-crf-34e3d6431b95";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => {
  // 公開サーバーの一時保存（キャッシュ）に古い版が残っていても、必ず新しい版を取りに行く
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: "reload"})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  // 同じアドレスの他のページの保存は消さない（このアプリの古い版だけ消す）
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("asuc-crf-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  // 端末に保存した版を先に使う（新しい版は次に開いたときに反映される）
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).catch(() =>
    req.mode === "navigate" ? caches.match("./index.html") : Response.error())));
});
