// Números do mês, calculados a partir dos pagamentos e atendimentos.
// Função pura: recebe os dados e devolve os totais, sem acessar o banco.

import { paymentMethodLabels } from '@/lib/format'

type Payment = { amount: number; method: string }
type Appointment = { status: string; price_charged: number; starts_at: string }
type Goals = { monthly_revenue_goal: number; monthly_appointments_goal: number }

export function monthSummary({
  payments,
  appointments,
  previousRevenue,
  expenses = 0,
  goals,
  now = new Date(),
}: {
  payments: Payment[]
  appointments: Appointment[]
  previousRevenue: number
  // Total de despesas do mês (fixas + avulsas).
  expenses?: number
  goals: Goals
  now?: Date
}) {
  const revenue = payments.reduce((sum, p) => sum + p.amount, 0)
  const completed = appointments.filter((a) => a.status === 'completed').length
  // O que ainda está marcado daqui para frente no mês.
  const upcoming = appointments.filter(
    (a) => a.status === 'scheduled' && new Date(a.starts_at) >= now
  )
  // Já passaram e continuam "agendados": a Gabriela esqueceu de concluir.
  // Sem concluir, o valor não entra no faturamento.
  const pending = appointments.filter(
    (a) => a.status === 'scheduled' && new Date(a.starts_at) < now
  )

  const byMethod = Object.keys(paymentMethodLabels)
    .map((method) => ({
      method,
      label: paymentMethodLabels[method],
      total: payments.filter((p) => p.method === method).reduce((sum, p) => sum + p.amount, 0),
    }))
    .filter((m) => m.total > 0)

  const revenueGoal = goals.monthly_revenue_goal
  const visitsGoal = goals.monthly_appointments_goal

  return {
    revenue,
    expenses,
    // Quanto sobrou: entrou − saiu.
    profit: revenue - expenses,
    revenueGoal,
    revenueProgress: revenueGoal > 0 ? revenue / revenueGoal : 0,
    revenueMissing: Math.max(revenueGoal - revenue, 0),
    completed,
    visitsGoal,
    visitsProgress: visitsGoal > 0 ? completed / visitsGoal : 0,
    visitsMissing: Math.max(visitsGoal - completed, 0),
    averageTicket: completed > 0 ? revenue / completed : 0,
    upcomingCount: upcoming.length,
    upcomingValue: upcoming.reduce((sum, a) => sum + a.price_charged, 0),
    pendingCount: pending.length,
    // Horário do mais antigo, para levar direto à agenda daquele dia.
    firstPendingAt: pending.map((a) => a.starts_at).sort()[0],
    noShows: appointments.filter((a) => a.status === 'no_show').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    byMethod,
    previousRevenue,
    // null quando o mês anterior não teve faturamento (não dá para comparar).
    change: previousRevenue > 0 ? (revenue - previousRevenue) / previousRevenue : null,
  }
}
