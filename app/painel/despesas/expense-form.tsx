'use client'

import { useActionState, useId } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { expenseCategories } from '@/lib/expenses'
import { FormCard } from '../form-card'
import type { ExpenseFormState } from './actions'

type Saved = { description: string; category: string; amount: number }

const selectClass =
  'h-12 w-full border border-input bg-surface px-4 text-base outline-none focus-visible:border-primary aria-invalid:border-destructive'

// Avulsa (com data) ou fixa (com mês de início no cadastro).
export function ExpenseForm({
  action: saveAction,
  saved,
  dateField,
  hint,
}: {
  action: (prev: ExpenseFormState, formData: FormData) => Promise<ExpenseFormState>
  saved?: Saved
  dateField?: { name: 'expense_date' | 'starts_month'; label: string; value: string }
  hint?: string
}) {
  const [state, action, pending] = useActionState<ExpenseFormState, FormData>(saveAction, null)
  const errors = state?.errors ?? {}
  const formId = useId()
  const value = (field: string, fallback?: string) => state?.values?.[field] ?? fallback ?? ''

  return (
    <form action={action}>
      <FieldGroup>
        <FormCard>
          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor={`${formId}-description`}>Descrição</FieldLabel>
            <Input
              id={`${formId}-description`}
              name="description"
              autoComplete="off"
              placeholder={dateField?.name === 'expense_date' ? 'Ex.: Esmaltes e lixas' : 'Ex.: Aluguel do studio'}
              defaultValue={value('description', saved?.description)}
              aria-invalid={!!errors.description}
              required
            />
            <FieldError>{errors.description?.[0]}</FieldError>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!errors.category}>
              <FieldLabel htmlFor={`${formId}-category`}>Categoria</FieldLabel>
              <select
                id={`${formId}-category`}
                name="category"
                defaultValue={value('category', saved?.category ?? 'other')}
                aria-invalid={!!errors.category}
                className={selectClass}
              >
                {Object.entries(expenseCategories).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <FieldError>{errors.category?.[0]}</FieldError>
            </Field>

            <Field data-invalid={!!errors.amount}>
              <FieldLabel htmlFor={`${formId}-amount`}>Valor (R$)</FieldLabel>
              <Input
                id={`${formId}-amount`}
                name="amount"
                inputMode="decimal"
              enterKeyHint="next"
                placeholder="0,00"
                defaultValue={value(
                  'amount',
                  saved ? saved.amount.toFixed(2).replace('.', ',') : undefined
                )}
                aria-invalid={!!errors.amount}
                required
              />
              <FieldError>{errors.amount?.[0]}</FieldError>
            </Field>
          </div>

          {dateField && (
            <Field data-invalid={!!errors[dateField.name]}>
              <FieldLabel htmlFor={`${formId}-${dateField.name}`}>{dateField.label}</FieldLabel>
              <Input
                id={`${formId}-${dateField.name}`}
                name={dateField.name}
                type={dateField.name === 'expense_date' ? 'date' : 'month'}
                defaultValue={value(dateField.name, dateField.value)}
                aria-invalid={!!errors[dateField.name]}
                required
              />
              <FieldError>{errors[dateField.name]?.[0]}</FieldError>
            </Field>
          )}

          {hint && <FieldDescription>{hint}</FieldDescription>}
        </FormCard>

        {state?.message && (
          <p role="alert" className="text-base text-destructive">
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Salvando...' : 'Salvar'}
        </Button>
        <span role="status" className="sr-only">{pending ? 'Salvando despesa...' : ''}</span>
      </FieldGroup>
    </form>
  )
}
