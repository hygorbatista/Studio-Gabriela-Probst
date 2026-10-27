import 'server-only'
import { requireUser } from '@/lib/auth'
import { addDays, dayOf, dayRange } from '@/lib/agenda'
import { clientHabits } from '@/lib/client-stats'
import { dueClients } from '@/lib/return-due'
import { busyMinutes, dayLoad, type BusyItem, type Load } from '@/lib/free-slots'

// Atendimentos de um dia (horário de Brasília), em ordem de horário.
export async function getDayAppointments(day: string) {
  const { supabase } = await requireUser()
  const { start, end } = dayRange(day)
  const { data, error } = await supabase
    .from('appointments')
    .select(
      'id, starts_at, ends_at, blocked_until, time_known, status, confirmed_at, price_charged, clients(name), services(name)'
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

// Busca de cliente na Agenda: nome ou telefone, com os atendimentos dela.
export async function searchAgenda(term: string) {
  const { supabase } = await requireUser()
  // Vírgulas e parênteses têm significado no filtro do Supabase: saem do termo.
  const text = term.replace(/[,()*%\\]/g, ' ').trim()
  const digits = text.replace(/\D/g, '')
  if (!text) return []

  let query = supabase
    .from('clients')
    .select('id, name, phone, appointments(id, starts_at, time_known, status, confirmed_at, services(name))')
    .order('name')
    .order('starts_at', { referencedTable: 'appointments' })
    .limit(20)
  query =
    digits.length >= 3
      ? query.or(`name.ilike.%${text}%,phone.ilike.%${digits}%`)
      : query.ilike('name', `%${text}%`)

  const { data, error } = await query
  if (error) throw error
  return data
}

// "Hora de voltar": clientes com o retorno chegando ou vencido e nada marcado.
export async function getReturnList() {
  const { supabase } = await requireUser()
  const [clients, settings] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, phone, appointments(starts_at, status, services(id, name, return_days))'),
    supabase.from('settings').select('inactive_days_threshold').eq('id', 1).single(),
  ])
  if (clients.error) throw clients.error
  if (settings.error) throw settings.error
  return dueClients(clients.data, settings.data.inactive_days_threshold)
}

// Agendados de um dia, para confirmar com as clientes (lembrete da véspera).
export async function getToConfirm(day: string) {
  const { supabase } = await requireUser()
  const { start, end } = dayRange(day)
  const { data, error } = await supabase
    .from('appointments')
    .select('id, starts_at, confirmed_at, clients(name, phone), services(name)')
    .eq('status', 'scheduled')
    .gte('starts_at', start)
    .lt('starts_at', end)
    .order('starts_at')
  if (error) throw error
  return data
}

// Quantos agendados há num dia e quantos faltam confirmar.
export async function getConfirmCount(day: string) {
  const list = await getToConfirm(day)
  return { total: list.length, pending: list.filter((a) => !a.confirmed_at).length }
}

// O que ocupa a agenda de "from" até "to", inclusive: atendimentos agendados e
// concluídos, e os bloqueios. Base dos horários livres e da ocupação.
export async function getBusy(from: string, to: string): Promise<BusyItem[]> {
  const { supabase } = await requireUser()
  const range = { start: dayRange(from).start, end: dayRange(to).end }
  const [appointments, blocks] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, starts_at, ends_at, blocked_until, time_known, status, confirmed_at, clients(name), services(name)')
      .in('status', ['scheduled', 'completed'])
      .gte('starts_at', range.start)
      .lt('starts_at', range.end),
    getBlocks(range.start, range.end),
  ])
  if (appointments.error) throw appointments.error

  const items: BusyItem[] = appointments.data.map((a) => ({
    id: a.id,
    kind: 'appointment',
    starts_at: a.starts_at,
    ends_at: a.ends_at,
    blocked_until: a.blocked_until,
    time_known: a.time_known,
    status: a.status,
    confirmed: !!a.confirmed_at,
    client: a.clients?.name ?? null,
    service: a.services?.name ?? null,
  }))
  return [...items, ...blocks].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
}

// Bloqueios que começam entre dois momentos, no mesmo formato dos atendimentos.
// O motivo vai em "service", que é o texto que a agenda mostra embaixo.
async function getBlocks(start: string, end: string): Promise<BusyItem[]> {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from('time_blocks')
    .select('id, starts_at, ends_at, reason')
    .gte('starts_at', start)
    .lt('starts_at', end)
  if (error) throw error
  return data.map((b) => ({
    id: b.id,
    kind: 'block',
    starts_at: b.starts_at,
    ends_at: b.ends_at,
    blocked_until: b.ends_at,
    time_known: true,
    status: 'block',
    confirmed: false,
    client: null,
    service: b.reason,
  }))
}

// Bloqueios de um dia, para a agenda do dia.
export async function getDayBlocks(day: string) {
  const { start, end } = dayRange(day)
  return getBlocks(start, end)
}

export type DaySummary = { count: number; minutes: number; load: Load; blocked: boolean }

// Por dia: quantos atendimentos e quanto do dia está ocupado. Lançamentos
// "sem horário" contam como atendimento, mas não ocupam a agenda. Bloqueios
// ocupam a agenda, mas não contam como atendimento.
export function summarizeDays(items: BusyItem[]) {
  const byDay = new Map<string, BusyItem[]>()
  for (const a of items) {
    const day = dayOf(a.starts_at)
    byDay.set(day, [...(byDay.get(day) ?? []), a])
  }
  const days = new Map<string, DaySummary>()
  for (const [day, list] of byDay) {
    const minutes = busyMinutes(day, list.filter((a) => a.time_known))
    days.set(day, {
      count: list.filter((a) => a.kind === 'appointment').length,
      minutes,
      load: dayLoad(minutes),
      blocked: list.some((a) => a.kind === 'block'),
    })
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
