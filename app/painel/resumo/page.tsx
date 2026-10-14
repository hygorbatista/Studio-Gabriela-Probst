import { Suspense } from 'react'
import Link from 'next/link'
import { CircleAlert } from 'lucide-react'
import { addMonths, dayOf, formatMonthTitle, isValidMonth, monthISO } from '@/lib/agenda'
import { formatPrice } from '@/lib/format'
import { monthRankings } from '@/lib/month-rankings'
import { monthSummary } from '@/lib/month-summary'
import { getMonthExpenses } from '../despesas/data'
import { MonthNav } from '../month-nav'
import { getMonthData } from './data'
import { GoalsForm } from './goals-form'

export const metadata = { title: 'Resumo' }

const label = 'text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground'

function Progress({ value }: { value: number }) {
  const pct = Math.min(value, 1) * 100
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className="mt-4 h-2 w-full bg-muted"
    >
      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  )
}

const percent = (value: number) => `${Math.round(value * 100)}%`

export default function ResumoPage({ searchParams }: PageProps<'/painel/resumo'>) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
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

  return (
    <div className="flex flex-col gap-8">
      <MonthNav basePath="/painel/resumo" month={month} current={current} />

      <section className="border border-border bg-surface p-5">
        <h2 className={label}>Quanto sobrou</h2>
        <p className={`mt-2 font-serif text-4xl ${s.profit < 0 ? 'text-destructive' : ''}`}>
          {formatPrice(s.profit)}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <dt className={label}>Entrou</dt>
            <dd className="mt-1 text-base font-semibold">{formatPrice(s.revenue)}</dd>
          </div>
          <div>
            <dt className={label}>Saiu</dt>
            <dd className="mt-1 text-base font-semibold">{formatPrice(s.expenses)}</dd>
          </div>
        </dl>
        <Link
          href={`/painel/despesas?m=${month}`}
          className="mt-4 inline-flex min-h-11 items-center gap-1 text-base font-semibold text-primary underline underline-offset-4"
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

      <section className="border border-border bg-surface p-5">
        <h2 className={label}>Faturamento</h2>
        <p className="mt-2 font-serif text-4xl">{formatPrice(s.revenue)}</p>
        <p className="mt-1 text-base text-muted-foreground">
          de {formatPrice(s.revenueGoal)} · {percent(s.revenueProgress)} da meta
        </p>
        <Progress value={s.revenueProgress} />
        <p className="mt-3 text-base">
          {s.revenueMissing > 0 ? (
            <>
              Faltam <strong>{formatPrice(s.revenueMissing)}</strong> para a meta.
            </>
          ) : (
            <strong className="text-primary">Meta de faturamento batida!</strong>
          )}
        </p>
        {s.change !== null && (
          <p className="mt-1 text-base text-muted-foreground">
            {s.change >= 0 ? '+' : '−'}
            {percent(Math.abs(s.change))} em relação a {previousTitle} ({formatPrice(s.previousRevenue)}).
          </p>
        )}
      </section>

      <section className="border border-border bg-surface p-5">
        <h2 className={label}>Atendimentos concluídos</h2>
        <p className="mt-2 font-serif text-4xl">
          {s.completed}
          <span className="text-2xl text-muted-foreground"> / {s.visitsGoal}</span>
        </p>
        <Progress value={s.visitsProgress} />
        <p className="mt-3 text-base">
          {s.visitsMissing > 0 ? (
            <>
              Faltam <strong>{s.visitsMissing}</strong> para a meta.
            </>
          ) : (
            <strong className="text-primary">Meta de atendimentos batida!</strong>
          )}
        </p>
      </section>

      <dl className="grid grid-cols-2 border-t border-l border-border">
        {[
          { label: 'Ticket médio', value: s.completed ? formatPrice(s.averageTicket) : '—' },
          {
            label: 'Ainda agendado',
            value: s.upcomingCount ? `${s.upcomingCount} · ${formatPrice(s.upcomingValue)}` : '—',
          },
          { label: 'Faltas', value: String(s.noShows) },
          { label: 'Cancelamentos', value: String(s.cancelled) },
        ].map((item) => (
          <div key={item.label} className="border-r border-b border-border bg-surface p-4">
            <dt className={label}>{item.label}</dt>
            <dd className="mt-1 text-base font-semibold">{item.value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className={`${label} mb-2`}>Por forma de pagamento</h2>
        {s.byMethod.length === 0 ? (
          <p className="border-t border-border pt-4 text-muted-foreground">Nenhum pagamento no mês.</p>
        ) : (
          <ul className="border-t border-border">
            {s.byMethod.map((m) => (
              <li key={m.method} className="flex items-center justify-between border-b border-border py-3 text-base">
                <span>{m.label}</span>
                <span className="font-semibold">{formatPrice(m.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {topClients.length > 0 && (
        <section>
          <h2 className={`${label} mb-2`}>Melhores clientes</h2>
          <ol className="border-t border-border">
            {topClients.map((c, i) => (
              <li key={c.id} className="border-b border-border">
                <Link
                  href={`/painel/clientes/${c.id}`}
                  className="flex min-h-14 items-center gap-3 py-2 text-base hover:bg-surface"
                >
                  <span className="w-5 text-muted-foreground">{i + 1}</span>
                  <span className="flex-1">
                    <span className="font-semibold">{c.name}</span>
                    <span className="block text-muted-foreground">
                      {c.visits} {c.visits === 1 ? 'visita' : 'visitas'}
                    </span>
                  </span>
                  <span className="font-semibold">{formatPrice(c.total)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {topServices.length > 0 && (
        <section>
          <h2 className={`${label} mb-2`}>Serviços mais feitos</h2>
          <ol className="border-t border-border">
            {topServices.map((sv, i) => (
              <li key={sv.name} className="flex min-h-14 items-center gap-3 border-b border-border py-2 text-base">
                <span className="w-5 text-muted-foreground">{i + 1}</span>
                <span className="flex-1">
                  <span className="font-semibold">{sv.name}</span>
                  <span className="block text-muted-foreground">
                    {sv.count} {sv.count === 1 ? 'vez' : 'vezes'}
                  </span>
                </span>
                <span className="font-semibold">{formatPrice(sv.total)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <details className="group border-t border-border pt-6">
        <summary className={`${label} flex min-h-11 cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden`}>
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
