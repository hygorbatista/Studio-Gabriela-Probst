import 'server-only'
import { cache } from 'react'
import { requireUser } from '@/lib/auth'
import { addDays, dayOf, dayRange, groupByDay } from '@/lib/agenda'
import { clientHabits } from '@/lib/client-stats'
import { dueClients } from '@/lib/return-due'
import { busyMinutes, dayLoad, type BusyItem, type Load } from '@/lib/free-slots'
import { serviceLabel } from '@/lib/format'

// Atendimentos de um dia (horário de Brasília), em ordem de horário.
export async function getDayAppointments(day: string) {
  return getAppointmentsRange(day, day)
}

async function getAppointmentsRange(from: string, to: string) {
  const { supabase } = await requireUser()
  const start = dayRange(from).start
  const end = dayRange(to).end
  const { data, error } = await supabase
    .from('appointments')
    .select(
      'id, starts_at, ends_at, blocked_until, time_known, status, confirmed_at, price_charged, services_label, clients(name), services(name)'
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
    .select(
      '*, clients(id, name, phone), services(id, name, return_days), payments(amount, method), appointment_services(service_id, position, price, services(name, return_days))'
    )
    .order('position', { referencedTable: 'appointment_services' })
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

// Servicos ativos, sem carregar clientes nos fluxos que nao precisam delas.
export async function getServiceOptions() {
  const { supabase } = await requireUser()
  const { data, error } = await supabase.from('services')
    .select('id, name, price, promo_price, promo_until, duration_minutes, duration_up_to')
    .eq('active', true).order('sort_order')
  if (error) throw error
  return data
}

export async function getFormOptions(clientId?: string) {
  const { supabase } = await requireUser()
  const [clients, services] = await Promise.all([
    clientId ? supabase.from('clients').select('id, name, phone').eq('id', clientId) : Promise.resolve({ data: [], error: null }),
    getServiceOptions(),
  ])
  if (clients.error) throw clients.error
  return { clients: clients.data, services }
}

// Para o Editar: clientes, serviços ativos e os desativados que já estão no
// atendimento (para não sumirem ao salvar).
export async function getEditOptions(currentServiceIds: string[], clientId?: string) {
  const { supabase } = await requireUser()
  const ids = currentServiceIds.length ? currentServiceIds.join(',') : '00000000-0000-0000-0000-000000000000'
  const [clients, services] = await Promise.all([
    clientId ? supabase.from('clients').select('id, name, phone').eq('id', clientId) : Promise.resolve({ data: [], error: null }),
    supabase
      .from('services')
      .select('id, name, price, promo_price, promo_until, duration_minutes, duration_up_to, active')
      .or(`active.eq.true,id.in.(${ids})`)
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
    .select(
      'id, name, phone, upcoming:appointments(id, starts_at, time_known, status, confirmed_at, services_label, services(name)), last_visit:appointments(id, starts_at, time_known, status, confirmed_at, services_label, services(name))'
    )
    .order('name')
    .eq('upcoming.status', 'scheduled')
    .gte('upcoming.starts_at', new Date().toISOString())
    .order('starts_at', { referencedTable: 'upcoming' })
    .eq('last_visit.status', 'completed')
    .order('starts_at', { referencedTable: 'last_visit', ascending: false })
    .limit(1, { referencedTable: 'last_visit' })
    .limit(20)
  query =
    digits.length >= 3
      ? query.or(`name.ilike.%${text}%,phone.ilike.%${digits}%`)
      : query.ilike('name', `%${text}%`)

  const { data, error } = await query
  if (error) throw error
  return data.map((client) => ({ ...client, appointments: [...client.last_visit, ...client.upcoming] }))
}

// "Hora de voltar": clientes com o retorno chegando ou vencido e nada marcado.
// Só os atendimentos dos últimos 400 dias (abre a Agenda toda vez; não precisa
// carregar o histórico inteiro). Quem não vem há mais que isso não aparece.
export const getReturnList = cache(async () => {
  const { supabase } = await requireUser()
  const now = new Date()
  const since = new Date(now.getTime() - 400 * 86400000).toISOString()
  const [clients, settings] = await Promise.all([
    supabase.from('clients').select(
      'id, name, phone, last_visit:appointments!inner(starts_at, status, services(id, name, return_days), appointment_services(position, services(id, name, return_days))), upcoming:appointments(starts_at, status)'
    )
      .gte('last_visit.starts_at', since)
      .in('last_visit.status', ['scheduled', 'completed'])
      .order('starts_at', { referencedTable: 'last_visit', ascending: false })
      .limit(1, { referencedTable: 'last_visit' })
      .eq('upcoming.status', 'scheduled')
      .gte('upcoming.starts_at', now.toISOString())
      .order('starts_at', { referencedTable: 'upcoming' })
      .limit(1, { referencedTable: 'upcoming' }),
    supabase.from('settings').select('inactive_days_threshold').eq('id', 1).single(),
  ])
  if (clients.error) throw clients.error
  if (settings.error) throw settings.error
  return dueClients(clients.data.map((client) => ({
    ...client,
    appointments: [
      ...client.last_visit,
      ...client.upcoming.map((visit) => ({ ...visit, services: null, appointment_services: [] })),
    ],
  })), settings.data.inactive_days_threshold, now)
})

// Agendados de um dia, para confirmar com as clientes (lembrete da véspera).
export async function getToConfirm(day: string) {
  const { supabase } = await requireUser()
  const { start, end } = dayRange(day)
  const { data, error } = await supabase
    .from('appointments')
    .select('id, starts_at, confirmed_at, services_label, clients(name, phone), services(name)')
    .eq('status', 'scheduled')
    .gte('starts_at', start)
    .lt('starts_at', end)
    .order('starts_at')
  if (error) throw error
  return data
}

// Quantos agendados há num dia e quantos faltam confirmar.
export async function getConfirmCount(day: string) {
  const { supabase } = await requireUser()
  const { start, end } = dayRange(day)
  const { data, error } = await supabase.from('appointments').select('confirmed_at')
    .eq('status', 'scheduled').gte('starts_at', start).lt('starts_at', end)
  if (error) throw error
  return { total: data.length, pending: data.filter((a) => !a.confirmed_at).length }
}

// O que ocupa a agenda de "from" até "to", inclusive: atendimentos agendados e
// concluídos, e os bloqueios. Base dos horários livres e da ocupação.
export async function getBusy(from: string, to: string): Promise<BusyItem[]> {
  const { supabase } = await requireUser()
  const range = { start: dayRange(from).start, end: dayRange(to).end }
  const [appointments, blocks] = await Promise.all([
    supabase
      .from('appointments')
      .select(
        'id, starts_at, ends_at, blocked_until, time_known, status, confirmed_at, services_label, clients(name), services(name)'
      )
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
    service: serviceLabel(a),
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
  const byDay = groupByDay(items)
  const days = new Map<string, DaySummary>()
  for (const [day, list] of byDay) {
    const minutes = busyMinutes(day, list.filter((a) => a.time_known))
    const count = list.filter((a) => a.kind === 'appointment').length
    // Cheio: 3 atendimentos, ou um bloqueio longo (folga).
    const blockMinutes = busyMinutes(day, list.filter((a) => a.kind === 'block'))
    days.set(day, {
      count,
      minutes,
      load: dayLoad(count, blockMinutes),
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
export async function getClientHabits(clientId: string) {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from('appointments')
    .select('client_id, service_id, starts_at, time_known, appointment_services(service_id, position)')
    .eq('status', 'completed')
    .eq('client_id', clientId)
    .gte('starts_at', new Date(Date.now() - 365 * 86400000).toISOString())
    .order('starts_at', { ascending: false })
  if (error) throw error
  return clientHabits(data)
}

// Uma base semanal para a lista do dia e os indicadores, preservando todos os status.
export async function getDayAgenda(day: string, start: string) {
  const end = addDays(start, 6)
  const [appointments, blocks] = await Promise.all([
    getAppointmentsRange(start, end),
    getBlocks(dayRange(start).start, dayRange(end).end),
  ])
  const active: BusyItem[] = appointments
    .filter((a) => a.status === 'scheduled' || a.status === 'completed')
    .map((a) => ({
      ...a, kind: 'appointment', confirmed: !!a.confirmed_at,
      client: a.clients?.name ?? null, service: serviceLabel(a),
    }))
  return {
    appointments: appointments.filter((a) => dayOf(a.starts_at) === day),
    blocks: blocks.filter((b) => dayOf(b.starts_at) === day),
    week: summarizeDays([...active, ...blocks]),
  }
}
