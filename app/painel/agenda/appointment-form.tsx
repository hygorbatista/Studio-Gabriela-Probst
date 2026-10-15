'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { addMinutesToTime, timeOptions } from '@/lib/agenda'
import { formatDuration, formatPrice } from '@/lib/format'
import { createAppointment, type AppointmentFormState } from './actions'
import { FormCard } from '../form-card'
import { ClientPicker } from './client-picker'

type Option = { id: string; name: string }
type ClientOption = Option & { phone: string | null }
type ServiceOption = Option & { price: number; duration_minutes: number; duration_up_to: boolean }

const selectClass =
  'h-12 w-full border border-input bg-surface px-4 text-base outline-none focus-visible:border-primary aria-invalid:border-destructive'

export function AppointmentForm({
  clients,
  services,
  defaultDay,
  initialClientId,
}: {
  clients: ClientOption[]
  services: ServiceOption[]
  defaultDay: string
  // Vindo da ficha da cliente, ela já chega escolhida.
  initialClientId?: string
}) {
  const [state, action, pending] = useActionState<AppointmentFormState, FormData>(
    createAppointment,
    null
  )
  const values = state?.values
  const errors = state?.errors ?? {}

  const [serviceId, setServiceId] = useState(values?.service_id ?? '')
  const [time, setTime] = useState(values?.time ?? '09:00')
  const service = services.find((s) => s.id === serviceId)

  return (
    <form action={action}>
      <FieldGroup>
        {/* Três blocos: quem, o quê e quando, observações. */}
        <FormCard>
          <ClientPicker
            clients={clients}
            values={values}
            errors={errors}
            initialClientId={initialClientId}
          />
        </FormCard>

        <FormCard>
          <Field data-invalid={!!errors.service_id}>
            <FieldLabel htmlFor="service_id">Serviço</FieldLabel>
            <select
              id="service_id"
              name="service_id"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
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
            <FieldError>{errors.service_id?.[0]}</FieldError>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!errors.day}>
              <FieldLabel htmlFor="day">Data</FieldLabel>
              <Input
                id="day"
                name="day"
                type="date"
                defaultValue={values?.day ?? defaultDay}
                aria-invalid={!!errors.day}
                required
              />
              <FieldError>{errors.day?.[0]}</FieldError>
            </Field>
            <Field data-invalid={!!errors.time}>
              <FieldLabel htmlFor="time">Horário</FieldLabel>
              <select
                id="time"
                name="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-invalid={!!errors.time}
                className={selectClass}
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <FieldError>{errors.time?.[0]}</FieldError>
            </Field>
          </div>

          {service && (
            <p className="text-base text-muted-foreground">
              {formatDuration(service.duration_minutes, service.duration_up_to)}: termina às{' '}
              <strong className="text-foreground">{addMinutesToTime(time, service.duration_minutes)}</strong>
              , mais 15 min de intervalo.
            </p>
          )}
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
