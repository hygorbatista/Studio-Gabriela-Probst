import { Suspense } from 'react'
import Link from 'next/link'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from 'cn'
import {
  addDays,
  formatDayTitle,
  formatShortWeekday,
  formatTime,
  isValidDay,
  todayISO,
  weekStart,
} from '@/lib/agenda'
import { agendaMoments, needsCompletion, type Moment } from '@/lib/agenda-now'
import { formatPrice } from '@/lib/format'
import { getDayAppointments, getWeekCounts } from './agenda/data'
import { EmptyState } from './empty-state'
import { StatusBadge } from './status-badge'
import { AgendaSkeleton } from './skeletons'

export const metadata = { title: 'Agenda' }

export default function AgendaPage({ searchParams }: PageProps<'/painel'>) {
  return (
    <Suspense fallback={<AgendaSkeleton />}>
      <Agenda searchParams={searchParams} />
    </Suspense>
  )
}

// Faixa colorida à esquerda do cartão: a situação de relance.
const barColors: Record<string, string> = {
  scheduled: 'border-l-primary',
  completed: 'border-l-success',
  no_show: 'border-l-destructive',
}

const momentLabels: Record<Moment, { text: string; className: string }> = {
  now: { text: 'Em atendimento', className: 'bg-primary-soft text-primary' },
  late: { text: 'Não concluído', className: 'bg-destructive/10 text-destructive' },
  next: { text: 'Próxima', className: 'bg-primary-soft text-primary' },
}

