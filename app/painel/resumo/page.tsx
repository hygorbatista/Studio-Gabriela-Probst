import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, Check, CircleAlert } from 'lucide-react'
import { cn } from 'cn'
import { addMonths, dayOf, formatMonthTitle, isValidMonth, monthISO } from '@/lib/agenda'
import { formatPrice } from '@/lib/format'
import { monthRankings } from '@/lib/month-rankings'
import { monthSummary } from '@/lib/month-summary'
import { getMonthExpenses } from '../despesas/data'
import { MonthNav } from '../month-nav'
import { getMonthData } from './data'
import { GoalsForm } from './goals-form'
import { DetailSkeleton } from '../skeletons'
import { card, dataLabel, sectionTitle } from '../styles'

export const metadata = { title: 'Resumo' }

const percent = (value: number) => `${Math.round(value * 100)}%`

// Barra da meta: o traço preto no fim marca os 100%.
function GoalBar({ value, label, goal }: { value: number; label: string; goal: string }) {
  const pct = Math.min(value, 1) * 100
  return (
    <div className="mt-4">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        className="relative h-2.5 w-full bg-primary-soft after:absolute after:-inset-y-1 after:right-0 after:w-0.5 after:bg-foreground"
      >
        <div className={cn('h-full', value >= 1 ? 'bg-success' : 'bg-primary')} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex justify-between gap-4 text-sm text-muted-foreground">
        <span>{percent(value)} da meta</span>
        <span>meta {goal}</span>
      </div>
    </div>
  )
}

function GoalReached({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 inline-flex items-center gap-1.5 bg-success px-3 py-1.5 text-sm font-semibold text-white">
      <Check className="size-4" aria-hidden="true" />
      {children}
    </p>
  )
}

// Lista numerada com a posição em Playfair: 1º, 2º, 3º...
function Ranking({ children }: { children: React.ReactNode }) {
  return <ol className="divide-y divide-border">{children}</ol>
}

function RankRow({ position, title, detail, value }: { position: number; title: string; detail: string; value: string }) {
  return (
    <>
      <span className="w-6 shrink-0 font-serif text-2xl leading-none text-primary">{position}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{detail}</span>
      </span>
      <span className="font-semibold">{value}</span>
    </>
  )
}

export default function ResumoPage({ searchParams }: PageProps<'/painel/resumo'>) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <Resumo searchParams={searchParams} />
    </Suspense>
  )
}

