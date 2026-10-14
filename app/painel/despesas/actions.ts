'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { addMonths, isValidDay, isValidMonth, monthISO } from '@/lib/agenda'
import { expenseCategories, monthStart, type ExpenseCategory } from '@/lib/expenses'
import { parseMoney } from '@/lib/format'
import type { ActionState } from '../action-button'

const idSchema = z.uuid()

const baseSchema = {
  description: z.string().trim().min(1, 'Informe a descrição.').max(80, 'Use até 80 caracteres.'),
  category: z.enum(Object.keys(expenseCategories) as [ExpenseCategory], {
    error: 'Escolha a categoria.',
  }),
  amount: z.preprocess(
    parseMoney,
    z.number({ error: 'Informe o valor.' }).min(0, 'O valor não pode ser negativo.').max(100000)
  ),
}

export type ExpenseFormState = {
  message?: string
  errors?: Record<string, string[] | undefined>
  values?: Record<string, string>
} | null

function formValues(formData: FormData) {
  return Object.fromEntries([...formData.entries()].map(([k, v]) => [k, String(v)]))
}

// Avulsas ----------------------------------------------------------------------

const expenseSchema = z.object({
  ...baseSchema,
  expense_date: z.string().refine(isValidDay, 'Data inválida.'),
})

export async function saveExpense(
  id: string | null,
  _prev: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const { supabase } = await requireUser()
  const values = formValues(formData)
  const parsed = expenseSchema.safeParse(values)
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values }

  if (id && !idSchema.safeParse(id).success) return { message: 'Despesa inválida.', values }
  const { error } = id
    ? await supabase.from('expenses').update(parsed.data).eq('id', id)
    : await supabase.from('expenses').insert(parsed.data)
  if (error) return { message: 'Não foi possível salvar. Tente de novo.', values }

  redirect(`/painel/despesas?m=${parsed.data.expense_date.slice(0, 7)}`)
}

export async function deleteExpense(id: string): Promise<ActionState> {
  const { supabase } = await requireUser()
  if (!idSchema.safeParse(id).success) return { message: 'Despesa inválida.' }

  const { data, error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .select('expense_date')
    .maybeSingle()
  if (error || !data) return { message: 'Não foi possível excluir. Tente de novo.' }

  redirect(`/painel/despesas?m=${data.expense_date.slice(0, 7)}`)
}

// Fixas ------------------------------------------------------------------------

const recurringSchema = z.object({
  ...baseSchema,
  // Só no cadastro: "AAAA-MM" do campo de mês.
  starts_month: z.string().refine(isValidMonth, 'Mês inválido.').optional(),
})

export async function saveRecurringExpense(
  id: string | null,
  _prev: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const { supabase } = await requireUser()
  const values = formValues(formData)
  const parsed = recurringSchema.safeParse(values)
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values }
  const { starts_month, ...data } = parsed.data
  const current = monthStart(monthISO())

  if (!id) {
    const { error } = await supabase
      .from('recurring_expenses')
      .insert({ ...data, starts_on: monthStart(starts_month ?? monthISO()) })
    if (error) return { message: 'Não foi possível salvar. Tente de novo.', values }
    redirect('/painel/despesas')
  }

  if (!idSchema.safeParse(id).success) return { message: 'Despesa inválida.', values }
  const { data: existing, error: readError } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (readError || !existing) return { message: 'Despesa não encontrada.', values }
  if (existing.ends_on && existing.ends_on < current) {
    return { message: 'Esta despesa já foi encerrada e não pode ser alterada.', values }
  }

  if (existing.starts_on >= current) {
    // Ainda não entrou em nenhum mês passado: pode alterar direto.
    const { error } = await supabase.from('recurring_expenses').update(data).eq('id', id)
    if (error) return { message: 'Não foi possível salvar. Tente de novo.', values }
  } else {
    // Já valeu em meses passados: encerra a versão antiga no mês anterior e cria
    // a nova a partir deste mês, para o passado não mudar.
    const previous = monthStart(addMonths(monthISO(), -1))
    const { error: endError } = await supabase
      .from('recurring_expenses')
      .update({ ends_on: previous })
      .eq('id', id)
    if (endError) return { message: 'Não foi possível salvar. Tente de novo.', values }

    const { error } = await supabase
      .from('recurring_expenses')
      .insert({ ...data, starts_on: current, ends_on: existing.ends_on })
    if (error) {
      // Desfaz o encerramento para não perder a despesa.
      await supabase.from('recurring_expenses').update({ ends_on: existing.ends_on }).eq('id', id)
      return { message: 'Não foi possível salvar. Tente de novo.', values }
    }
  }

  redirect('/painel/despesas')
}

// Parar de cobrar: este mês ainda conta, os próximos não.
export async function endRecurringExpense(id: string): Promise<ActionState> {
  const { supabase } = await requireUser()
  if (!idSchema.safeParse(id).success) return { message: 'Despesa inválida.' }
  const current = monthStart(monthISO())

  const { data: existing } = await supabase
    .from('recurring_expenses')
    .select('starts_on')
    .eq('id', id)
    .maybeSingle()
  if (!existing) return { message: 'Despesa não encontrada.' }

  // Começaria só no futuro: nunca contou, então pode ser apagada.
  const { error } =
    existing.starts_on > current
      ? await supabase.from('recurring_expenses').delete().eq('id', id)
      : await supabase.from('recurring_expenses').update({ ends_on: current }).eq('id', id)
  if (error) return { message: 'Não foi possível encerrar. Tente de novo.' }

  redirect('/painel/despesas')
}
