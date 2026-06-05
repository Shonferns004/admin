const CACHE = 'crabstack-v1'
const STATIC_CACHE = 'crabstack-static-v1'

self.addEventListener('install', e => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim())
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE && k !== STATIC_CACHE).map(k => caches.delete(k))
    ))
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // API — never cache
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Navigation (HTML pages) — network first
  if (request.mode === 'navigate') {
    e.respondWith(networkFirst(request))
    return
  }

  // Static assets — stale while revalidate
  e.respondWith(staleWhileRevalidate(request))
})

async function networkFirst(request) {
  try {
    const res = await fetch(request)
    if (res.ok) {
      const copy = res.clone()
      caches.open(CACHE).then(c => c.put(request, copy)).catch(() => {})
    }
    return res
  } catch {
    const cached = await caches.match(request)
    return cached || new Response('Offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)
  const fetchPromise = fetch(request).then(res => {
    if (res.ok) {
      const copy = res.clone()
      caches.open(STATIC_CACHE).then(c => c.put(request, copy)).catch(() => {})
    }
    return res
  }).catch(() => cached)
  return cached || (await fetchPromise)
}
