import Link from 'next/link'
import { Lock } from 'lucide-react'
import { cn } from 'cn'
import { addDays, dayOf, formatShortWeekday, formatTime, todayISO, weekStart } from '@/lib/agenda'
import { noClient, noService } from '@/lib/format'
import { getBusy, summarizeDays } from '../data'
import { loadClass, LoadLegend, loadLabel } from '../load'
import { agendaHref, PeriodNav } from './shared'

// Altura de uma hora na grade, em px.
const HOUR = 48

const shortDate = (day: string) => `${Number(day.slice(8))}/${day.slice(5, 7)}`

const minutesOf = (iso: string, day: string) => {
  const [h, m] = formatTime(iso).split(':').map(Number)
  // Atendimento que passa da meia-noite: corta no fim do dia.
  return dayOf(iso) === day ? h * 60 + m : 24 * 60
}

// Os 7 dias lado a lado, com as horas na vertical: os atendimentos são blocos
// e o vazio aparece como vazio. Tocar num espaço vazio agenda naquela hora.
export async function WeekView({ day }: { day: string }) {
  const today = todayISO()
  const start = weekStart(day)
  const end = addDays(start, 6)
  const items = await getBusy(start, end)
  const summary = summarizeDays(items)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const timed = items.filter((a) => a.time_known)
  const appointmentsOnly = timed.filter((a) => a.kind === 'appointment')

  // A grade vai das 7h às 21h e cresce se tiver atendimento fora disso. Os
  // bloqueios não esticam a grade (uma folga de dia inteiro é cortada nela).
  const firstHour = Math.min(
    7,
    ...appointmentsOnly.map((a) => Math.floor(minutesOf(a.starts_at, dayOf(a.starts_at)) / 60))
  )
  const lastHour = Math.max(
    21,
    ...appointmentsOnly.map((a) => Math.ceil(minutesOf(a.ends_at, dayOf(a.starts_at)) / 60))
  )
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i)
  const top = (minutes: number) => ((minutes - firstHour * 60) / 60) * HOUR

  const now = new Date()
  const nowMinutes = minutesOf(now.toISOString(), today)
  // O total bate com os blocos da grade; lançamentos sem horário vêm à parte.
  const total = appointmentsOnly.length
  const untimed = items.filter((a) => a.kind === 'appointment' && !a.time_known).length

  return (
    <>
      <PeriodNav
        title={`${shortDate(start)} a ${shortDate(end)}`}
        prev={{ href: agendaHref('semana', addDays(start, -7)), label: 'Semana anterior' }}
        next={{ href: agendaHref('semana', addDays(start, 7)), label: 'Próxima semana' }}
        isCurrent={today >= start && today <= end}
        currentHref={agendaHref('semana')}
        currentLabel="Esta semana"
      />

      <p className="mb-3 text-base text-muted-foreground">
        {total === 0 ? 'Nenhum atendimento nesta semana.' : `${total} ${total === 1 ? 'atendimento' : 'atendimentos'} na semana.`}{' '}
        {untimed > 0 && `(Mais ${untimed} lançado${untimed === 1 ? '' : 's'} sem horário, que aparece${untimed === 1 ? '' : 'm'} no dia.) `}
        Toque num espaço vazio para agendar.
      </p>

      <div className="-mx-5 sm:mx-0">
        {/* Cabeçalho: os dias, pintados pela ocupação. */}
        <div className="sticky top-0 z-20 grid grid-cols-[2.25rem_repeat(7,minmax(0,1fr))] gap-px bg-background pr-1 pb-1 sm:pr-0">
          <span />
          {days.map((d) => {
            const s = summary.get(d)
            const load = s?.load ?? 'empty'
            return (
              <Link
                key={d}
                href={agendaHref('dia', d)}
                aria-label={`Abrir ${formatShortWeekday(d)} ${shortDate(d)}: ${s?.count ?? 0} atendimentos, ${loadLabel[load].toLowerCase()}`}
                className={cn(
                  'flex h-14 flex-col items-center justify-center border border-border',
                  loadClass[load],
                  d === today && 'outline-2 -outline-offset-2 outline-foreground',
                  d < today && 'opacity-60'
                )}
              >
                <span className="text-[11px] font-semibold uppercase">{formatShortWeekday(d)}</span>
                <span className="text-base leading-none font-semibold">{Number(d.slice(8))}</span>
              </Link>
            )
          })}
        </div>

        <div className="grid grid-cols-[2.25rem_repeat(7,minmax(0,1fr))] gap-px pr-1 sm:pr-0">
          {/* Horas */}
          <div className="relative" style={{ height: hours.length * HOUR }}>
            {hours.map((h) => (
              <span
                key={h}
                className="absolute right-1 -translate-y-1/2 text-[11px] text-muted-foreground first:translate-y-0"
                style={{ top: top(h * 60) }}
              >
                {h}h
              </span>
            ))}
          </div>

          {days.map((d) => {
            const dayItems = timed.filter((a) => dayOf(a.starts_at) === d)
            const past = d < today
            return (
              <div key={d} className="relative bg-surface" style={{ height: hours.length * HOUR }}>
                {/* Linhas das horas; nos dias de hoje em diante, cada hora vazia agenda. */}
                {hours.map((h) => {
                  const cell = 'absolute inset-x-0 border-t border-border'
                  const style = { top: top(h * 60), height: HOUR }
                  const hour = `${String(h).padStart(2, '0')}:00`
                  return past || (d === today && (h + 1) * 60 <= nowMinutes) ? (
                    <span key={h} className={cn(cell, 'bg-muted/50')} style={style} />
                  ) : (
                    <Link
                      key={h}
                      href={`/painel/agenda/novo?d=${d}&h=${hour}`}
                      aria-label={`Agendar ${formatShortWeekday(d)} ${shortDate(d)} às ${hour}`}
                      className={cn(cell, 'hover:bg-primary-soft')}
                      style={style}
                    />
                  )
                })}

                {/* Atendimentos: o bloco escuro é o atendimento; o claro, o intervalo depois. */}
                {dayItems.map((a) => {
                  if (a.kind === 'block') {
                    const s = Math.max(minutesOf(a.starts_at, d), firstHour * 60)
                    const e = Math.min(minutesOf(a.ends_at, d), lastHour * 60)
                    return (
                      <div
                        key={a.id}
                        role="img"
                        aria-label={`Bloqueado${a.service ? `, ${a.service}` : ''}, ${formatTime(a.starts_at)} às ${formatTime(a.ends_at)}`}
                        className="absolute inset-x-0 z-10 overflow-hidden border border-border bg-muted bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgb(0_0_0/0.05)_6px_12px)] px-1 py-0.5 text-[11px] leading-tight text-muted-foreground"
                        style={{ top: top(s), height: Math.max(top(e) - top(s), 20) }}
                      >
                        <Lock className="size-3" aria-hidden="true" />
                        <span className="block truncate">{a.service ?? 'Bloqueado'}</span>
                      </div>
                    )
                  }
                  const s = minutesOf(a.starts_at, d)
                  const e = minutesOf(a.ends_at, d)
                  const b = minutesOf(a.blocked_until, d)
                  const done = a.status === 'completed'
                  return (
                    <Link
                      key={a.id}
                      href={`/painel/agenda/${a.id}`}
                      aria-label={`${formatTime(a.starts_at)} às ${formatTime(a.ends_at)}, ${a.client ?? noClient}, ${a.service ?? noService}`}
                      className="absolute inset-x-0.5 z-10 flex flex-col overflow-hidden"
                      style={{ top: top(s), height: Math.max(top(b) - top(s), 20) }}
                    >
                      <span
                        className={cn(
                          'min-h-0 overflow-hidden px-1 py-0.5 text-[11px] leading-tight text-white',
                          done ? 'bg-success' : 'bg-primary'
                        )}
                        style={{ height: Math.max(top(e) - top(s), 20) }}
                      >
                        <span className="block font-semibold">{formatTime(a.starts_at)}</span>
                        <span className="block truncate">{a.client?.split(' ')[0] ?? noClient}</span>
                      </span>
                      <span className={cn('flex-1', done ? 'bg-success/25' : 'bg-primary/25')} />
                    </Link>
                  )
                })}

                {d === today && nowMinutes >= firstHour * 60 && nowMinutes <= lastHour * 60 && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-destructive"
                    style={{ top: top(nowMinutes) }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <LoadLegend />
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3.5 bg-primary" /> Agendado
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3.5 bg-success" /> Concluído
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3.5 bg-primary/25" /> Intervalo
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3.5 border border-border bg-muted" /> Bloqueado
          </li>
        </ul>
      </div>
    </>
  )
}
