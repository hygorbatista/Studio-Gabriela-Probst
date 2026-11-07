import 'server-only'
import { sendNotification, WebPushError } from 'web-push'

const pushHosts = new Set([
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'web.push.apple.com',
])

export function validPushEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint)
    return url.protocol === 'https:' && !url.port && !url.username && !url.password &&
      !url.hash && (pushHosts.has(url.hostname) || url.hostname.endsWith('.push.apple.com'))
  } catch {
    return false
  }
}

export type Device = { endpoint: string; p256dh: string; auth: string }

export function sendPush(device: Device, message: { title: string; body: string; path: string }, ttl: number, topic?: string) {
  if (!validPushEndpoint(device.endpoint)) throw new Error('Destino push inválido')
  const { NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env
  if (!NEXT_PUBLIC_VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) throw new Error('Web Push indisponível')
  return sendNotification(
    { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
    JSON.stringify({ ...message, tag: topic }),
    {
      TTL: ttl, timeout: 8000, urgency: 'normal', topic,
      vapidDetails: { subject: VAPID_SUBJECT, publicKey: NEXT_PUBLIC_VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY },
    },
  )
}

export function expiredSubscription(error: unknown) {
  return error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)
}
