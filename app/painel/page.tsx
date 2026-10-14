import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
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
import { formatPrice } from '@/lib/format'
import { getDayAppointments, getWeekCounts } from './agenda/data'
import { StatusBadge } from './status-badge'

export const metadata = { title: 'Agenda' }

export default function AgendaPage({ searchParams }: PageProps<'/painel'>) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
      <Agenda searchParams={searchParams} />
    </Suspense>
  )
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

  const start = weekStart(day)
  const week = Array.from({ length: 7 }, (_, i) => addDays(start, i))

  const arrowClass =
    'inline-flex size-11 items-center justify-center border border-border bg-surface hover:border-foreground'

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href={`/painel?d=${addDays(day, -7)}`} className={arrowClass} aria-label="Semana anterior">
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Link>
        <div className="text-center">
          <h1 className="font-serif text-2xl leading-tight sm:text-3xl">{formatDayTitle(day)}</h1>
          {day === today ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Hoje</p>
          ) : (
            <Link
              href="/painel"
              className="inline-flex min-h-8 items-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Voltar para hoje
            </Link>
          )}
        </div>
        <Link href={`/painel?d=${addDays(day, 7)}`} className={arrowClass} aria-label="Próxima semana">
          <ChevronRight className="size-5" aria-hidden="true" />
        </Link>
      </div>

      {/* A semana de relance: toque no dia para abrir. */}
      <nav aria-label="Dias da semana" className="mb-8">
        <ul className="grid grid-cols-7 gap-1">
          {week.map((d) => {
            const count = weekCounts.get(d) ?? 0
            const selected = d === day
            return (
              <li key={d}>
                <Link
                  href={`/painel?d=${d}`}
                  aria-current={selected ? 'date' : undefined}
                  aria-label={`${formatDayTitle(d)}: ${count} ${count === 1 ? 'atendimento' : 'atendimentos'}`}
                  className={cn(
                    'flex min-h-18 flex-col items-center justify-center gap-0.5 border text-center',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-surface hover:border-foreground'
                  )}
                >
                  <span className="text-xs font-semibold uppercase">{formatShortWeekday(d)}</span>
                  <span className={cn('text-lg font-semibold', d === today && !selected && 'text-primary')}>
                    {Number(d.slice(8))}
                  </span>
                  <span className={cn('text-xs', selected ? 'text-primary-foreground' : 'text-muted-foreground')}>
                    {count > 0 ? count : '·'}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mb-3 flex items-end justify-between gap-4">
        <p className="text-base text-muted-foreground">
          {active.length === 0
            ? 'Nenhum atendimento'
            : `${active.length} ${active.length === 1 ? 'atendimento' : 'atendimentos'} · ${formatPrice(expected)}`}
        </p>
        <Link href={`/painel/agenda/novo?d=${day}`} className={buttonVariants({ size: 'sm' })}>
          <Plus aria-hidden="true" />
          Agendar
        </Link>
      </div>

      {appointments.length > 0 && (
        <ul className="border-t border-border">
          {appointments.map((a) => (
            <li key={a.id} className="border-b border-border">
              <Link
                href={`/painel/agenda/${a.id}`}
                className="flex min-h-18 items-center gap-4 py-3 hover:bg-surface"
              >
                <div className="w-14 shrink-0">
                  <p className="text-base font-semibold">{formatTime(a.starts_at)}</p>
                  <p className="text-base text-muted-foreground">{formatTime(a.ends_at)}</p>
                </div>
                <div className={a.status === 'cancelled' ? 'flex-1 opacity-50' : 'flex-1'}>
                  <p className="text-base font-semibold">{a.clients?.name}</p>
                  <p className="text-base text-muted-foreground">{a.services?.name}</p>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
