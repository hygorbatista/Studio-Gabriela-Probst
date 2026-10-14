'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { addMinutesToTime, timeOptions } from '@/lib/agenda'
import { FormCard } from '../form-card'
import { rescheduleAppointment, type RescheduleState } from './actions'

const selectClass =
  'h-12 w-full border border-input bg-surface px-4 text-base outline-none focus-visible:border-primary aria-invalid:border-destructive'

export function RescheduleForm({
  id,
  day,
  time: initialTime,
  durationMinutes,
}: {
  id: string
  day: string
  time: string
  durationMinutes: number
}) {
  const [state, action, pending] = useActionState<RescheduleState, FormData>(
    rescheduleAppointment.bind(null, id),
    null
  )
  const errors = state?.errors ?? {}
  const [time, setTime] = useState(initialTime)
  // Garante que o horário atual aparece na lista, mesmo fora das 6h–22h.
  const options = timeOptions.includes(initialTime)
    ? timeOptions
    : [...timeOptions, initialTime].sort()

  return (
    <form action={action}>
      <FieldGroup>
        <FormCard>
          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!errors.day}>
              <FieldLabel htmlFor="day">Nova data</FieldLabel>
              <Input
                id="day"
                name="day"
                type="date"
                defaultValue={day}
                aria-invalid={!!errors.day}
                required
              />
              <FieldError>{errors.day?.[0]}</FieldError>
            </Field>
            <Field data-invalid={!!errors.time}>
              <FieldLabel htmlFor="time">Novo horário</FieldLabel>
              <select
                id="time"
                name="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-invalid={!!errors.time}
                className={selectClass}
              >
                {options.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <FieldError>{errors.time?.[0]}</FieldError>
            </Field>
          </div>

          <p className="text-base text-muted-foreground">
            Termina às <strong className="text-foreground">{addMinutesToTime(time, durationMinutes)}</strong>,
            mais 15 min de intervalo.
          </p>
        </FormCard>

        {state?.message && (
          <p role="alert" className="text-base text-destructive">
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Remarcando...' : 'Remarcar'}
        </Button>
      </FieldGroup>
    </form>
  )
}
