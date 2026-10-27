import Link from 'next/link'
import { Lock } from 'lucide-react'
import { cn } from 'cn'
import {
  addDays,
  addMonths,
  formatDayTitle,
  formatMonthTitle,
  monthISO,
  todayISO,
  weekStart,
} from '@/lib/agenda'
import { getBusy, summarizeDays } from '../data'
import { loadClass, LoadLegend, loadLabel } from '../load'
import { agendaHref, PeriodNav } from './shared'

const weekdays = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']

// O mês inteiro de relance: cada dia pintado pela ocupação e com o número de
// atendimentos. Tocar no dia abre o dia.
export async function MonthView({ day }: { day: string }) {
  const today = todayISO()
  const month = day.slice(0, 7)
  const first = `${month}-01`
  const last = addDays(`${addMonths(month, 1)}-01`, -1)
  const summary = summarizeDays(await getBusy(first, last))

  // Semanas completas, de segunda a domingo; os dias de fora do mês ficam vazios.
  const gridStart = weekStart(first)
  const gridEnd = addDays(weekStart(last), 6)
  const cells: string[] = []
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) cells.push(d)

  let total = 0
  let full = 0
  for (const s of summary.values()) {
    total += s.count
    if (s.load === 'full') full++
  }

  return (
    <>
      <PeriodNav
        title={formatMonthTitle(month)}
        prev={{ href: agendaHref('mes', `${addMonths(month, -1)}-01`), label: 'Mês anterior' }}
        next={{ href: agendaHref('mes', `${addMonths(month, 1)}-01`), label: 'Próximo mês' }}
        isCurrent={month === monthISO()}
        currentHref={agendaHref('mes')}
        currentLabel="Este mês"
      />

      <p className="mb-3 text-base text-muted-foreground">
        {total === 0
          ? 'Nenhum atendimento neste mês.'
          : `${total} ${total === 1 ? 'atendimento' : 'atendimentos'}${full > 0 ? ` · ${full} ${full === 1 ? 'dia cheio' : 'dias cheios'}` : ''}.`}
      </p>

      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((w) => (
          <span key={w} className="pb-1 text-center text-xs font-semibold text-muted-foreground uppercase">
            {w}
          </span>
        ))}
        {cells.map((d) => {
          if (d.slice(0, 7) !== month) return <span key={d} aria-hidden="true" />
          const s = summary.get(d)
          const load = s?.load ?? 'empty'
          const count = s?.count ?? 0
          return (
            <Link
              key={d}
              href={agendaHref('dia', d)}
              aria-label={`${formatDayTitle(d)}${d === today ? ', hoje' : ''}: ${count} ${count === 1 ? 'atendimento' : 'atendimentos'}, ${loadLabel[load].toLowerCase()}`}
              className={cn(
                'flex aspect-square min-h-12 flex-col justify-between border border-border p-1.5',
                loadClass[load],
                d === today && 'outline-2 -outline-offset-2 outline-foreground',
                d < today && 'opacity-60'
              )}
            >
              <span className={cn('text-base leading-none font-semibold', d === today && 'underline underline-offset-4')}>
                {Number(d.slice(8))}
              </span>
              <span className="flex items-center justify-between text-xs font-semibold">
                {s?.blocked ? <Lock className="size-3" aria-label="Tem horário bloqueado" /> : <span />}
                {count > 0 && count}
              </span>
            </Link>
          )
        })}
      </div>

      <LoadLegend className="mt-4" />
    </>
  )
}
