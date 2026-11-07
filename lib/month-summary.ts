// Números do mês, calculados a partir dos pagamentos e atendimentos.
// Função pura: recebe os dados e devolve os totais, sem acessar o banco.

import { paymentMethodLabels } from '@/lib/format'

type Payment = { amount: number; method: string }
type Appointment = { status: string; price_charged: number; starts_at: string }
type Goals = { monthly_revenue_goal: number; monthly_appointments_goal: number }

export function monthSummary({
  payments,
  appointments,
  expenses = 0,
  goals,
  now = new Date(),
}: {
  payments: Payment[]
  appointments: Appointment[]
  // Total de despesas do mês (fixas + avulsas).
  expenses?: number
  goals: Goals
  now?: Date
}) {
  let revenue = 0
  const totalsByMethod = new Map<string, number>()
  for (const { amount, method } of payments) {
    revenue += amount
    totalsByMethod.set(method, (totalsByMethod.get(method) ?? 0) + amount)
  }

  let completed = 0
  let noShows = 0
  let cancelled = 0
  let upcomingCount = 0
  let upcomingValue = 0
  let pendingCount = 0
  let pendingValue = 0
  let firstPendingAt: string | undefined
  let firstPendingTime = Infinity
  const nowTime = now.getTime()

  for (const appointment of appointments) {
    switch (appointment.status) {
      case 'completed':
        completed++
        break
      case 'no_show':
        noShows++
        break
      case 'cancelled':
        cancelled++
        break
      case 'scheduled': {
        const time = Date.parse(appointment.starts_at)
        if (time >= nowTime) {
          upcomingCount++
          upcomingValue += appointment.price_charged
        } else if (time < nowTime) {
          pendingCount++
          pendingValue += appointment.price_charged
          if (time < firstPendingTime) {
            firstPendingTime = time
            firstPendingAt = appointment.starts_at
          }
        }
        break
      }
    }
  }

  const byMethod = Object.keys(paymentMethodLabels)
    .map((method) => ({
      method,
      label: paymentMethodLabels[method],
      total: totalsByMethod.get(method) ?? 0,
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
    upcomingCount,
    upcomingValue,
    pendingCount,
    pendingValue,
    firstPendingAt,
    noShows,
    cancelled,
    byMethod,
  }
}
