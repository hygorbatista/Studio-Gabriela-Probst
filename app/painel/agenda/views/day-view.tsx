import Link from 'next/link'
import { CalendarDays, Check, History, Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from 'cn'
import {
  addDays,
  formatDayTitle,
  formatShortWeekday,
  formatTime,
  todayISO,
  weekStart,
} from '@/lib/agenda'
import { agendaMoments, needsCompletion, type Moment } from '@/lib/agenda-now'
import { formatPrice, noClient, noService } from '@/lib/format'
import { freeGaps } from '@/lib/free-slots'
import { getDayAppointments, getWeekSummary } from '../data'
import { loadClass, loadLabel } from '../load'
import { EmptyState } from '../../empty-state'
import { StatusBadge } from '../../status-badge'
import { agendaHref, PeriodNav } from './shared'

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

const minutesOf = (iso: string) => {
  const [h, m] = formatTime(iso).split(':').map(Number)
  return h * 60 + m
}
const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))

export async function DayView({ day }: { day: string }) {
  const today = todayISO()
  const start = weekStart(day)
  const [appointments, week] = await Promise.all([getDayAppointments(day), getWeekSummary(start)])

  const active = appointments.filter((a) => a.status === 'scheduled' || a.status === 'completed')
  const expected = active.reduce((sum, a) => sum + a.price_charged, 0)
  const now = new Date()
  const { moments, nowIndex } = agendaMoments(appointments, now)
  const showNow = day === today && appointments.length > 0
  // Espaços vagos entre os atendimentos, hoje e nos próximos dias.
  const gaps = active.length > 0 ? freeGaps({ day, busy: active.filter((a) => a.time_known), now }) : []
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))

  const nowLine = (
    <li
      aria-label={`Agora, ${formatTime(now.toISOString())}`}
      className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-primary after:h-px after:flex-1 after:bg-primary"
    >
      Agora · {formatTime(now.toISOString())}
    </li>
  )

  const gapRow = (g: { from: string; to: string }) => (
    <li key={`gap-${g.from}`}>
      <Link
        href={`/painel/agenda/novo?d=${day}&h=${g.from}`}
        className="flex min-h-12 items-center justify-between gap-3 border border-dashed border-input px-4 py-2 text-base text-muted-foreground hover:border-primary hover:text-primary"
      >
        <span>
          <strong className="font-semibold text-foreground">Livre</strong> · {g.from} às {g.to}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <Plus className="size-4" aria-hidden="true" />
          Agendar
        </span>
      </Link>
    </li>
  )

  // Cada espaço vago entra antes do primeiro atendimento que começa depois dele.
  let gapIndex = 0
  const gapsBefore = (startMinutes: number) => {
    const out = []
    while (gapIndex < gaps.length && toMinutes(gaps[gapIndex].to) <= startMinutes) {
      out.push(gapRow(gaps[gapIndex]))
      gapIndex++
    }
    return out
  }

  return (
    <>
      <PeriodNav
        title={formatDayTitle(day)}
        prev={{ href: agendaHref('dia', addDays(day, -7)), label: 'Semana anterior' }}
        next={{ href: agendaHref('dia', addDays(day, 7)), label: 'Próxima semana' }}
        isCurrent={day === today}
        currentHref="/painel"
        currentLabel="Hoje"
      />

      {/* A semana de relance, pintada pela ocupação: toque no dia para abrir. */}
      <nav aria-label="Dias da semana" className="mb-8">
        <ul className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const summary = week.get(d)
            const count = summary?.count ?? 0
            const load = summary?.load ?? 'empty'
            const selected = d === day
            const isToday = d === today
            return (
              <li key={d}>
                <Link
                  href={agendaHref('dia', d)}
                  aria-current={selected ? 'date' : undefined}
                  aria-label={`${formatDayTitle(d)}${isToday ? ', hoje' : ''}: ${count} ${count === 1 ? 'atendimento' : 'atendimentos'}, ${loadLabel[load].toLowerCase()}`}
                  className={cn(
                    'relative flex min-h-18 flex-col items-center justify-center gap-1 border text-center',
                    loadClass[load],
                    selected ? 'outline-2 outline-offset-2 outline-foreground' : 'border-border',
                    d < today && 'opacity-60'
                  )}
                >
                  {isToday && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute top-1.5 right-1.5 size-1.5 rounded-full',
                        load === 'full' ? 'bg-white' : 'bg-primary'
                      )}
                    />
                  )}
                  <span className="text-xs font-semibold uppercase">{formatShortWeekday(d)}</span>
                  <span className="text-lg leading-none font-semibold">{Number(d.slice(8))}</span>
                  <span aria-hidden="true" className="h-4 text-xs font-semibold">
                    {count > 0 ? count : ''}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mb-4">
        <p className="font-serif text-2xl leading-tight">
          {active.length === 0
            ? 'Dia livre'
            : `${active.length} ${active.length === 1 ? 'atendimento' : 'atendimentos'}`}
        </p>
        {active.length > 0 && <p className="text-sm text-muted-foreground">{formatPrice(expected)} no dia</p>}
      </div>

      {appointments.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nenhum horário marcado">
          {day < today
            ? 'Se teve atendimento neste dia, lance no botão abaixo.'
            : 'Toque em Agendar para marcar um atendimento neste dia.'}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {appointments.map((a, i) => {
            const moment = moments.get(a.id)
            const cancelled = a.status === 'cancelled'
            return (
              <AppointmentItem
                key={a.id}
                before={
                  <>
                    {showNow && i === nowIndex && nowLine}
                    {a.time_known && gapsBefore(minutesOf(a.starts_at))}
                  </>
                }
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
                    {a.time_known ? (
                      <>
                        <p className={cn('text-lg leading-tight font-semibold', cancelled && 'line-through')}>
                          {formatTime(a.starts_at)}
                        </p>
                        <p className="text-sm text-muted-foreground">{formatTime(a.ends_at)}</p>
                      </>
                    ) : (
                      // Lançamento antigo em que ela não lembrou o horário.
                      <>
                        <p className="text-lg leading-tight font-semibold text-muted-foreground">—</p>
                        <p className="text-sm text-muted-foreground">sem hora</p>
                      </>
                    )}
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
                      {a.clients?.name ?? noClient}
                    </Link>
                    <p className="text-base text-muted-foreground">{a.services?.name ?? noService}</p>
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
          {gapsBefore(Infinity)}
        </ul>
      )}

      {/* Atendimento que aconteceu e não foi registrado: lança direto como concluído. */}
      {day <= today && (
        <Link
          href={`/painel/agenda/lancar?d=${day}`}
          className={buttonVariants({ variant: 'outline', className: 'mt-6 w-full' })}
        >
          <History className="size-5" aria-hidden="true" />
          Lançar atendimento que já aconteceu
        </Link>
      )}
    </>
  )
}

function AppointmentItem({ before, children }: { before: React.ReactNode; children: React.ReactNode }) {
  return (
    <>
      {before}
      <li>{children}</li>
    </>
  )
}
