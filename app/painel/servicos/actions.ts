'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { SERVICES_TAG } from '@/lib/services'

// Aceita "180", "180,50", "R$ 1.234,50".
function parsePrice(raw: unknown) {
  let text = String(raw ?? '').replace(/[^\d,.]/g, '')
  if (text.includes(',')) text = text.replace(/\./g, '').replace(',', '.')
  return text === '' ? undefined : Number(text)
}

const serviceSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(80, 'Use até 80 caracteres.'),
  category: z.string().trim().min(1, 'Informe a categoria.').max(40, 'Use até 40 caracteres.'),
  price: z.preprocess(
    parsePrice,
    z.number({ error: 'Informe o valor.' }).min(0, 'O valor não pode ser negativo.').max(10000, 'Valor alto demais.')
  ),
  duration_minutes: z.coerce
    .number({ error: 'Escolha a duração.' })
    .int()
    .min(15, 'Escolha a duração.')
    .max(600),
  duration_up_to: z.preprocess((v) => v === 'on', z.boolean()),
})

type Fields = keyof z.infer<typeof serviceSchema>

export type ServiceFormState = {
  message?: string
  errors?: Partial<Record<Fields, string[]>>
  // Devolve o que foi digitado, para o formulário não apagar tudo em caso de erro.
  values?: Record<string, string>
} | null

const idSchema = z.uuid()

export async function saveService(
  id: string | null,
  _prev: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const { supabase } = await requireUser()

  const values = Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, String(v)])
  )
  const parsed = serviceSchema.safeParse(values)
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values }
  }

  if (id) {
    if (!idSchema.safeParse(id).success) return { message: 'Serviço inválido.', values }
    const { error } = await supabase.from('services').update(parsed.data).eq('id', id)
    if (error) return { message: 'Não foi possível salvar. Tente de novo.', values }
  } else {
    // Novo serviço entra no fim da lista.
    const { data: last } = await supabase
      .from('services')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const { error } = await supabase
      .from('services')
      .insert({ ...parsed.data, sort_order: (last?.sort_order ?? 0) + 1 })
    if (error) return { message: 'Não foi possível salvar. Tente de novo.', values }
  }

  // Renova o cache do site: a landing page passa a mostrar o valor novo.
  updateTag(SERVICES_TAG)
  redirect('/painel/servicos')
}

export type DeleteServiceState = { message: string } | null

// Só exclui serviço que nunca foi usado. Com atendimentos, o banco recusa
// (on delete restrict, erro 23001) e o caminho é desativar.
export async function deleteService(id: string): Promise<DeleteServiceState> {
  const { supabase } = await requireUser()
  if (!idSchema.safeParse(id).success) return { message: 'Serviço inválido.' }

  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error?.code === '23001' || error?.code === '23503') {
    return {
      message:
        'Este serviço já tem atendimentos e não pode ser excluído, para não apagar o histórico. Use "Desativar".',
    }
  }
  if (error) return { message: 'Não foi possível excluir. Tente de novo.' }

  updateTag(SERVICES_TAG)
  redirect('/painel/servicos')
}

// Desativar esconde o serviço do site e da agenda, sem apagar o histórico.
export async function setServiceActive(id: string, active: boolean) {
  const { supabase } = await requireUser()
  if (!idSchema.safeParse(id).success) return

  const { error } = await supabase.from('services').update({ active }).eq('id', id)
  if (error) throw new Error('Não foi possível alterar o serviço.')

  updateTag(SERVICES_TAG)
  redirect('/painel/servicos')
}
