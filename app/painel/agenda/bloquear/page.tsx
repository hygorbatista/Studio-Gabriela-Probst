import { Suspense } from 'react'
import { connection } from 'next/server'
import { isValidDay, todayISO, TIME_RE } from '@/lib/agenda'
import { BackLink } from '../../back-link'
import { PageHeader } from '../../page-header'
import { FormSkeleton } from '../../skeletons'
import { BlockForm } from '../block-form'

export const metadata = { title: 'Bloquear horário' }

export default function BloquearPage({ searchParams }: PageProps<'/painel/agenda/bloquear'>) {
  return (
    <>
      <BackLink href="/painel" label="Agenda" />
      <PageHeader title="Bloquear horário" />
      <p className="mb-6 text-base text-muted-foreground">
        Folga, médico, almoço: o horário bloqueado some dos horários livres e ninguém é agendado nele.
      </p>
      <Suspense fallback={<FormSkeleton fields={4} />}>
        <Block searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function Block({ searchParams }: Pick<PageProps<'/painel/agenda/bloquear'>, 'searchParams'>) {
  const { d, h } = await searchParams
  await connection()
  const day = typeof d === 'string' && isValidDay(d) ? d : todayISO()
  const time = typeof h === 'string' && TIME_RE.test(h) ? h : undefined
  return <BlockForm day={day} time={time} />
}
