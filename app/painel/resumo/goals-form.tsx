'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { saveGoals, type GoalsState } from './actions'

export function GoalsForm({
  month,
  revenueGoal,
  visitsGoal,
}: {
  month: string
  revenueGoal: number
  visitsGoal: number
}) {
  const [state, action, pending] = useActionState<GoalsState, FormData>(
    saveGoals.bind(null, month),
    null
  )
  const errors = state?.errors ?? {}

  return (
    <form action={action}>
      <FieldGroup>
        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.monthly_revenue_goal}>
            <FieldLabel htmlFor="monthly_revenue_goal">Faturamento (R$)</FieldLabel>
            <Input
              id="monthly_revenue_goal"
              name="monthly_revenue_goal"
              inputMode="decimal"
              defaultValue={revenueGoal.toFixed(2).replace('.', ',')}
              aria-invalid={!!errors.monthly_revenue_goal}
              required
            />
            <FieldError>{errors.monthly_revenue_goal?.[0]}</FieldError>
          </Field>
          <Field data-invalid={!!errors.monthly_appointments_goal}>
            <FieldLabel htmlFor="monthly_appointments_goal">Atendimentos</FieldLabel>
            <Input
              id="monthly_appointments_goal"
              name="monthly_appointments_goal"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={visitsGoal}
              aria-invalid={!!errors.monthly_appointments_goal}
              required
            />
            <FieldError>{errors.monthly_appointments_goal?.[0]}</FieldError>
          </Field>
        </div>

        {state?.message && (
          <p role="alert" className="text-base text-destructive">
            {state.message}
          </p>
        )}

        <Button type="submit" variant="outline" disabled={pending} className="w-full">
          {pending ? 'Salvando...' : 'Salvar metas'}
        </Button>
      </FieldGroup>
    </form>
  )
}
