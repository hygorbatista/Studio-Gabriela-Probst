'use client'

import { useActionState, useState } from 'react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { effectivePrice, formatDuration, formatPrice, paymentMethods } from '@/lib/format'
import { FormCard } from '../form-card'
import { updateAppointment, type EditFormState } from './actions'
import { ClientPicker } from './client-picker'
import { ServiceChecklist, type ServiceOption } from './service-checklist'

type ClientOption = { id: string; name: string; phone: string | null }

const money = (value: number) => value.toFixed(2).replace('.', ',')
const methods = [...Object.entries(paymentMethods), ['unknown', 'Não informado']] as const

// Editar um atendimento, inclusive os antigos. O concluído pode ficar sem
// cliente, serviço ou horário (lançamentos de quando ela não lembrava) e também
// corrige a forma de pagamento.
export function EditForm({
  id,
  completed,
  clients,
  services,
  keptPrices,
  today,
  initial,
}: {
  id: string
  completed: boolean
  clients: ClientOption[]
  services: ServiceOption[]
  // Preço de cada serviço que já estava no atendimento (a promoção continua valendo).
  keptPrices: Record<string, number>
  today: string
  initial: {
    clientId?: string
    serviceIds: string[]
    price: number
    day: string
    time: string
    method?: string
    notes: string
  }
}) {
  const [state, action, pending] = useActionState<EditFormState, FormData>(updateAppointment.bind(null, id), null)
  const values = state?.values
  const errors = state?.errors ?? {}

  const [serviceIds, setServiceIds] = useState<string[]>(
    values?.service_ids !== undefined ? values.service_ids.split(',').filter(Boolean) : initial.serviceIds
  )
  const [price, setPrice] = useState(values?.price ?? money(initial.price))
  const [noTime, setNoTime] = useState(values ? !values.time : completed && !initial.time)

  const chosen = serviceIds.map((sid) => services.find((s) => s.id === sid)).filter((s) => !!s)
  const priceOf = (s: ServiceOption) => keptPrices[s.id] ?? effectivePrice(s, today)
  const sum = chosen.reduce((total, s) => total + priceOf(s), 0)
  const duration = chosen.reduce((total, s) => total + s.duration_minutes, 0)
  const checkedMethod = values?.method ?? initial.method ?? 'unknown'

  const toggle = (sid: string) =>
    setServiceIds((ids) => (ids.includes(sid) ? ids.filter((x) => x !== sid) : [...ids, sid]))

  return (
    <form action={action}>
      <input type="hidden" name="service_ids" value={serviceIds.join(',')} />
      <FieldGroup>
        <FormCard>
          <ClientPicker
            clients={clients}
            values={values}
            errors={errors}
            initialClientId={initial.clientId}
            optional={completed}
          />

          <fieldset>
            <legend className="mb-3 text-sm font-semibold">
              Serviços{completed && <span className="font-normal text-muted-foreground"> (opcional)</span>}
            </legend>
            <ServiceChecklist
              services={services}
              selected={serviceIds}
              onToggle={toggle}
              today={today}
              priceOf={(s) => keptPrices[s.id]}
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
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-invalid={!!errors.price}
              className="max-w-40"
            />
            {chosen.length > 0 && money(sum) !== price && (
              <FieldDescription>
                Soma dos serviços: {formatPrice(sum)}.{' '}
                <button
                  type="button"
                  onClick={() => setPrice(money(sum))}
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  Usar a soma
                </button>
              </FieldDescription>
            )}
            <FieldError>{errors.price?.[0]}</FieldError>
          </Field>
        </FormCard>

        <FormCard>
          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!errors.day}>
              <FieldLabel htmlFor="day">Dia</FieldLabel>
              <Input id="day" name="day" type="date" defaultValue={values?.day ?? initial.day} required />
              <FieldError>{errors.day?.[0]}</FieldError>
            </Field>
            <Field data-invalid={!!errors.time}>
              <FieldLabel htmlFor="time">Horário</FieldLabel>
              <Input
                id="time"
                name="time"
                type="time"
                step={300}
                defaultValue={values?.time ?? initial.time}
                disabled={noTime}
                aria-invalid={!!errors.time}
              />
              <FieldError>{errors.time?.[0]}</FieldError>
            </Field>
          </div>
          {completed ? (
            <label className="flex min-h-11 items-center gap-3 text-base">
              <input
                type="checkbox"
                checked={noTime}
                onChange={(e) => setNoTime(e.target.checked)}
                className="size-5 accent-primary"
              />
              Não lembro o horário
            </label>
          ) : (
            <FieldDescription>Para ver os horários livres do dia, use Remarcar.</FieldDescription>
          )}
        </FormCard>

        {completed && (
          <FormCard>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Forma de pagamento</legend>
              <div className="grid grid-cols-2 gap-2">
                {methods.map(([value, label]) => (
                  <label
                    key={value}
                    className={cn(
                      'flex h-12 cursor-pointer items-center justify-center border border-input bg-surface text-base font-semibold has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/40',
                      value === 'unknown' && 'col-span-2'
                    )}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={value}
                      defaultChecked={value === checkedMethod}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </FormCard>
        )}

        <FormCard>
          <Field data-invalid={!!errors.notes}>
            <FieldLabel htmlFor="notes">Observações</FieldLabel>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={values?.notes ?? initial.notes}
              aria-invalid={!!errors.notes}
              className="w-full border border-input bg-surface px-4 py-3 text-base outline-none focus-visible:border-primary"
            />
            <FieldError>{errors.notes?.[0]}</FieldError>
          </Field>
        </FormCard>

        {state?.message && (
          <p role="alert" className="text-base text-destructive">
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </FieldGroup>
    </form>
  )
}
