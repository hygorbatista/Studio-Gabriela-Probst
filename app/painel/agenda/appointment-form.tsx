'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { effectivePrice, formatDuration, formatPrice } from '@/lib/format'
import type { BusyItem } from '@/lib/free-slots'
import { createAppointment, type AppointmentFormState } from './actions'
import { FormCard } from '../form-card'
import { ClientPicker } from './client-picker'
import { DayTimePicker } from './day-time-picker'
import { ServiceChecklist, type ServiceOption } from './service-checklist'

type ClientOption = { id: string; name: string; phone: string | null }
// Serviços de costume (a combinação mais frequente, ex.: mãos e pés) e a hora.
export type Habits = Record<string, { serviceIds?: string[]; hour?: number }>

const money = (value: number) => value.toFixed(2).replace('.', ',')

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
  initialServiceIds,
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
  // Vindo de "Horários livres", do retorno ou da semana: serviços e hora já escolhidos.
  initialServiceIds?: string[]
  initialTime?: string
}) {
  const [state, action, pending] = useActionState<AppointmentFormState, FormData>(
    createAppointment,
    null
  )
  const values = state?.values
  const errors = state?.errors ?? {}

  const startClient = values?.client_id ?? initialClientId ?? null
  // Só os serviços de costume que continuam ativos.
  const usualOf = (id: string | null) =>
    (id ? habits[id]?.serviceIds : undefined)?.filter((s) => services.some((x) => x.id === s)) ?? []
  const [clientId, setClientId] = useState(startClient)
  // Um ou mais serviços, na ordem em que foram escolhidos ("Manicure + Pedicure").
  const [serviceIds, setServiceIds] = useState<string[]>(() => {
    if (values?.service_ids) return values.service_ids.split(',').filter(Boolean)
    if (initialServiceIds?.length) return initialServiceIds
    return usualOf(startClient)
  })
  // Depois que ela mexe nos serviços, trocar a cliente não muda mais.
  const [serviceTouched, setServiceTouched] = useState(
    !!values?.service_ids || !!initialServiceIds?.length
  )
  const chosen = serviceIds.map((id) => services.find((s) => s.id === id)).filter((s) => !!s)
  const duration = chosen.reduce((sum, s) => sum + s.duration_minutes, 0)
  const suggested = chosen.reduce((sum, s) => sum + effectivePrice(s, today), 0)
  const habit = clientId ? habits[clientId] : undefined

  // O valor acompanha os serviços até ela digitar outro (promoção pontual, desconto).
  const [price, setPrice] = useState(values?.price ?? '')
  const [priceTouched, setPriceTouched] = useState(!!values?.price)
  const shownPrice = priceTouched ? price : chosen.length ? money(suggested) : ''

  const toggleService = (id: string) => {
    setServiceTouched(true)
    setServiceIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  const onClientChange = (id: string | null) => {
    setClientId(id)
    const usual = usualOf(id)
    if (!serviceTouched && usual.length) setServiceIds(usual)
  }

  return (
    <form action={action}>
      <input type="hidden" name="service_ids" value={serviceIds.join(',')} />
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

          <fieldset data-invalid={!!errors.service_ids}>
            <legend className="mb-1 text-sm font-semibold">Serviços</legend>
            <p className="mb-3 text-sm text-muted-foreground">Marque um ou mais (ex.: mãos e pés).</p>
            <ServiceChecklist
              services={services}
              selected={serviceIds}
              onToggle={toggleService}
              today={today}
              usualId={habit?.serviceIds?.length === 1 ? habit.serviceIds[0] : undefined}
            />
            {chosen.length > 1 && (
              <p className="mt-3 text-base">
                Total: <strong>{formatDuration(duration)}</strong>
              </p>
            )}
            <FieldError>{errors.service_ids?.[0]}</FieldError>
          </fieldset>

          <Field data-invalid={!!errors.price}>
            <FieldLabel htmlFor="price">Valor (R$)</FieldLabel>
            <Input
              id="price"
              name="price"
              inputMode="decimal"
              placeholder="0,00"
              value={shownPrice}
              onChange={(e) => {
                setPrice(e.target.value)
                setPriceTouched(true)
              }}
              aria-invalid={!!errors.price}
              className="max-w-40"
            />
            <FieldDescription>
              {priceTouched && chosen.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setPriceTouched(false)}
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  Voltar para {formatPrice(suggested)}
                </button>
              ) : (
                'Soma dos serviços, já com promoção. Dá para mudar (desconto, promoção do dia).'
              )}
            </FieldDescription>
            <FieldError>{errors.price?.[0]}</FieldError>
          </Field>
        </FormCard>

        <FormCard>
          <DayTimePicker
            busy={busy}
            range={range}
            today={today}
            now={now}
            buffer={buffer}
            duration={duration || null}
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
