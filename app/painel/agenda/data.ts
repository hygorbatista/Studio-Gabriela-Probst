import 'server-only'
import { requireUser } from '@/lib/auth'
import { addDays, dayOf, dayRange } from '@/lib/agenda'
import { clientHabits } from '@/lib/client-stats'
import { busyMinutes, dayLoad, type BusyItem, type Load } from '@/lib/free-slots'

// Atendimentos de um dia (horário de Brasília), em ordem de horário.
export async function getDayAppointments(day: string) {
  const { supabase } = await requireUser()
  const { start, end } = dayRange(day)
  const { data, error } = await supabase
    .from('appointments')
    .select(
      'id, starts_at, ends_at, blocked_until, time_known, status, price_charged, clients(name), services(name)'
    )
    .gte('starts_at', start)
    .lt('starts_at', end)
    .order('starts_at')
  if (error) throw error
  return data
}

export async function getAppointment(id: string) {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from('appointments')
    .select('*, clients(id, name, phone), services(id, name, return_days), payments(amount, method)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

// Próximo horário já marcado da cliente depois de um momento: se existe, o
// retorno já está agendado.
export async function getNextScheduled(clientId: string, after: string) {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from('appointments')
    .select('id, starts_at')
    .eq('client_id', clientId)
    .eq('status', 'scheduled')
    .gt('starts_at', after)
    .order('starts_at')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

// Clientes e serviços ativos para o formulário de agendamento.
export async function getFormOptions() {
  const { supabase } = await requireUser()
  const [clients, services] = await Promise.all([
    supabase.from('clients').select('id, name, phone').order('name'),
    supabase
      .from('services')
      .select('id, name, price, duration_minutes, duration_up_to')
      .eq('active', true)
      .order('sort_order'),
  ])
  if (clients.error) throw clients.error
  if (services.error) throw services.error
  return { clients: clients.data, services: services.data }
}

// Atendimentos que ocupam a agenda (agendados e concluídos) de "from" até "to",
// inclusive, numa consulta só. Base dos horários livres e da ocupação.
export async function getBusy(from: string, to: string): Promise<BusyItem[]> {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from('appointments')
    .select('id, starts_at, ends_at, blocked_until, time_known, status, clients(name), services(name)')
    .in('status', ['scheduled', 'completed'])
    .gte('starts_at', dayRange(from).start)
    .lt('starts_at', dayRange(to).end)
    .order('starts_at')
  if (error) throw error
  return data.map((a) => ({
    id: a.id,
    starts_at: a.starts_at,
    ends_at: a.ends_at,
    blocked_until: a.blocked_until,
    time_known: a.time_known,
    status: a.status,
    client: a.clients?.name ?? null,
    service: a.services?.name ?? null,
  }))
}

export type DaySummary = { count: number; minutes: number; load: Load }

// Por dia: quantos atendimentos e quanto do dia está ocupado. Lançamentos
// "sem horário" contam como atendimento, mas não ocupam a agenda.
export function summarizeDays(items: BusyItem[]) {
  const byDay = new Map<string, BusyItem[]>()
  for (const a of items) {
    const day = dayOf(a.starts_at)
    byDay.set(day, [...(byDay.get(day) ?? []), a])
  }
  const days = new Map<string, DaySummary>()
  for (const [day, list] of byDay) {
    const minutes = busyMinutes(day, list.filter((a) => a.time_known))
    days.set(day, { count: list.length, minutes, load: dayLoad(minutes) })
  }
  return days
}

// Resumo de cada dia da semana que começa em "start".
export async function getWeekSummary(start: string) {
  return summarizeDays(await getBusy(start, addDays(start, 6)))
}

// Intervalo depois de cada atendimento (configurações).
export async function getBufferMinutes() {
  const { supabase } = await requireUser()
  const { data, error } = await supabase.from('settings').select('buffer_minutes').eq('id', 1).single()
  if (error) throw error
  return data.buffer_minutes
}

// Serviço e hora de costume de cada cliente, a partir do último ano.
export async function getClientHabits() {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from('appointments')
    .select('client_id, service_id, starts_at, time_known')
    .eq('status', 'completed')
    .gte('starts_at', new Date(Date.now() - 365 * 86400000).toISOString())
    .order('starts_at', { ascending: false })
  if (error) throw error
  return clientHabits(data)
}
