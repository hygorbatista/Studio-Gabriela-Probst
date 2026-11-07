import 'server-only'
import { requireUser } from '@/lib/auth'
import { addMonths } from '@/lib/agenda'
import { monthStart } from '@/lib/expenses'

// Despesas de um mês: as fixas que valem no mês e as avulsas lançadas nele.
async function readMonthExpenses<Columns extends 'amount' | 'id,description,category,amount,expense_date', RecurringColumns extends 'id,amount' | 'id,description,category,amount'>(
  month: string,
  oneOffColumns: Columns,
  recurringColumns: RecurringColumns,
) {
  const { supabase } = await requireUser()
  const first = monthStart(month)

  const [recurring, oneOff, overrides] = await Promise.all([
    supabase
      .from('recurring_expenses')
      .select(recurringColumns)
      .lte('starts_on', first)
      .or(`ends_on.is.null,ends_on.gte.${first}`)
      .order(recurringColumns === 'id,amount' ? 'id' : 'description'),
    supabase
      .from('expenses')
      .select(oneOffColumns)
      .gte('expense_date', first)
      .lt('expense_date', monthStart(addMonths(month, 1)))
      .order(oneOffColumns === 'amount' ? 'id' : 'expense_date'),
    supabase.from('recurring_expense_month_overrides')
      .select('recurring_expense_id,amount,description,category')
      .eq('month', first),
  ])
  if (recurring.error) throw recurring.error
  if (oneOff.error) throw oneOff.error
  if (overrides.error) throw overrides.error
  return { recurring: recurring.data, oneOff: oneOff.data, overrides: new Map(overrides.data.map((row) => [row.recurring_expense_id, row])) }
}

function sumExpenses(rows: { amount: number }[]) {
  return rows.reduce((sum, expense) => sum + expense.amount, 0)
}

export async function getMonthExpenseTotal(month: string) {
  const { recurring, oneOff, overrides } = await readMonthExpenses(month, 'amount', 'id,amount')
  return recurring.reduce((total, row) => {
    const override = overrides.get(row.id)
    return total + (override ? override.amount ?? 0 : row.amount)
  }, sumExpenses(oneOff))
}

export async function getMonthExpenses(month: string) {
  const { recurring: base, oneOff, overrides } = await readMonthExpenses(month, 'id,description,category,amount,expense_date', 'id,description,category,amount')
  const recurring = base.flatMap((row) => {
    const override = overrides.get(row.id)
    if (!override) return [row]
    if (override.amount === null) return []
    return [{
      ...row,
      amount: override.amount,
      description: override.description ?? row.description,
      category: override.category ?? row.category,
    }]
  })
  const recurringTotal = sumExpenses(recurring)
  const oneOffTotal = sumExpenses(oneOff)

  return {
    recurring,
    oneOff,
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

export async function getRecurringExpenseOverride(id: string, month: string) {
  const { supabase } = await requireUser()
  const { data, error } = await supabase.from('recurring_expense_month_overrides')
    .select('amount,description,category')
    .eq('recurring_expense_id', id)
    .eq('month', monthStart(month))
    .maybeSingle()
  if (error) throw error
  return data
}
