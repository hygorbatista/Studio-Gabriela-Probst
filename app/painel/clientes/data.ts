import 'server-only'
import { requireUser } from '@/lib/auth'

// Busca por nome ou telefone. Sem termo, lista todas em ordem alfabética.
export async function searchClients(term: string) {
  const { supabase } = await requireUser()
  // Vírgulas e parênteses têm significado no filtro do Supabase: saem do termo.
  const text = term.replace(/[,()*%\\]/g, ' ').trim()
  const digits = text.replace(/\D/g, '')

  let query = supabase.from('clients').select('id, name, phone').order('name').limit(200)
  if (digits.length >= 3) {
    query = query.or(`name.ilike.%${text}%,phone.ilike.%${digits}%`)
  } else if (text) {
    query = query.ilike('name', `%${text}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// Cliente com o histórico de atendimentos, do mais recente para o mais antigo.
export async function getClient(id: string) {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from('clients')
    .select('*, appointments(id, starts_at, status, price_charged, services(name))')
    .eq('id', id)
    .order('starts_at', { referencedTable: 'appointments', ascending: false })
    .maybeSingle()
  if (error) throw error
  return data
}
