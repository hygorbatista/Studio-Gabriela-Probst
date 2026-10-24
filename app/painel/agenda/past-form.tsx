'use client'

import { useActionState, useState } from 'react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { timeOptions } from '@/lib/agenda'
import { formatPrice, paymentMethods } from '@/lib/format'
import { FormCard } from '../form-card'
import { recordPastAppointment, type PastFormState } from './actions'
import { ClientPicker } from './client-picker'

type ClientOption = { id: string; name: string; phone: string | null }
type ServiceOption = { id: string; name: string; price: number }

const selectClass =
  'h-12 w-full border border-input bg-surface px-4 text-base outline-none focus-visible:border-primary aria-invalid:border-destructive'

const money = (value: number) => value.toFixed(2).replace('.', ',')

// "Não lembro" vem marcado: só muda o que ela lembrar.
const methods = [...Object.entries(paymentMethods), ['unknown', 'Não lembro']] as const

// Lançar atendimento que já aconteceu: só o valor é obrigatório.
export function PastForm({
  clients,
  services,
  defaultDay,
  today,
}: {
  clients: ClientOption[]
  services: ServiceOption[]
  defaultDay: string
  today: string
}) {
  const [state, action, pending] = useActionState<PastFormState, FormData>(recordPastAppointment, null)
  const values = state?.values
  const errors = state?.errors ?? {}

  // Escolher o serviço preenche o valor com o preço, se ela ainda não mexeu nele.
  const [amount, setAmount] = useState(values?.amount ?? '')
  const [autoAmount, setAutoAmount] = useState(values?.amount ?? '')
  const onServiceChange = (id: string) => {
    const service = services.find((s) => s.id === id)
    if (service && (amount === '' || amount === autoAmount)) {
      setAmount(money(service.price))
      setAutoAmount(money(service.price))
    }
  }
  const checkedMethod = values?.method || 'unknown'

  return (
    <form action={action}>
      <FieldGroup>
        <FormCard>
          <Field data-invalid={!!errors.day}>
            <FieldLabel htmlFor="day">Data</FieldLabel>
            <Input
              id="day"
              name="day"
              type="date"
              max={today}
              defaultValue={values?.day ?? defaultDay}
              aria-invalid={!!errors.day}
              required
            />
            <FieldError>{errors.day?.[0]}</FieldError>
          </Field>

          <Field data-invalid={!!errors.service_id}>
            <FieldLabel htmlFor="service_id">Serviço</FieldLabel>
            <select
              id="service_id"
              name="service_id"
              defaultValue={values?.service_id ?? ''}
              onChange={(e) => onServiceChange(e.target.value)}
              className={selectClass}
            >
              <option value="">Não lembro</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {formatPrice(s.price)}
                </option>
              ))}
            </select>
          </Field>

          <Field data-invalid={!!errors.amount}>
            <FieldLabel htmlFor="amount">Valor recebido (R$)</FieldLabel>
            <Input
              id="amount"
              name="amount"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={!!errors.amount}
              required
            />
            <FieldError>{errors.amount?.[0]}</FieldError>
          </Field>
        </FormCard>

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

        <FormCard>
          <ClientPicker clients={clients} values={values} errors={errors} optional />

          <Field>
            <FieldLabel htmlFor="time">Horário (opcional)</FieldLabel>
            <select id="time" name="time" defaultValue={values?.time ?? ''} className={selectClass}>
              <option value="">Não lembro</option>
              {timeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <FieldDescription>Sem horário, o lançamento não ocupa a agenda do dia.</FieldDescription>
          </Field>

          <Field data-invalid={!!errors.notes}>
            <FieldLabel htmlFor="notes">Observações (opcional)</FieldLabel>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={values?.notes}
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

        <Button type="submit" disabled={pending} className="w-full bg-success hover:bg-success/90">
          {pending ? 'Lançando...' : 'Lançar atendimento'}
        </Button>
      </FieldGroup>
    </form>
  )
}
