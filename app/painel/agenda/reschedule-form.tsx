'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import type { BusyItem } from '@/lib/free-slots'
import { FormCard } from '../form-card'
import { rescheduleAppointment, type RescheduleState } from './actions'
import { DayTimePicker } from './day-time-picker'

export function RescheduleForm({
  id,
  day,
  durationMinutes,
  busy,
  range,
  today,
  now,
  buffer,
}: {
  id: string
  day: string
  durationMinutes: number
  busy: BusyItem[]
  range: { from: string; to: string }
  today: string
  now: string
  buffer: number
}) {
  const [state, action, pending] = useActionState<RescheduleState, FormData>(
    rescheduleAppointment.bind(null, id),
    null
  )

  return (
    <form action={action}>
      <FieldGroup>
        <FormCard>
          {/* O próprio atendimento sai da conta: o horário dele conta como livre. */}
          <DayTimePicker
            busy={busy}
            range={range}
            today={today}
            now={now}
            buffer={buffer}
            duration={durationMinutes}
            initialDay={day < today ? today : day}
            excludeId={id}
            errors={state?.errors ?? {}}
          />
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
