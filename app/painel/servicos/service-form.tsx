'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatDuration } from '@/lib/format'
import type { Service } from '@/lib/services'
import { saveService, type ServiceFormState } from './actions'

// De 15 min a 5 h, de 15 em 15 minutos.
const durations = Array.from({ length: 20 }, (_, i) => (i + 1) * 15)

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
            {durations.map((m) => (
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
