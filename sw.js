// ===========================================================================
// Sub Timer — service worker
// ---------------------------------------------------------------------------
// manifest.json declares display:standalone, so the app installs to the home
// screen and looks native. Until now it had no service worker, so it behaved
// like a website: at a ground with no signal, a cold start showed the browser's
// offline page. A game-day timer that needs a network to open is the wrong way
// round — grassroots ovals are exactly where signal isn't.
//
// STRATEGY — network-first for the app shell, cache-first for icons.
//
// Network-first matters here. The obvious choice for an offline app is
// cache-first, but this app ships often (v2.9.x and counting) and cache-first
// is how PWAs get coaches stuck on a build from three weeks ago with no way to
// tell. Network-first gives: online → always the current version; offline →
// the last one that loaded. Both correct.
//
// Deliberately NOT doing skipWaiting(): a new worker taking over mid-match
// could reload the page during a game. A new version activates on the next
// cold start instead, which for a weekly-use app is soon enough.
//
// CDN requests (Three.js, Supabase) are left alone — they already degrade
// correctly. The 2D pitch renders without WebGL, and cloud sync is meant to
// fail offline. The clock font is no longer among them: it's inlined in
// index.html as a data URI, because that one is the app's identity.
// ===========================================================================
const VERSION = 'sub-timer-v2.9.3';
const SHELL = ['./', './index.html', './manifest.json'];
const ICONS = ['./icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      // Individually, so one missing icon can't fail the whole install.
      .then((c) => Promise.allSettled([...SHELL, ...ICONS].map((u) => c.add(u))))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;   // CDNs handle themselves

  const isIcon = /\.(png|ico|svg)$/i.test(url.pathname);

  if (isIcon) {
    e.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(request, copy));
        return res;
      }))
    );
    return;
  }

  // App shell: network first, cache as the safety net.
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('./index.html')))
  );
});