async function Agenda({ searchParams }: Pick<PageProps<'/painel'>, 'searchParams'>) {
  const { d } = await searchParams
  const today = todayISO()
  const day = typeof d === 'string' && isValidDay(d) ? d : today
  const [appointments, weekCounts] = await Promise.all([
    getDayAppointments(day),
    getWeekCounts(weekStart(day)),
  ])

  const active = appointments.filter((a) => a.status === 'scheduled' || a.status === 'completed')
  const expected = active.reduce((sum, a) => sum + a.price_charged, 0)
  const now = new Date()
  const { moments, nowIndex } = agendaMoments(appointments, now)
  const showNow = day === today && appointments.length > 0

  const start = weekStart(day)
  const week = Array.from({ length: 7 }, (_, i) => addDays(start, i))

  const arrowClass =
    'inline-flex size-11 shrink-0 items-center justify-center border border-border bg-surface hover:border-foreground'

  const nowLine = (
    <li
      aria-label={`Agora, ${formatTime(now.toISOString())}`}
      className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-primary after:h-px after:flex-1 after:bg-primary"
    >
      Agora · {formatTime(now.toISOString())}
    </li>
  )

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href={`/painel?d=${addDays(day, -7)}`} className={arrowClass} aria-label="Semana anterior">
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Link>
        <div className="text-center">
          <h1 className="font-serif text-2xl leading-tight sm:text-3xl">{formatDayTitle(day)}</h1>
          {day === today ? (
            <p className="text-sm font-semibold text-primary">Hoje</p>
          ) : (
            <Link
              href="/painel"
              className="inline-flex min-h-8 items-center text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Voltar para hoje
            </Link>
          )}
        </div>
        <Link href={`/painel?d=${addDays(day, 7)}`} className={arrowClass} aria-label="Próxima semana">
          <ChevronRight className="size-5" aria-hidden="true" />
        </Link>
      </div>

      {/* A semana de relance: toque no dia para abrir. Bolinhas = atendimentos. */}
      <nav aria-label="Dias da semana" className="mb-8">
        <ul className="grid grid-cols-7 gap-1">
          {week.map((d) => {
            const count = weekCounts.get(d) ?? 0
            const selected = d === day
            const isToday = d === today
            return (
              <li key={d}>
                <Link
                  href={`/painel?d=${d}`}
                  aria-current={selected ? 'date' : undefined}
                  aria-label={`${formatDayTitle(d)}${isToday ? ', hoje' : ''}: ${count} ${count === 1 ? 'atendimento' : 'atendimentos'}`}
                  className={cn(
                    'relative flex min-h-18 flex-col items-center justify-center gap-1 border bg-surface text-center',
                    selected ? 'border-foreground shadow-card' : 'border-transparent hover:border-border'
                  )}
                >
                  {isToday && (
                    <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
                  )}
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    {formatShortWeekday(d)}
                  </span>
                  <span className={cn('text-lg leading-none font-semibold', isToday && 'text-primary')}>
                    {Number(d.slice(8))}
                  </span>
                  <span aria-hidden="true" className="flex h-2 items-center gap-0.5">
                    {count > 3 ? (
                      <span className={cn('text-xs font-semibold', selected ? 'text-primary' : 'text-muted-foreground')}>
                        {count}
                      </span>
                    ) : (
                      Array.from({ length: count }, (_, i) => (
                        <span
                          key={i}
                          className={cn('size-1.5 rounded-full', selected ? 'bg-primary' : 'bg-muted-foreground/60')}
                        />
                      ))
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-serif text-2xl leading-tight">
            {active.length === 0
              ? 'Dia livre'
              : `${active.length} ${active.length === 1 ? 'atendimento' : 'atendimentos'}`}
          </p>
          {active.length > 0 && (
            <p className="text-sm text-muted-foreground">{formatPrice(expected)} no dia</p>
          )}
        </div>
        <Link href={`/painel/agenda/novo?d=${day}`} className={buttonVariants()}>
          <Plus className="size-5" aria-hidden="true" />
          Agendar
        </Link>
      </div>

      {appointments.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nenhum horário marcado">
          Toque em Agendar para marcar um atendimento neste dia.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {appointments.map((a, i) => {
            const moment = moments.get(a.id)
            const cancelled = a.status === 'cancelled'
            return (
              <AppointmentItem
                key={a.id}
                showNowBefore={showNow && i === nowIndex}
                nowLine={nowLine}
              >
                <div
                  className={cn(
                    'relative flex gap-4 border-l-3 py-3 pr-4 pl-3',
                    cancelled
                      ? 'border border-dashed border-l-border text-muted-foreground'
                      : cn('bg-surface shadow-card', barColors[a.status]),
                    moment === 'next' && 'outline outline-primary'
                  )}
                >
                  <div className="w-14 shrink-0">
                    <p className={cn('text-lg leading-tight font-semibold', cancelled && 'line-through')}>
                      {formatTime(a.starts_at)}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatTime(a.ends_at)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    {/* O link cobre o cartão inteiro; "Concluir" fica por cima dele. */}
                    <Link
                      href={`/painel/agenda/${a.id}`}
                      className={cn(
                        'block text-base font-semibold after:absolute after:inset-0',
                        cancelled && 'line-through'
                      )}
                    >
                      {a.clients?.name}
                    </Link>
                    <p className="text-base text-muted-foreground">{a.services?.name}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      {/* "Não concluído" já diz a situação; nos outros, o status vem antes. */}
                      {moment !== 'late' && <StatusBadge status={a.status} />}
                      {moment && (
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-bold uppercase tracking-[0.12em]',
                            momentLabels[moment].className
                          )}
                        >
                          {momentLabels[moment].text}
                        </span>
                      )}
                      {needsCompletion(moment) && (
                        <Link
                          href={`/painel/agenda/${a.id}#concluir`}
                          className="relative z-10 inline-flex h-11 items-center gap-1.5 bg-success px-4 text-sm font-semibold text-white hover:bg-success/90"
                        >
                          <Check className="size-4" aria-hidden="true" />
                          Concluir
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </AppointmentItem>
            )
          })}
          {showNow && nowIndex === appointments.length && nowLine}
        </ul>
      )}
    </>
  )
}

function AppointmentItem({
  showNowBefore,
  nowLine,
  children,
}: {
  showNowBefore: boolean
  nowLine: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      {showNowBefore && nowLine}
      <li>{children}</li>
    </>
  )
}
