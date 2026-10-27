'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { withFlash } from '@/lib/flash'
import { addDays, dayOf, isValidDay, toTimestamp, todayISO } from '@/lib/agenda'
import { parseMoney, paymentMethods } from '@/lib/format'
import { normalizePhone } from '@/lib/phone'
import type { TablesInsert } from '@/lib/supabase/database.types'
import type { ActionState } from '../action-button'
import { getBusy } from './data'

const CONFLICT =
  'Esse horário conflita com outro atendimento (contando o intervalo de 15 minutos).'

const idSchema = z.uuid()

const appointmentSchema = z
  .object({
    client_id: z.string().min(1, 'Escolha a cliente.'),
    new_client_name: z.string().trim().max(80, 'Use até 80 caracteres.'),
    new_client_phone: z.string().trim(),
    service_id: z.uuid('Escolha o serviço.'),
    day: z.string().refine(isValidDay, 'Data inválida.'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Escolha o horário.'),
    notes: z.string().trim().max(500, 'Use até 500 caracteres.'),
  })
  .superRefine((v, ctx) => {
    if (v.client_id === 'new') {
      if (!v.new_client_name) {
        ctx.addIssue({ code: 'custom', path: ['new_client_name'], message: 'Informe o nome.' })
      }
      if (v.new_client_phone && !normalizePhone(v.new_client_phone)) {
        ctx.addIssue({
          code: 'custom',
          path: ['new_client_phone'],
          message: 'Telefone inválido. Use DDD + número.',
        })
      }
    } else if (!idSchema.safeParse(v.client_id).success) {
      ctx.addIssue({ code: 'custom', path: ['client_id'], message: 'Escolha a cliente.' })
    }
  })

type Fields = keyof z.input<typeof appointmentSchema>

export type AppointmentFormState = {
  message?: string
  errors?: Partial<Record<Fields, string[]>>
  values?: Record<string, string>
} | null

export async function createAppointment(
  _prev: AppointmentFormState,
  formData: FormData
): Promise<AppointmentFormState> {
  const { supabase } = await requireUser()

  const values = Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, String(v)])
  )
  const parsed = appointmentSchema.safeParse({
    client_id: '',
    new_client_name: '',
    new_client_phone: '',
    notes: '',
    ...values,
  })
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values }
  }
  const v = parsed.data

  // Cliente nova: cadastra junto com o agendamento.
  let clientId = v.client_id
  let createdClient = false
  if (clientId === 'new') {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: v.new_client_name,
        phone: v.new_client_phone ? normalizePhone(v.new_client_phone) : null,
      })
      .select('id')
      .single()
    if (error) return { message: 'Não foi possível cadastrar a cliente.', values }
    clientId = data.id
    createdClient = true
  }

  // Término, intervalo e valor são preenchidos pelo gatilho do banco.
  const appointment = {
    client_id: clientId,
    service_id: v.service_id,
    starts_at: toTimestamp(v.day, v.time),
    notes: v.notes || null,
  } as TablesInsert<'appointments'>

  const { error } = await supabase.from('appointments').insert(appointment)
  if (error) {
    // Não deixa uma cliente "solta" se o agendamento falhou.
    if (createdClient) await supabase.from('clients').delete().eq('id', clientId)
    if (error.code === '23P01') return { message: CONFLICT, values }
    return { message: 'Não foi possível agendar. Tente de novo.', values }
  }

  redirect(withFlash(`/painel?d=${v.day}`, 'agendado'))
}

// Agenda de duas semanas a partir de um dia escolhido em "Outra data", fora
// do período que a tela já trouxe.
export async function loadBusy(from: string) {
  if (!isValidDay(from)) return []
  return getBusy(from, addDays(from, 13))
}

// A cliente respondeu o lembrete: marca (ou desmarca) "Confirmado" e
// atualiza a tela sem sair dela, para confirmar várias seguidas.
export async function setConfirmed(id: string, confirmed: boolean): Promise<ActionState> {
  const { supabase } = await requireUser()
  if (!idSchema.safeParse(id).success) return { message: 'Atendimento inválido.' }

  const { data, error } = await supabase
    .from('appointments')
    .update({ confirmed_at: confirmed ? new Date().toISOString() : null })
    .eq('id', id)
    .eq('status', 'scheduled')
    .select('id')
    .maybeSingle()
  if (error || !data) return { message: 'Não foi possível salvar. Tente de novo.' }

  refresh()
  return null
}

