import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { addDays, dayOf, formatDayTitle, formatTime, todayISO } from '@/lib/agenda'
import { noClient, noService, serviceLabel } from '@/lib/format'
import { BackLink } from '../../../back-link'
import { PageHeader } from '../../../page-header'
import { getAppointment, getBufferMinutes, getBusy } from '../../data'
import { RescheduleForm } from '../../reschedule-form'
import { FormSkeleton } from '../../../skeletons'

export const metadata = { title: 'Remarcar' }

export default function RemarcarPage({ params }: PageProps<'/painel/agenda/[id]/remarcar'>) {
  return (
    <Suspense fallback={<FormSkeleton fields={2} />}>
      <Reschedule params={params} />
    </Suspense>
  )
}

async function Reschedule({ params }: Pick<PageProps<'/painel/agenda/[id]/remarcar'>, 'params'>) {
  const { id } = await params
  const a = /^[0-9a-f-]{36}$/i.test(id) ? await getAppointment(id) : null
  if (!a) notFound()
  // Só atendimentos agendados podem ser remarcados.
  if (a.status !== 'scheduled') redirect(`/painel/agenda/${a.id}`)

  const day = dayOf(a.starts_at)
  const duration = Math.round((Date.parse(a.ends_at) - Date.parse(a.starts_at)) / 60000)
  const today = todayISO()
  const to = addDays(day > today ? day : today, 60)
  const [busy, buffer] = await Promise.all([getBusy(today, to), getBufferMinutes()])

  return (
    <>
      <BackLink href={`/painel/agenda/${a.id}`} label="Atendimento" />
      <PageHeader title="Remarcar" />
      <p className="mb-8 text-base">
        <strong>{a.clients?.name ?? noClient}</strong> · {serviceLabel(a) ?? noService}
        <br />
        <span className="text-muted-foreground">
          Está marcado para {formatDayTitle(day).toLowerCase()}
          {a.time_known ? `, às ${formatTime(a.starts_at)}` : ', sem horário'}.
        </span>
      </p>
      <RescheduleForm
        id={a.id}
        day={day}
        durationMinutes={duration}
        busy={busy}
        range={{ from: today, to }}
        today={today}
        now={new Date().toISOString()}
        buffer={buffer}
      />
    </>
  )
}
