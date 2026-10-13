import 'server-only'
import { requireUser } from '@/lib/auth'
import { dayRange } from '@/lib/agenda'

// Atendimentos de um dia (horário de Brasília), em ordem de horário.
export async function getDayAppointments(day: string) {
  const { supabase } = await requireUser()
  const { start, end } = dayRange(day)
  const { data, error } = await supabase
    .from('appointments')
    .select('id, starts_at, ends_at, status, price_charged, clients(name), services(name)')
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
    .select('*, clients(id, name, phone), services(name), payments(amount, method)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

// Clientes e serviços ativos para o formulário de agendamento.
export async function getFormOptions() {
  const { supabase } = await requireUser()
  const [clients, services] = await Promise.all([
    supabase.from('clients').select('id, name').order('name'),
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
