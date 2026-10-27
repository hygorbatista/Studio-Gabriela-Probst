'use client'

import { useActionState, useState } from 'react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { addMinutesToTime } from '@/lib/agenda'
import { FormCard } from '../form-card'
import { createBlock, type BlockFormState } from './actions'

// Os motivos mais comuns, num toque. Dá para escrever outro.
const reasons = ['Folga', 'Médico', 'Almoço', 'Compromisso', 'Curso']

export function BlockForm({ day, time }: { day: string; time?: string }) {
  const [state, action, pending] = useActionState<BlockFormState, FormData>(createBlock, null)
  const values = state?.values
  const errors = state?.errors ?? {}

  const [allDay, setAllDay] = useState(values ? values.all_day === 'on' : !time)
  const [reason, setReason] = useState(values?.reason ?? (time ? '' : 'Folga'))
  const [manyDays, setManyDays] = useState(!!values?.until)
  const from = values?.from ?? time ?? '12:00'

  return (
    <form action={action}>
      <FieldGroup>
        <FormCard>
          <Field>
            <FieldLabel htmlFor="reason">Motivo</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {reasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  aria-pressed={reason === r}
                  className={cn(
                    'h-11 border px-4 text-base font-semibold',
                    reason === r
                      ? 'border-foreground bg-foreground text-white'
                      : 'border-input bg-surface hover:border-foreground'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <Input
              id="reason"
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ou escreva o motivo"
              aria-invalid={!!errors.reason}
            />
            <FieldDescription>Opcional. Só você vê.</FieldDescription>
            <FieldError>{errors.reason?.[0]}</FieldError>
          </Field>
        </FormCard>

        <FormCard>
          <Field data-invalid={!!errors.day}>
            <FieldLabel htmlFor="day">{manyDays ? 'Do dia' : 'Dia'}</FieldLabel>
            <Input id="day" name="day" type="date" defaultValue={values?.day ?? day} required />
            <FieldError>{errors.day?.[0]}</FieldError>
          </Field>

          {manyDays ? (
            <Field data-invalid={!!errors.until}>
              <FieldLabel htmlFor="until">Até o dia</FieldLabel>
              <Input id="until" name="until" type="date" defaultValue={values?.until ?? day} required />
              <FieldDescription>O mesmo bloqueio em cada dia, por exemplo nas férias.</FieldDescription>
              <FieldError>{errors.until?.[0]}</FieldError>
            </Field>
          ) : (
            <button
              type="button"
              onClick={() => setManyDays(true)}
              className="min-h-11 self-start text-sm font-semibold text-primary underline underline-offset-4"
            >
              Vários dias seguidos
            </button>
          )}

          <label className="flex min-h-11 items-center gap-3 text-base">
            <input
              type="checkbox"
              name="all_day"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="size-5 accent-primary"
            />
            Dia inteiro
          </label>

          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.from}>
                <FieldLabel htmlFor="from">Das</FieldLabel>
                <Input id="from" name="from" type="time" step={300} defaultValue={from} aria-invalid={!!errors.from} />
                <FieldError>{errors.from?.[0]}</FieldError>
              </Field>
              <Field data-invalid={!!errors.to}>
                <FieldLabel htmlFor="to">Até</FieldLabel>
                <Input
                  id="to"
                  name="to"
                  type="time"
                  step={300}
                  defaultValue={values?.to ?? addMinutesToTime(from, 60)}
                  aria-invalid={!!errors.to}
                />
                <FieldError>{errors.to?.[0]}</FieldError>
              </Field>
            </div>
          )}
        </FormCard>

        {state?.message && (
          <p role="alert" className="text-base text-destructive">
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Bloqueando...' : 'Bloquear'}
        </Button>
      </FieldGroup>
    </form>
  )
}