// Cancelar ou marcar falta.
export async function setAppointmentStatus(
  id: string,
  status: 'cancelled' | 'no_show'
): Promise<ActionState> {
  const { supabase } = await requireUser()
  if (!idSchema.safeParse(id).success) return { message: 'Atendimento inválido.' }

  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .eq('status', 'scheduled')
    .select('starts_at')
    .maybeSingle()
  if (error || !data) return { message: 'Não foi possível alterar. Tente de novo.' }

  redirect(
    withFlash(`/painel?d=${dayOf(data.starts_at)}`, status === 'cancelled' ? 'cancelado' : 'falta')
  )
}

const completeSchema = z.object({
  amount: z.preprocess(
    parseMoney,
    z.number({ error: 'Informe o valor.' }).min(0, 'O valor não pode ser negativo.').max(10000)
  ),
  method: z.enum(Object.keys(paymentMethods) as [keyof typeof paymentMethods], {
    error: 'Escolha a forma de pagamento.',
  }),
})

export type CompleteState = {
  message?: string
  errors?: Partial<Record<'amount' | 'method', string[]>>
} | null

// Concluir com valor e forma de pagamento (uma transação no banco).
export async function completeAppointment(
  id: string,
  _prev: CompleteState,
  formData: FormData
): Promise<CompleteState> {
  const { supabase } = await requireUser()
  if (!idSchema.safeParse(id).success) return { message: 'Atendimento inválido.' }

  const parsed = completeSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors }

  const { error } = await supabase.rpc('complete_appointment', {
    p_appointment_id: id,
    p_amount: parsed.data.amount,
    p_method: parsed.data.method,
  })
  if (error) return { message: 'Não foi possível concluir. Tente de novo.' }

  redirect(withFlash(`/painel/agenda/${id}`, 'concluido'))
}

// Desfaz conclusão, falta ou cancelamento feitos por engano.
export async function reopenAppointment(id: string): Promise<ActionState> {
  const { supabase } = await requireUser()
  if (!idSchema.safeParse(id).success) return { message: 'Atendimento inválido.' }

  const { error } = await supabase.rpc('reopen_appointment', { p_appointment_id: id })
  if (error?.code === '23P01') {
    return { message: 'O horário já foi ocupado por outro atendimento. Remarque em outro horário.' }
  }
  if (error) return { message: 'Não foi possível reabrir. Tente de novo.' }

  redirect(withFlash(`/painel/agenda/${id}`, 'reaberto'))
}

const rescheduleSchema = z.object({
  day: z.string().refine(isValidDay, 'Data inválida.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Escolha o horário.'),
})

export type RescheduleState = {
  message?: string
  errors?: Partial<Record<'day' | 'time', string[]>>
} | null

// Muda só a data e o horário. O gatilho do banco mantém a duração e o intervalo.
export async function rescheduleAppointment(
  id: string,
  _prev: RescheduleState,
  formData: FormData
): Promise<RescheduleState> {
  const { supabase } = await requireUser()
  if (!idSchema.safeParse(id).success) return { message: 'Atendimento inválido.' }

  const parsed = rescheduleSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors }

  const { data, error } = await supabase
    .from('appointments')
    // Remarcar define o horário, mesmo num lançamento que estava "sem horário".
    // A confirmação era do horário antigo: volta a ficar pendente.
    .update({
      starts_at: toTimestamp(parsed.data.day, parsed.data.time),
      time_known: true,
      confirmed_at: null,
    })
    .eq('id', id)
    .eq('status', 'scheduled')
    .select('id')
    .maybeSingle()
  if (error?.code === '23P01') return { message: CONFLICT }
  if (error || !data) return { message: 'Não foi possível remarcar. Tente de novo.' }

  redirect(`/painel/agenda/${id}?remarcado=1`)
}

