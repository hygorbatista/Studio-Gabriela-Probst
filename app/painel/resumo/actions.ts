'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { isValidMonth } from '@/lib/agenda'
import { parseMoney } from '@/lib/format'

const goalsSchema = z.object({
  monthly_revenue_goal: z.preprocess(
    parseMoney,
    z.number({ error: 'Informe a meta.' }).min(0, 'A meta não pode ser negativa.').max(1000000)
  ),
  monthly_appointments_goal: z.coerce
    .number({ error: 'Informe a meta.' })
    .int('Use um número inteiro.')
    .min(0, 'A meta não pode ser negativa.')
    .max(1000),
})

export type GoalsState = {
  message?: string
  errors?: Partial<Record<keyof z.input<typeof goalsSchema>, string[]>>
} | null

export async function saveGoals(
  month: string,
  _prev: GoalsState,
  formData: FormData
): Promise<GoalsState> {
  const { supabase } = await requireUser()

  const parsed = goalsSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors }

  const { error } = await supabase.from('settings').update(parsed.data).eq('id', 1)
  if (error) return { message: 'Não foi possível salvar. Tente de novo.' }

  redirect(isValidMonth(month) ? `/painel/resumo?m=${month}` : '/painel/resumo')
}
