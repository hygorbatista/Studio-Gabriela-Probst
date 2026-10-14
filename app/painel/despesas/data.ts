import 'server-only'
import { requireUser } from '@/lib/auth'
import { addMonths } from '@/lib/agenda'
import { monthStart } from '@/lib/expenses'

// Despesas de um mês: as fixas que valem no mês e as avulsas lançadas nele.
export async function getMonthExpenses(month: string) {
  const { supabase } = await requireUser()
  const first = monthStart(month)

  const [recurring, oneOff] = await Promise.all([
    supabase
      .from('recurring_expenses')
      .select('*')
      .lte('starts_on', first)
      .or(`ends_on.is.null,ends_on.gte.${first}`)
      .order('description'),
    supabase
      .from('expenses')
      .select('*')
      .gte('expense_date', first)
      .lt('expense_date', monthStart(addMonths(month, 1)))
      .order('expense_date'),
  ])
  if (recurring.error) throw recurring.error
  if (oneOff.error) throw oneOff.error

  const recurringTotal = recurring.data.reduce((sum, e) => sum + e.amount, 0)
  const oneOffTotal = oneOff.data.reduce((sum, e) => sum + e.amount, 0)

  return {
    recurring: recurring.data,
    oneOff: oneOff.data,
    recurringTotal,
    oneOffTotal,
    total: recurringTotal + oneOffTotal,
  }
}

export async function getExpense(id: string) {
  const { supabase } = await requireUser()
  const { data, error } = await supabase.from('expenses').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function getRecurringExpense(id: string) {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}
