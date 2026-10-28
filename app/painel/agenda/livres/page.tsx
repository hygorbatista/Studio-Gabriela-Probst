import { Suspense } from 'react'
import { connection } from 'next/server'
import { addDays, todayISO } from '@/lib/agenda'
import { BackLink } from '../../back-link'
import { PageHeader } from '../../page-header'
import { getBufferMinutes, getBusy, getFormOptions } from '../data'
import { FormSkeleton } from '../../skeletons'
import { FreeBoard } from './free-board'

export const metadata = { title: 'Horários livres' }

const DAYS = 14

export default function HorariosLivresPage({ searchParams }: PageProps<'/painel/agenda/livres'>) {
  return (
    <>
      <BackLink href="/painel" label="Agenda" />
      <PageHeader title="Horários livres" />
      <Suspense fallback={<FormSkeleton fields={4} />}>
        <Board searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function Board({ searchParams }: Pick<PageProps<'/painel/agenda/livres'>, 'searchParams'>) {
  const { s } = await searchParams
  await connection()
  const today = todayISO()
  const [{ services }, busy, buffer] = await Promise.all([
    getFormOptions(),
    getBusy(today, addDays(today, DAYS - 1)),
    getBufferMinutes(),
  ])

  return (
    <FreeBoard
      services={services}
      busy={busy}
      today={today}
      now={new Date().toISOString()}
      buffer={buffer}
      days={DAYS}
      initialServiceIds={typeof s === 'string' ? s.split(',').filter((id) => services.some((x) => x.id === id)) : undefined}
    />
  )
}
