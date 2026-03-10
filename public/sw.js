const CACHE_VERSION = 'arkon-shell-v1'
const APP_SHELL_URLS = ['/', '/index.html']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL_URLS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(request)
        const cache = await caches.open(CACHE_VERSION)
        cache.put('/', networkResponse.clone())
        return networkResponse
      } catch {
        return (await caches.match(request)) || (await caches.match('/')) || (await caches.match('/index.html'))
      }
    })())
    return
  }

  event.respondWith((async () => {
    const cached = await caches.match(request)
    if (cached) return cached
    try {
      const networkResponse = await fetch(request)
      const cache = await caches.open(CACHE_VERSION)
      cache.put(request, networkResponse.clone())
      return networkResponse
    } catch {
      return cached || Response.error()
    }
  })())
})
