'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatDuration, formatPrice } from '@/lib/format'
import { createAppointment, type AppointmentFormState } from './actions'

type Option = { id: string; name: string }
type ServiceOption = Option & { price: number; duration_minutes: number; duration_up_to: boolean }

// Horários de 15 em 15 minutos, das 6h às 22h: o horário dela é flexível.
const times = Array.from({ length: 65 }, (_, i) => {
  const minutes = 6 * 60 + i * 15
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
})

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

const selectClass =
  'h-12 w-full border border-input bg-surface px-4 text-base outline-none focus-visible:border-primary aria-invalid:border-destructive'

export function AppointmentForm({
  clients,
  services,
  defaultDay,
}: {
  clients: Option[]
  services: ServiceOption[]
  defaultDay: string
}) {
  const [state, action, pending] = useActionState<AppointmentFormState, FormData>(
    createAppointment,
    null
  )
  const values = state?.values
  const errors = state?.errors ?? {}

  const [clientId, setClientId] = useState(values?.client_id ?? '')
  const [serviceId, setServiceId] = useState(values?.service_id ?? '')
  const [time, setTime] = useState(values?.time ?? '09:00')
  const service = services.find((s) => s.id === serviceId)

  return (
    <form action={action}>
      <FieldGroup>
        <Field data-invalid={!!errors.client_id}>
          <FieldLabel htmlFor="client_id">Cliente</FieldLabel>
          <select
            id="client_id"
            name="client_id"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            aria-invalid={!!errors.client_id}
            className={selectClass}
            required
          >
            <option value="" disabled>
              Escolha a cliente
            </option>
            <option value="new">+ Nova cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError>{errors.client_id?.[0]}</FieldError>
        </Field>

        {clientId === 'new' && (
          <div className="flex flex-col gap-5 border-l-2 border-primary pl-4">
            <Field data-invalid={!!errors.new_client_name}>
              <FieldLabel htmlFor="new_client_name">Nome da nova cliente</FieldLabel>
              <Input
                id="new_client_name"
                name="new_client_name"
                autoComplete="off"
                defaultValue={values?.new_client_name}
                aria-invalid={!!errors.new_client_name}
                required
              />
              <FieldError>{errors.new_client_name?.[0]}</FieldError>
            </Field>
            <Field data-invalid={!!errors.new_client_phone}>
              <FieldLabel htmlFor="new_client_phone">WhatsApp</FieldLabel>
              <Input
                id="new_client_phone"
                name="new_client_phone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="(48) 99999-9999"
                defaultValue={values?.new_client_phone}
                aria-invalid={!!errors.new_client_phone}
              />
              <FieldError>{errors.new_client_phone?.[0]}</FieldError>
            </Field>
          </div>
        )}

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
              {times.map((t) => (
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
            <strong className="text-foreground">{addMinutes(time, service.duration_minutes)}</strong>
            , mais 15 min de intervalo.
          </p>
        )}

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
