'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { normalizePhone } from '@/lib/phone'
import type { DeleteState } from '../delete-button'

const clientSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(80, 'Use até 80 caracteres.'),
  // Opcional: vazio vira null; preenchido precisa ser um celular ou fixo com DDD.
  phone: z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === '') return null
      const phone = normalizePhone(v)
      if (!phone) {
        ctx.addIssue({ code: 'custom', message: 'Telefone inválido. Use DDD + número.' })
        return z.NEVER
      }
      return phone
    }),
  // Opcional. O campo de data do navegador envia "AAAA-MM-DD".
  birth_date: z
    .string()
    .trim()
    .refine(
      (v) =>
        v === '' ||
        (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
          v >= '1900-01-01' &&
          v <= new Date().toISOString().slice(0, 10)),
      'Data inválida.'
    )
    .transform((v) => v || null),
  preferences: z
    .string()
    .trim()
    .max(1000, 'Use até 1000 caracteres.')
    .transform((v) => v || null),
})

type Fields = keyof z.input<typeof clientSchema>

export type ClientFormState = {
  message?: string
  errors?: Partial<Record<Fields, string[]>>
  values?: Record<string, string>
} | null

const idSchema = z.uuid()

export async function saveClient(
  id: string | null,
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const { supabase } = await requireUser()

  const values = Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, String(v)])
  )
  const parsed = clientSchema.safeParse(values)
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values }
  }

  let clientId = id
  if (id) {
    if (!idSchema.safeParse(id).success) return { message: 'Cliente inválida.', values }
    const { error } = await supabase.from('clients').update(parsed.data).eq('id', id)
    if (error) return { message: 'Não foi possível salvar. Tente de novo.', values }
  } else {
    const { data, error } = await supabase
      .from('clients')
      .insert(parsed.data)
      .select('id')
      .single()
    if (error) return { message: 'Não foi possível salvar. Tente de novo.', values }
    clientId = data.id
  }

  redirect(`/painel/clientes/${clientId}`)
}

// Só exclui cliente sem atendimentos; com histórico, o banco recusa (on delete restrict).
export async function deleteClient(id: string): Promise<DeleteState> {
  const { supabase } = await requireUser()
  if (!idSchema.safeParse(id).success) return { message: 'Cliente inválida.' }

  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error?.code === '23001' || error?.code === '23503') {
    return {
      message: 'Esta cliente já tem atendimentos e não pode ser excluída, para não apagar o histórico.',
    }
  }
  if (error) return { message: 'Não foi possível excluir. Tente de novo.' }

  redirect('/painel/clientes')
}
