'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { paymentMethods } from '@/lib/format'
import { FormCard } from '../form-card'
import { completeAppointment, type CompleteState } from './actions'

// Concluir: valor (já com o preço do serviço) e forma de pagamento, em poucos toques.
export function CompleteForm({ id, price }: { id: string; price: number }) {
  const [state, action, pending] = useActionState<CompleteState, FormData>(
    completeAppointment.bind(null, id),
    null
  )
  const errors = state?.errors ?? {}

  return (
    <form action={action} className="flex flex-col gap-5">
      <FormCard>
        <Field data-invalid={!!errors.amount}>
          <FieldLabel htmlFor="amount">Valor recebido (R$)</FieldLabel>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            defaultValue={price.toFixed(2).replace('.', ',')}
            aria-invalid={!!errors.amount}
            required
          />
          <FieldError>{errors.amount?.[0]}</FieldError>
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            Forma de pagamento
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(paymentMethods).map(([value, label]) => (
              <label
                key={value}
                className="flex h-12 cursor-pointer items-center justify-center border border-input bg-surface text-base font-semibold has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground"
              >
                <input type="radio" name="method" value={value} required className="sr-only" />
                {label}
              </label>
            ))}
          </div>
          {errors.method && (
            <p role="alert" className="mt-2 text-base text-destructive">
              {errors.method[0]}
            </p>
          )}
        </fieldset>
      </FormCard>

      {state?.message && (
        <p role="alert" className="text-base text-destructive">
          {state.message}
        </p>
      )}

      {/* Verde-oliva: a mesma cor de "Concluído" na agenda. */}
      <Button type="submit" disabled={pending} className="w-full bg-success hover:bg-success/90">
        {pending ? 'Concluindo...' : 'Concluir atendimento'}
      </Button>
    </form>
  )
}
