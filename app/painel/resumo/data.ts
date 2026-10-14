import 'server-only'
import { requireUser } from '@/lib/auth'
import { addMonths, monthRange } from '@/lib/agenda'

// Pagamentos e atendimentos do mês, faturamento do mês anterior e as metas.
export async function getMonthData(month: string) {
  const { supabase } = await requireUser()
  const { start, end } = monthRange(month)
  const previous = monthRange(addMonths(month, -1))

  const [payments, appointments, previousPayments, settings] = await Promise.all([
    supabase
      .from('payments')
      .select('amount, method, appointments(clients(id, name), services(name))')
      .gte('paid_at', start)
      .lt('paid_at', end),
    supabase
      .from('appointments')
      .select('status, price_charged, starts_at')
      .gte('starts_at', start)
      .lt('starts_at', end),
    supabase
      .from('payments')
      .select('amount')
      .gte('paid_at', previous.start)
      .lt('paid_at', previous.end),
    supabase
      .from('settings')
      .select('monthly_revenue_goal, monthly_appointments_goal')
      .eq('id', 1)
      .single(),
  ])

  for (const result of [payments, appointments, previousPayments, settings]) {
    if (result.error) throw result.error
  }

  return {
    payments: payments.data!,
    appointments: appointments.data!,
    previousRevenue: previousPayments.data!.reduce((sum, p) => sum + p.amount, 0),
    goals: settings.data!,
  }
}