async function Resumo({ searchParams }: Pick<PageProps<'/painel/resumo'>, 'searchParams'>) {
  const { m } = await searchParams
  const current = monthISO()
  const month = typeof m === 'string' && isValidMonth(m) ? m : current
  const [data, expenses] = await Promise.all([getMonthData(month), getMonthExpenses(month)])
  const s = monthSummary({ ...data, expenses: expenses.total })
  const { topClients, topServices } = monthRankings(data.payments)
  const previousTitle = formatMonthTitle(addMonths(month, -1)).split(' ')[0].toLowerCase()
  // Maior forma de pagamento primeiro; a barra é proporcional à maior.
  const byMethod = [...s.byMethod].sort((a, b) => b.total - a.total)
  const maxMethod = byMethod[0]?.total ?? 0

  return (
    <div className="flex flex-col gap-6">
      <MonthNav basePath="/painel/resumo" month={month} current={current} />

      {/* O número mais importante do mês, no bordô escuro da seção de contato do site. */}
      <section className="bg-primary-deep p-5 text-white shadow-card">
        <h2 className="text-sm text-white/75">Quanto sobrou no mês</h2>
        <p className="mt-1 font-serif text-5xl leading-tight">{formatPrice(s.profit)}</p>
        {s.profit < 0 && (
          <p className="mt-2 inline-block bg-white px-2 py-0.5 text-sm font-semibold text-destructive">
            Saiu mais do que entrou
          </p>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
          <div>
            <dt className="text-sm text-white/75">Entrou</dt>
            <dd className="mt-0.5 text-lg font-semibold">{formatPrice(s.revenue)}</dd>
          </div>
          <div>
            <dt className="text-sm text-white/75">Saiu</dt>
            <dd className="mt-0.5 text-lg font-semibold">{formatPrice(s.expenses)}</dd>
          </div>
        </dl>
        <Link
          href={`/painel/despesas?m=${month}`}
          className="mt-3 inline-flex min-h-11 items-center text-base font-semibold text-white underline underline-offset-4"
        >
          {s.expenses === 0 ? 'Cadastrar despesas' : 'Ver despesas do mês'}
        </Link>
      </section>

      {s.pendingCount > 0 && s.firstPendingAt && (
        <Link
          href={`/painel?d=${dayOf(s.firstPendingAt)}`}
          className="flex items-start gap-3 border border-destructive bg-surface p-4 text-base hover:bg-muted"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          <span>
            <strong>
              {s.pendingCount}{' '}
              {s.pendingCount === 1
                ? 'atendimento já passou e não foi concluído'
                : 'atendimentos já passaram e não foram concluídos'}
              .
            </strong>{' '}
            Enquanto não forem concluídos, não entram no faturamento. Toque para ver.
          </span>
        </Link>
      )}

      <section className={card}>
        <h2 className={dataLabel}>Faturamento</h2>
        <p className="mt-1 font-serif text-4xl">{formatPrice(s.revenue)}</p>
        <GoalBar value={s.revenueProgress} label="Meta de faturamento" goal={formatPrice(s.revenueGoal)} />
        {s.revenueMissing > 0 ? (
          <p className="mt-3 text-base">
            Faltam <strong>{formatPrice(s.revenueMissing)}</strong> para a meta.
          </p>
        ) : (
          <GoalReached>Meta de faturamento batida!</GoalReached>
        )}
        {s.change !== null && (
          <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <span
              className={cn(
                'inline-flex items-center font-semibold',
                s.change >= 0 ? 'text-success' : 'text-foreground'
              )}
            >
              {s.change >= 0 ? (
                <ArrowUp className="size-4" aria-label="Subiu" />
              ) : (
                <ArrowDown className="size-4" aria-label="Caiu" />
              )}
              {percent(Math.abs(s.change))}
            </span>
            em relação a {previousTitle} ({formatPrice(s.previousRevenue)})
          </p>
        )}
      </section>

      <section className={card}>
        <h2 className={dataLabel}>Atendimentos concluídos</h2>
        <p className="mt-1 font-serif text-4xl">
          {s.completed}
          <span className="text-2xl text-muted-foreground"> de {s.visitsGoal}</span>
        </p>
        <GoalBar value={s.visitsProgress} label="Meta de atendimentos" goal={String(s.visitsGoal)} />
        {s.visitsMissing > 0 ? (
          <p className="mt-3 text-base">
            Faltam <strong>{s.visitsMissing}</strong> para a meta.
          </p>
        ) : (
          <GoalReached>Meta de atendimentos batida!</GoalReached>
        )}
      </section>

      <dl className={cn(card, 'grid grid-cols-2 gap-x-4 gap-y-5')}>
        {[
          { label: 'Ticket médio', value: s.completed ? formatPrice(s.averageTicket) : '—' },
          {
            label: 'Ainda agendado',
            value: s.upcomingCount ? `${s.upcomingCount} · ${formatPrice(s.upcomingValue)}` : '—',
          },
          { label: 'Faltas', value: String(s.noShows) },
          { label: 'Cancelamentos', value: String(s.cancelled) },
        ].map((item) => (
          <div key={item.label}>
            <dt className={dataLabel}>{item.label}</dt>
            <dd className="mt-0.5 text-lg font-semibold">{item.value}</dd>
          </div>
        ))}
      </dl>

      <section className={card}>
        <h2 className={`${sectionTitle} mb-4`}>Como recebeu</h2>
        {byMethod.length === 0 ? (
          <p className="text-muted-foreground">Nenhum pagamento no mês.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {byMethod.map((m, i) => (
              <li key={m.method}>
                <div className="flex justify-between gap-4 text-base">
                  <span>{m.label}</span>
                  <span className="font-semibold">{formatPrice(m.total)}</span>
                </div>
                <div
                  aria-hidden="true"
                  className={cn('mt-1.5 h-1.5', i === 0 ? 'bg-primary' : 'bg-primary/45')}
                  style={{ width: `${(m.total / maxMethod) * 100}%` }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {topClients.length > 0 && (
        <section className={card}>
          <h2 className={`${sectionTitle} mb-1`}>Melhores clientes</h2>
          <Ranking>
            {topClients.map((c, i) => (
              <li key={c.id}>
                <Link
                  href={`/painel/clientes/${c.id}`}
                  className="flex min-h-16 items-center gap-3 py-2 text-base hover:bg-muted/50"
                >
                  <RankRow
                    position={i + 1}
                    title={c.name}
                    detail={`${c.visits} ${c.visits === 1 ? 'visita' : 'visitas'}`}
                    value={formatPrice(c.total)}
                  />
                </Link>
              </li>
            ))}
          </Ranking>
        </section>
      )}

      {topServices.length > 0 && (
        <section className={card}>
          <h2 className={`${sectionTitle} mb-1`}>Serviços mais feitos</h2>
          <Ranking>
            {topServices.map((sv, i) => (
              <li key={sv.name} className="flex min-h-16 items-center gap-3 py-2 text-base">
                <RankRow
                  position={i + 1}
                  title={sv.name}
                  detail={`${sv.count} ${sv.count === 1 ? 'vez' : 'vezes'}`}
                  value={formatPrice(sv.total)}
                />
              </li>
            ))}
          </Ranking>
        </section>
      )}

      <details className="group border-t border-border pt-6">
        <summary className={`${sectionTitle} flex min-h-11 cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden`}>
          Ajustar metas
          <span aria-hidden className="text-lg text-primary transition-transform group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="pt-4">
          <GoalsForm month={month} revenueGoal={s.revenueGoal} visitsGoal={s.visitsGoal} />
        </div>
      </details>
    </div>
  )
}
