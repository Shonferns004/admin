const CACHE = 'crabstack-v1'
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/'])))
  self.skipWaiting()
})
self.addEventListener('activate', e => e.waitUntil(clients.claim()))
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.status === 200) {
        const copy = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, copy))
      }
      return res
    }))
  )
})
