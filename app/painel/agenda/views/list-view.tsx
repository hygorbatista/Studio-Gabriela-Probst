import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { cn } from 'cn'
import { addDays, dayOf, formatDayTitle, formatTime, todayISO } from '@/lib/agenda'
import { noClient, noService } from '@/lib/format'
import { ConfirmedBadge } from '../confirmed-badge'
import { getBusy, summarizeDays } from '../data'
import { loadClass, loadLabel } from '../load'
import { EmptyState } from '../../empty-state'
import { StatusBadge } from '../../status-badge'
import { agendaHref } from './shared'

const DAYS = 30

// Os próximos 30 dias numa rolagem só, agrupados por dia.
export async function ListView() {
  const today = todayISO()
  const items = await getBusy(today, addDays(today, DAYS - 1))
  const summary = summarizeDays(items)
  const days = [...new Set(items.map((a) => dayOf(a.starts_at)))]

  return (
    <>
      <div className="mb-4 text-center">
        <h1 className="font-serif text-2xl leading-tight sm:text-3xl">Próximos {DAYS} dias</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'atendimento' : 'atendimentos'}
        </p>
      </div>

      {days.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nada marcado">
          Nenhum atendimento nos próximos {DAYS} dias.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          {days.map((d) => {
            const s = summary.get(d)
            const load = s?.load ?? 'empty'
            return (
              <section key={d}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Link
                    href={agendaHref('dia', d)}
                    className="inline-flex min-h-11 items-center text-base font-semibold underline-offset-4 hover:underline"
                  >
                    {formatDayTitle(d)}
                    {d === today && <span className="ml-2 text-sm text-primary">Hoje</span>}
                    {d === addDays(today, 1) && <span className="ml-2 text-sm text-primary">Amanhã</span>}
                  </Link>
                  <span className={cn('border border-border px-2 py-0.5 text-xs font-semibold', loadClass[load])}>
                    {loadLabel[load]}
                  </span>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {items
                    .filter((a) => dayOf(a.starts_at) === d)
                    .map((a) => (
                      <li key={a.id}>
                        <Link
                          href={`/painel/agenda/${a.id}`}
                          className="flex items-center gap-4 bg-surface px-4 py-3 shadow-card hover:outline hover:outline-border"
                        >
                          <span className="w-12 shrink-0 text-base font-semibold">
                            {a.time_known ? formatTime(a.starts_at) : '—'}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-base font-semibold">{a.client ?? noClient}</span>
                            <span className="block truncate text-sm text-muted-foreground">
                              {a.service ?? noService}
                            </span>
                          </span>
                          {a.status === 'completed' && <StatusBadge status={a.status} />}
                          {a.status === 'scheduled' && a.confirmed && <ConfirmedBadge />}
                        </Link>
                      </li>
                    ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}
