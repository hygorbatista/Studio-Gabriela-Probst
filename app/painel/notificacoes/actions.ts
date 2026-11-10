'use server'

import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { expiredSubscription, sendPush, validPushEndpoint } from '@/lib/push-server'

const endpointSchema = z.string().max(2048).refine(validPushEndpoint)
const deviceSchema = z.object({
  endpoint: endpointSchema,
  p256dh: z.string().regex(/^[A-Za-z0-9_-]{87}=?$/),
  auth: z.string().regex(/^[A-Za-z0-9_-]{22}(?:==)?$/),
})

export async function registerNotificationDevice(input: unknown) {
  const { supabase } = await requireUser()
  const parsed = deviceSchema.safeParse(input)
  if (!parsed.success) return false

  const { error: preferenceError } = await supabase.from('notification_preferences')
    .upsert({}, { onConflict: 'user_id', ignoreDuplicates: true })
  if (preferenceError) return false

  const { error } = await supabase.from('notification_devices').upsert(parsed.data, { onConflict: 'endpoint' })
  return !error
}

export async function removeNotificationDevice(endpoint: string) {
  const { supabase } = await requireUser()
  if (!endpointSchema.safeParse(endpoint).success) return false
  const { error } = await supabase.from('notification_devices').delete().eq('endpoint', endpoint)
  return !error
}

export async function testNotificationDevice(endpoint: string) {
  const { supabase } = await requireUser()
  if (!endpointSchema.safeParse(endpoint).success) return 'failed'
  const { data, error } = await supabase.from('notification_devices')
    .select('endpoint,p256dh,auth').eq('endpoint', endpoint).maybeSingle()
  if (error) return 'failed'
  if (!data) return 'expired'

  try {
    await sendPush(data, {
      title: 'Notificação de teste',
      body: 'As notificações do painel estão funcionando neste aparelho.',
      path: '/painel/notificacoes',
    }, 60, 'panel-test')
    return 'accepted'
  } catch (error) {
    if (!expiredSubscription(error)) return 'failed'
    await supabase.from('notification_devices').delete().eq('endpoint', endpoint)
    return 'expired'
  }
}

export async function saveNotificationPreferences(_previous: string, form: FormData) {
  const { supabase } = await requireUser()
  const lead = form.get('lead_minutes')
  if (lead !== '30' && lead !== '60') return 'Escolha 30 minutos ou 1 hora.'
  const { error } = await supabase.from('notification_preferences').upsert({
    upcoming: form.has('upcoming'),
    lead_minutes: Number(lead),
    pending: form.has('pending'),
    birthdays: form.has('birthdays'),
    goals: form.has('goals'),
    confirmations: form.has('confirmations'),
  }, { onConflict: 'user_id' })
  return error ? 'Não foi possível salvar as preferências.' : 'Preferências salvas.'
}
