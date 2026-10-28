'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatDuration } from '@/lib/format'
import type { Service } from '@/lib/services'
import { FormCard } from '../form-card'
import { saveService, type ServiceFormState } from './actions'

// De 5 em 5 minutos até 1 h (manicure leva 40 min); depois, de 15 em 15 até 5 h.
const durations = [
  ...Array.from({ length: 11 }, (_, i) => 10 + i * 5),
  ...Array.from({ length: 16 }, (_, i) => 75 + i * 15),
]

const selectClass =
  'h-12 w-full border border-input bg-surface px-4 text-base outline-none focus-visible:border-primary aria-invalid:border-destructive'

export function ServiceForm({
  service,
  categories,
}: {
  service?: Service
  categories: string[]
}) {
  const [state, action, pending] = useActionState<ServiceFormState, FormData>(
    saveService.bind(null, service?.id ?? null),
    null
  )

  // Depois de um erro, mostra o que foi digitado; senão, o valor salvo.
  const value = (field: string, saved?: string | number) =>
    state?.values?.[field] ?? (saved === undefined ? '' : String(saved))
  const errors = state?.errors ?? {}
  const upTo = state?.values
    ? state.values.duration_up_to === 'on'
    : service?.duration_up_to ?? false

  return (
    <form action={action}>
      <FieldGroup>
        <FormCard>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Nome</FieldLabel>
            <Input
              id="name"
              name="name"
              defaultValue={value('name', service?.name)}
              aria-invalid={!!errors.name}
              required
            />
            <FieldError>{errors.name?.[0]}</FieldError>
          </Field>

          <Field data-invalid={!!errors.category}>
            <FieldLabel htmlFor="category">Categoria</FieldLabel>
            <Input
              id="category"
              name="category"
              list="categories"
              defaultValue={value('category', service?.category)}
              aria-invalid={!!errors.category}
              required
            />
            <datalist id="categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <FieldError>{errors.category?.[0]}</FieldError>
          </Field>

          <Field data-invalid={!!errors.price}>
            <FieldLabel htmlFor="price">Valor (R$)</FieldLabel>
            <Input
              id="price"
              name="price"
              inputMode="decimal"
              placeholder="0,00"
              defaultValue={value(
                'price',
                service ? service.price.toFixed(2).replace('.', ',') : undefined
              )}
              aria-invalid={!!errors.price}
              required
            />
            <FieldError>{errors.price?.[0]}</FieldError>
          </Field>

          <Field data-invalid={!!errors.duration_minutes}>
            <FieldLabel htmlFor="duration_minutes">Duração</FieldLabel>
            <select
              id="duration_minutes"
              name="duration_minutes"
              defaultValue={value('duration_minutes', service?.duration_minutes ?? 60)}
              aria-invalid={!!errors.duration_minutes}
              className={selectClass}
            >
              {/* Uma duração antiga fora da lista continua aparecendo. */}
              {(service && !durations.includes(service.duration_minutes)
                ? [...durations, service.duration_minutes].sort((a, b) => a - b)
                : durations
              ).map((m) => (
                <option key={m} value={m}>
                  {formatDuration(m)}
                </option>
              ))}
            </select>
            <FieldError>{errors.duration_minutes?.[0]}</FieldError>
          </Field>

          <label className="flex min-h-11 items-center gap-3 text-base">
            <input
              type="checkbox"
              name="duration_up_to"
              defaultChecked={upTo}
              className="size-5 accent-primary"
            />
            A duração é um máximo (&quot;até 2 h&quot;)
          </label>

          {/* Promoção: preço diferente por um tempo, sem mexer no preço normal. */}
          <fieldset className="flex flex-col gap-3 border-t border-border pt-5">
            <legend className="sr-only">Promoção</legend>
            <p className="text-sm font-semibold">Promoção (opcional)</p>
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.promo_price}>
                <FieldLabel htmlFor="promo_price">Preço promocional (R$)</FieldLabel>
                <Input
                  id="promo_price"
                  name="promo_price"
                  inputMode="decimal"
                  placeholder="0,00"
                  defaultValue={value(
                    'promo_price',
                    service?.promo_price != null ? service.promo_price.toFixed(2).replace('.', ',') : undefined
                  )}
                  aria-invalid={!!errors.promo_price}
                />
                <FieldError>{errors.promo_price?.[0]}</FieldError>
              </Field>
              <Field data-invalid={!!errors.promo_until}>
                <FieldLabel htmlFor="promo_until">Válida até</FieldLabel>
                <Input
                  id="promo_until"
                  name="promo_until"
                  type="date"
                  defaultValue={value('promo_until', service?.promo_until ?? undefined)}
                  aria-invalid={!!errors.promo_until}
                />
                <FieldError>{errors.promo_until?.[0]}</FieldError>
              </Field>
            </div>
            <FieldDescription>
              Enquanto valer, o Agendar já usa o preço promocional. Depois da data, volta sozinho para o
              normal. Para tirar antes, apague os dois campos.
            </FieldDescription>
          </fieldset>

          <Field data-invalid={!!errors.return_days}>
            <FieldLabel htmlFor="return_days">Retorno em (dias)</FieldLabel>
            <Input
              id="return_days"
              name="return_days"
              inputMode="numeric"
              placeholder="Sem retorno"
              defaultValue={value('return_days', service ? (service.return_days ?? '') : 30)}
              aria-invalid={!!errors.return_days}
              className="max-w-32"
            />
            <FieldDescription>
              Depois de concluir, o painel sugere agendar a volta da cliente nesse prazo. Deixe vazio
              para serviço avulso.
            </FieldDescription>
            <FieldError>{errors.return_days?.[0]}</FieldError>
          </Field>
        </FormCard>

        {state?.message && (
          <p role="alert" className="text-base text-destructive">
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Salvando...' : 'Salvar'}
        </Button>
      </FieldGroup>
    </form>
  )
}
