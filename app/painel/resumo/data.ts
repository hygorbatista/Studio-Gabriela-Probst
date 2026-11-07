import 'server-only'
import { requireUser } from '@/lib/auth'
import { addMonths, monthRange } from '@/lib/agenda'

// Pagamentos e atendimentos do mês, e metas.
export async function getMonthData(month: string) {
  const { supabase } = await requireUser()
  const { start, end } = monthRange(month)

  const [payments, appointments, settings] = await Promise.all([
    supabase
      .from('payments')
      .select(
        'amount, method, appointments(clients(id, name), services(name), appointment_services(price, services(name)))'
      )
      .gte('paid_at', start)
      .lt('paid_at', end),
    supabase
      .from('appointments')
      .select('status, price_charged, starts_at')
      .gte('starts_at', start)
      .lt('starts_at', end),
    supabase
      .from('settings')
      .select('monthly_revenue_goal, monthly_appointments_goal')
      .eq('id', 1)
      .single(),
  ])

  for (const result of [payments, appointments, settings]) {
    if (result.error) throw result.error
  }

  return {
    payments: payments.data!,
    appointments: appointments.data!,
    goals: settings.data!,
  }
}

export async function getPreviousRevenue(month: string) {
  const { supabase } = await requireUser()
  const { start, end } = monthRange(addMonths(month, -1))
  const { data, error } = await supabase.from('payments')
    .select('amount')
    .gte('paid_at', start)
    .lt('paid_at', end)
  if (error) throw error
  return data.reduce((sum, payment) => sum + payment.amount, 0)
}
