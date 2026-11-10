/* global self, clients */
self.addEventListener('push', (event) => {
  let message
  try {
    message = event.data?.json()
  } catch {
    return
  }
  if (typeof message?.title !== 'string' || typeof message.body !== 'string') return
  event.waitUntil(self.registration.showNotification(message.title, {
    body: message.body,
    icon: '/icon-192.png',
    tag: typeof message.tag === 'string' ? message.tag : undefined,
    data: { path: message.path },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = event.notification.data?.path
  const url = new URL(typeof path === 'string' ? path : '/painel', self.location.origin)
  if (url.origin !== self.location.origin || !/^\/painel(?:\/|$)/.test(url.pathname)) return
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = windows.find((client) => client.url === url.href)
    if (existing) await existing.focus()
    else await clients.openWindow(url.href)
  })())
})
