import { createHash, timingSafeEqual } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { expiredSubscription, sendPush } from '@/lib/push-server'

function authorized(request: Request) {
  const secret = process.env.NOTIFICATIONS_CRON_SECRET
  if (!secret) return false
  const digest = (value: string) => createHash('sha256').update(value).digest()
  return timingSafeEqual(digest(request.headers.get('authorization') ?? ''), digest(`Bearer ${secret}`))
}

export async function POST(request: Request) {
  if (!authorized(request)) return new Response(null, { status: 401 })
  const key = process.env.SUPABASE_NOTIFICATION_SECRET_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || !key || !process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_SUBJECT) {
    return Response.json({ error: 'not_configured' }, { status: 503 })
  }

  const supabase = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await supabase.rpc('claim_panel_notifications')
  if (error) return Response.json({ error: 'claim_failed' }, { status: 500 })

  const batches = new Map<string, (typeof data)[number][]>()
  for (const item of data) {
    const key = item.device_id + ':' + (item.event_key.startsWith('goal-') ? 'goals' : item.event_key)
    const batch = batches.get(key) ?? []
    batch.push(item)
    batches.set(key, batch)
  }

  const results = await Promise.all([...batches.values()].map(async (items) => {
    const [item] = items
    const ttl = Math.min(86400, Math.floor((Date.parse(item.expires_at) - Date.now()) / 1000))
    if (ttl <= 0) return 'expired'
    try {
      const topic = createHash('sha256').update(items.map((entry) => entry.event_key).sort().join('|')).digest('base64url').slice(0, 32)
      const body = items.length > 1 ? 'Você alcançou as metas de faturamento e de atendimentos.' : item.body
      await sendPush(item, { title: item.title, body, path: item.path }, ttl, topic)
      const { error: writeError } = await supabase.from('notification_deliveries')
        .update({ sent_at: new Date().toISOString() })
        .eq('device_id', item.device_id).in('event_key', items.map((entry) => entry.event_key)).eq('lease_until', item.lease_until)
      return writeError ? 'failed' : 'accepted'
    } catch (error) {
      if (!expiredSubscription(error)) return 'failed'
      const { error: deleteError } = await supabase.from('notification_devices').delete().eq('id', item.device_id)
        .eq('p256dh', item.p256dh).eq('auth', item.auth)
      return deleteError ? 'failed' : 'removed'
    }
  }))

  const failed = results.filter((value) => value === 'failed').length
  return Response.json({
    accepted: results.filter((value) => value === 'accepted').length,
    removed: results.filter((value) => value === 'removed').length,
    failed,
  }, { status: failed ? 502 : 200 })
}
