'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { formatDuration, formatPrice } from '@/lib/format'
import type { BusyItem } from '@/lib/free-slots'
import { createAppointment, type AppointmentFormState } from './actions'
import { FormCard } from '../form-card'
import { ClientPicker } from './client-picker'
import { DayTimePicker } from './day-time-picker'

type Option = { id: string; name: string }
type ClientOption = Option & { phone: string | null }
type ServiceOption = Option & { price: number; duration_minutes: number; duration_up_to: boolean }
export type Habits = Record<string, { serviceId?: string; hour?: number }>

const selectClass =
  'h-12 w-full border border-input bg-surface px-4 text-base outline-none focus-visible:border-primary aria-invalid:border-destructive'

export function AppointmentForm({
  clients,
  services,
  habits,
  busy,
  range,
  today,
  now,
  buffer,
  defaultDay,
  initialClientId,
  initialServiceId,
  initialTime,
}: {
  clients: ClientOption[]
  services: ServiceOption[]
  habits: Habits
  busy: BusyItem[]
  range: { from: string; to: string }
  today: string
  now: string
  buffer: number
  defaultDay: string
  // Vindo da ficha da cliente, ela já chega escolhida.
  initialClientId?: string
  // Vindo de "Horários livres" ou da semana: serviço e hora já escolhidos.
  initialServiceId?: string
  initialTime?: string
}) {
  const [state, action, pending] = useActionState<AppointmentFormState, FormData>(
    createAppointment,
    null
  )
  const values = state?.values
  const errors = state?.errors ?? {}

  const startClient = values?.client_id ?? initialClientId ?? null
  const [clientId, setClientId] = useState(startClient)
  const [serviceId, setServiceId] = useState(
    values?.service_id ?? initialServiceId ?? (startClient ? habits[startClient]?.serviceId : '') ?? ''
  )
  // Depois que ela escolhe o serviço à mão, trocar a cliente não muda mais.
  const [serviceTouched, setServiceTouched] = useState(!!values?.service_id || !!initialServiceId)
  const service = services.find((s) => s.id === serviceId)
  const habit = clientId ? habits[clientId] : undefined

  const onClientChange = (id: string | null) => {
    setClientId(id)
    const usual = id ? habits[id]?.serviceId : undefined
    if (!serviceTouched && usual && services.some((s) => s.id === usual)) setServiceId(usual)
  }

  return (
    <form action={action}>
      <FieldGroup>
        {/* Três blocos: quem e o quê, quando, observações. */}
        <FormCard>
          <ClientPicker
            clients={clients}
            values={values}
            errors={errors}
            initialClientId={initialClientId}
            onChange={onClientChange}
          />

          <Field data-invalid={!!errors.service_id}>
            <FieldLabel htmlFor="service_id">Serviço</FieldLabel>
            <select
              id="service_id"
              name="service_id"
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value)
                setServiceTouched(true)
              }}
              aria-invalid={!!errors.service_id}
              className={selectClass}
              required
            >
              <option value="" disabled>
                Escolha o serviço
              </option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {formatPrice(s.price)}
                </option>
              ))}
            </select>
            {service && (
              <FieldDescription>
                {formatDuration(service.duration_minutes, service.duration_up_to)}
                {habit?.serviceId === service.id && ' · o de costume da cliente'}
              </FieldDescription>
            )}
            <FieldError>{errors.service_id?.[0]}</FieldError>
          </Field>
        </FormCard>

        <FormCard>
          <DayTimePicker
            busy={busy}
            range={range}
            today={today}
            now={now}
            buffer={buffer}
            duration={service?.duration_minutes ?? null}
            initialDay={values?.day ?? defaultDay}
            initialTime={values?.time ?? initialTime}
            favoriteHour={habit?.hour}
            errors={errors}
          />
        </FormCard>

        <FormCard>
          <Field data-invalid={!!errors.notes}>
            <FieldLabel htmlFor="notes">Observações</FieldLabel>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={values?.notes}
              aria-invalid={!!errors.notes}
              className="w-full border border-input bg-surface px-4 py-3 text-base outline-none focus-visible:border-primary"
            />
            <FieldDescription>Opcional.</FieldDescription>
            <FieldError>{errors.notes?.[0]}</FieldError>
          </Field>
        </FormCard>

        {state?.message && (
          <p role="alert" className="text-base text-destructive">
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Agendando...' : 'Agendar'}
        </Button>
      </FieldGroup>
    </form>
  )
}
