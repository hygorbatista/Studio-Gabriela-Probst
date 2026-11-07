import { Suspense } from 'react'
import { connection } from 'next/server'
import { z } from 'zod'
import { addDays, isValidDay, todayISO, TIME_RE } from '@/lib/agenda'
import { BackLink } from '../../back-link'
import { PageHeader } from '../../page-header'
import { AppointmentForm } from '../appointment-form'
import { getBufferMinutes, getBusy, getClientHabits, getFormOptions } from '../data'
import { FormSkeleton } from '../../skeletons'

export const metadata = { title: 'Novo agendamento' }

// Quantos dias de agenda vêm junto com a tela; além disso, "Outra data" busca na hora.
const PRELOAD_DAYS = 14

export default function NovoAgendamentoPage({ searchParams }: PageProps<'/painel/agenda/novo'>) {
  return (
    <>
      <BackLink href="/painel" label="Agenda" />
      <PageHeader title="Agendar" />
      <Suspense fallback={<FormSkeleton fields={5} />}>
        <NewAppointment searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function NewAppointment({
  searchParams,
}: Pick<PageProps<'/painel/agenda/novo'>, 'searchParams'>) {
  const { d, cliente, s, h } = await searchParams
  await connection()
  const today = todayISO()
  const day = typeof d === 'string' && isValidDay(d) ? d : today
  const from = today
  const to = addDays(today, PRELOAD_DAYS - 1)
  const selectedRange = day < from || day > to
    ? { from: day, to: addDays(day, PRELOAD_DAYS - 1) }
    : null
  const parsedClientId = z.uuid().safeParse(cliente)
  const clientId = parsedClientId.success ? parsedClientId.data : undefined

  const [{ clients, services }, busy, buffer, habits, selectedBusy] = await Promise.all([
    getFormOptions(),
    getBusy(from, to),
    getBufferMinutes(),
    clientId ? getClientHabits(clientId) : Promise.resolve({}),
    selectedRange ? getBusy(selectedRange.from, selectedRange.to) : Promise.resolve([]),
  ])

  return (
    <AppointmentForm
      clients={clients}
      services={services}
      habits={habits}
      busy={busy}
      range={{ from, to }}
      extraWindow={selectedRange ? { ...selectedRange, items: selectedBusy } : undefined}
      today={today}
      now={new Date().toISOString()}
      buffer={buffer}
      defaultDay={day}
      initialClientId={clientId}
      initialServiceIds={
        typeof s === 'string' ? s.split(',').filter((id) => services.some((x) => x.id === id)) : undefined
      }
      initialTime={typeof h === 'string' && TIME_RE.test(h) ? h : undefined}
    />
  )
}
