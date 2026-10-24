import { Suspense } from 'react'
import { connection } from 'next/server'
import { isValidDay, todayISO } from '@/lib/agenda'
import { DayView } from './agenda/views/day-view'
import { ListView } from './agenda/views/list-view'
import { MonthView } from './agenda/views/month-view'
import { AgendaActions, isView, ViewSwitch } from './agenda/views/shared'
import { WeekView } from './agenda/views/week-view'
import { AgendaSkeleton } from './skeletons'

export const metadata = { title: 'Agenda' }

export default function AgendaPage({ searchParams }: PageProps<'/painel'>) {
  return (
    <Suspense fallback={<AgendaSkeleton />}>
      <Agenda searchParams={searchParams} />
    </Suspense>
  )
}

// Visões Dia, Semana, Mês e Lista (docs/12-plano-agendamentos.md, etapa 3).
// ?v= escolhe a visão (sem ele, Dia) e ?d= o dia de referência.
async function Agenda({ searchParams }: Pick<PageProps<'/painel'>, 'searchParams'>) {
  const { d, v } = await searchParams
  // "Hoje" e "agora" são da hora do acesso, nunca da pré-busca.
  await connection()
  const today = todayISO()
  const day = typeof d === 'string' && isValidDay(d) ? d : today
  const view = isView(v) ? v : 'dia'

  return (
    <>
      <ViewSwitch view={view} day={day} />
      <AgendaActions day={day < today ? today : day} />
      {view === 'dia' && <DayView day={day} />}
      {view === 'semana' && <WeekView day={day} />}
      {view === 'mes' && <MonthView day={day} />}
      {view === 'lista' && <ListView />}
    </>
  )
}
