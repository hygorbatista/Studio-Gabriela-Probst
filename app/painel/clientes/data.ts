import 'server-only'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'

// Busca por nome ou telefone. Sem termo, lista todas em ordem alfabética.
export async function searchClients(term: string, page = 1) {
  const { supabase } = await requireUser()
  // Vírgulas e parênteses têm significado no filtro do Supabase: saem do termo.
  const text = term.replace(/[,()*%\\]/g, ' ').trim()
  const digits = text.replace(/\D/g, '')

  // Os atendimentos vêm junto para a linha "Próximo..." / "Última visita...".
  let query = supabase
    .from('clients')
    .select('id, name, phone, upcoming:appointments(starts_at, status), last_visit:appointments(starts_at, status)')
    .eq('upcoming.status', 'scheduled')
    .gte('upcoming.starts_at', new Date().toISOString())
    .order('starts_at', { referencedTable: 'upcoming' })
    .limit(1, { referencedTable: 'upcoming' })
    .eq('last_visit.status', 'completed')
    .order('starts_at', { referencedTable: 'last_visit', ascending: false })
    .limit(1, { referencedTable: 'last_visit' })
    .order('name').order('id')
    .range((page - 1) * 40, page * 40)
  if (digits.length >= 3) {
    query = query.or(`name.ilike.%${text}%,phone.ilike.%${digits}%`)
  } else if (text) {
    query = query.ilike('name', `%${text}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return {
    clients: data.slice(0, 40).map((client) => ({ ...client, appointments: [...client.upcoming, ...client.last_visit] })),
    hasMore: data.length > 40,
  }
}

// Cliente com o histórico de atendimentos, do mais recente para o mais antigo.
export async function getClient(id: string) {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getClientHistory(id: string, page: number) {
  const { supabase } = await requireUser()
  const { data, error } = await supabase.from('appointments')
    .select('id, starts_at, time_known, status, price_charged, services_label, services(name)')
    .eq('client_id', id).order('starts_at', { ascending: false }).order('id', { ascending: false })
    .range((page - 1) * 20, page * 20)
  if (error) throw error
  return { appointments: data.slice(0, 20), hasMore: data.length > 20 }
}

const statsSchema = z.object({
  visits: z.number(), totalSpent: z.number(), averageTicket: z.number(),
  lastVisit: z.string().nullable(), nextVisit: z.string().nullable(),
  favoriteService: z.string().nullable(), favoriteTime: z.string().nullable(),
})

export async function getClientStats(id: string) {
  const { supabase } = await requireUser()
  const { data, error } = await supabase.rpc('client_statistics', { p_client_id: id })
  if (error) throw error
  return statsSchema.parse(data)
}
