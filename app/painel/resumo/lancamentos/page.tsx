import { Suspense } from 'react'
import Link from 'next/link'
import { dayOf, isValidMonth, monthISO } from '@/lib/agenda'
import { formatPrice, paymentMethodLabels } from '@/lib/format'
import { expenseCategories, monthStart, type ExpenseCategory } from '@/lib/expenses'
import { BackLink } from '../../back-link'
import { MonthNav } from '../../month-nav'
import { PageHeader } from '../../page-header'
import { ListSkeleton } from '../../skeletons'
import { sectionTitle } from '../../styles'
import { getMonthExpenses } from '../../despesas/data'
import { getMonthReceipts } from '../data'
import { ActionButton } from '../../action-button'
import { reopenAppointment } from '../../agenda/actions'

export const metadata = { title: 'Histórico de lançamentos' }

const path = '/painel/resumo/lancamentos'
const shortDate = (date: string) => date.slice(5).split('-').reverse().join('/')

export default function LancamentosPage({ searchParams }: PageProps<'/painel/resumo/lancamentos'>) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <History searchParams={searchParams} />
    </Suspense>
  )
}

async function History({ searchParams }: Pick<PageProps<'/painel/resumo/lancamentos'>, 'searchParams'>) {
  const { m } = await searchParams
  const current = monthISO()
  const month = typeof m === 'string' && isValidMonth(m) ? m : current

  return (
    <div className="flex flex-col gap-6">
      <div>
        <BackLink href={`/painel/resumo?m=${month}`} label="Resumo" />
        <PageHeader title="Histórico de lançamentos" />
        <MonthNav basePath={path} month={month} current={current} />
      </div>
      <Suspense key={month} fallback={<ListSkeleton />}>
        <Entries month={month} />
      </Suspense>
    </div>
  )
}

async function Entries({ month }: { month: string }) {
  const [payments, expenses] = await Promise.all([getMonthReceipts(month), getMonthExpenses(month)])
  const outgoing = [
    ...expenses.oneOff.map((row) => ({ ...row, date: row.expense_date, href: `/painel/despesas/${row.id}` })),
    ...expenses.recurring.map((row) => ({ ...row, date: monthStart(month), href: `/painel/despesas/fixas/${row.id}?m=${month}`, recurring: true as const })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <section>
        <h2 className={sectionTitle}>Entradas · {formatPrice(payments.reduce((sum, row) => sum + row.amount, 0))}</h2>
        {payments.length === 0 ? <p className="mt-3 text-muted-foreground">Nenhuma entrada neste mês.</p> : (
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {payments.map((row) => (
              <li key={row.id}>
                <EntryLink
                  href={`/painel/agenda/${row.appointment_id}/editar`}
                  title={row.appointments?.clients?.name ?? 'Atendimento'}
                  detail={`${shortDate(dayOf(row.paid_at))} · ${paymentMethodLabels[row.method] ?? row.method}`}
                  amount={row.amount}
                />
                <div className="px-2 pb-3">
                  <ActionButton
                    action={reopenAppointment.bind(null, row.appointment_id, month)}
                    label="Excluir entrada"
                    pendingLabel="Excluindo..."
                    confirm={{
                      title: 'Excluir este pagamento?',
                      description: 'O pagamento sai do histórico e o atendimento volta a ficar pendente de conclusão.',
                      confirmLabel: 'Excluir entrada',
                    }}
                    variant="destructive"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className={sectionTitle}>Saídas · {formatPrice(expenses.total)}</h2>
        {outgoing.length === 0 ? <p className="mt-3 text-muted-foreground">Nenhuma saída neste mês.</p> : (
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {outgoing.map((row) => (
              <li key={row.href}>
                <EntryLink
                  href={row.href}
                  title={row.description}
                  detail={`${'recurring' in row ? 'Despesa fixa' : shortDate(row.date)} · ${expenseCategories[row.category as ExpenseCategory]}`}
                  amount={row.amount}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

function EntryLink({ href, title, detail, amount }: { href: string; title: string; detail: string; amount: number }) {
  return (
    <Link href={href} className="flex min-h-16 items-center justify-between gap-4 px-2 py-3 hover:bg-surface">
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{detail}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-semibold">{formatPrice(amount)}</span>
        <span className="text-sm text-primary underline">Editar</span>
      </span>
    </Link>
  )
}