// Lançar atendimento que já aconteceu ---------------------------------------
// Só o valor é obrigatório: cliente, serviço, horário e forma de pagamento
// ficam em branco quando ela não lembra.

const pastSchema = z
  .object({
    day: z
      .string()
      .refine(isValidDay, 'Data inválida.')
      .refine((d) => d <= todayISO(), 'A data não pode estar no futuro. Para o futuro, use Agendar.'),
    amount: z.preprocess(
      parseMoney,
      z
        .number({ error: 'Informe o valor recebido.' })
        .min(0, 'O valor não pode ser negativo.')
        .max(10000, 'Valor alto demais.')
    ),
    service_id: z.union([z.literal(''), z.uuid()]),
    time: z.union([z.literal(''), z.string().regex(/^\d{2}:\d{2}$/)]),
    method: z.union([z.literal(''), z.literal('unknown'), z.enum(Object.keys(paymentMethods) as [keyof typeof paymentMethods])]),
    client_id: z.string(),
    new_client_name: z.string().trim().max(80, 'Use até 80 caracteres.'),
    new_client_phone: z.string().trim(),
    notes: z.string().trim().max(500, 'Use até 500 caracteres.'),
  })
  .superRefine((v, ctx) => {
    if (v.client_id === 'new') {
      if (!v.new_client_name) {
        ctx.addIssue({ code: 'custom', path: ['new_client_name'], message: 'Informe o nome.' })
      }
      if (v.new_client_phone && !normalizePhone(v.new_client_phone)) {
        ctx.addIssue({
          code: 'custom',
          path: ['new_client_phone'],
          message: 'Telefone inválido. Use DDD + número.',
        })
      }
    } else if (v.client_id && !idSchema.safeParse(v.client_id).success) {
      ctx.addIssue({ code: 'custom', path: ['client_id'], message: 'Cliente inválida.' })
    }
  })

export type PastFormState = {
  message?: string
  errors?: Partial<Record<keyof z.input<typeof pastSchema>, string[]>>
  values?: Record<string, string>
} | null

export async function recordPastAppointment(
  _prev: PastFormState,
  formData: FormData
): Promise<PastFormState> {
  const { supabase } = await requireUser()

  const values = Object.fromEntries([...formData.entries()].map(([k, v]) => [k, String(v)]))
  const parsed = pastSchema.safeParse({
    service_id: '',
    time: '',
    method: '',
    client_id: '',
    new_client_name: '',
    new_client_phone: '',
    notes: '',
    ...values,
  })
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values }
  }
  const v = parsed.data

  let clientId: string | null = v.client_id || null
  let createdClient = false
  if (clientId === 'new') {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: v.new_client_name,
        phone: v.new_client_phone ? normalizePhone(v.new_client_phone) : null,
      })
      .select('id')
      .single()
    if (error) return { message: 'Não foi possível cadastrar a cliente.', values }
    clientId = data.id
    createdClient = true
  }

  // Sem horário: fica ao meio-dia do dia, sem ocupar a agenda (time_known = false).
  const { error } = await supabase.rpc('record_past_appointment', {
    p_starts_at: toTimestamp(v.day, v.time || '12:00'),
    p_time_known: v.time !== '',
    // O banco aceita null nestes campos; o tipo gerado não sabe disso.
    p_client_id: clientId as string,
    p_service_id: (v.service_id || null) as string,
    p_amount: v.amount,
    p_method: (v.method && v.method !== 'unknown' ? v.method : null) as string,
    p_notes: (v.notes || null) as string,
  })
  if (error) {
    if (createdClient) await supabase.from('clients').delete().eq('id', clientId!)
    if (error.code === '23P01') {
      return {
        message: 'Já tem atendimento nesse horário. Escolha outro horário ou deixe em "Não lembro".',
        values,
      }
    }
    return { message: 'Não foi possível lançar. Tente de novo.', values }
  }

  // Volta para a mesma tela, pronta para o próximo lançamento (n zera o formulário).
  redirect(withFlash(`/painel/agenda/lancar?d=${v.day}&n=${Date.now()}`, 'lancado'))
}
