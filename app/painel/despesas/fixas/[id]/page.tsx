import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { formatMonthTitle, isValidMonth, monthISO } from '@/lib/agenda'
import { monthStart } from '@/lib/expenses'
import { ActionButton } from '../../../action-button'
import { BackLink } from '../../../back-link'
import { PageHeader } from '../../../page-header'
import { deleteRecurringMonth, endRecurringExpense, saveRecurringExpense, saveRecurringMonth } from '../../actions'
import { getRecurringExpense, getRecurringExpenseOverride } from '../../data'
import { ExpenseForm } from '../../expense-form'
import { FormSkeleton } from '../../../skeletons'

export const metadata = { title: 'Despesa de todo mês' }

export default function DespesaFixaPage({ params, searchParams }: PageProps<'/painel/despesas/fixas/[id]'>) {
  return (
    <>
      <BackLink href="/painel/despesas" label="Despesas" />
      <PageHeader title="Despesa de todo mês" />
      <Suspense fallback={<FormSkeleton />}>
        <EditRecurring params={params} searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function EditRecurring({ params, searchParams }: PageProps<'/painel/despesas/fixas/[id]'>) {
  const [{ id }, { m }] = await Promise.all([params, searchParams])
  const expense = /^[0-9a-f-]{36}$/i.test(id) ? await getRecurringExpense(id) : null
  if (!expense) notFound()

  const current = monthStart(monthISO())
  const since = formatMonthTitle(expense.starts_on.slice(0, 7)).toLowerCase()
  const ended = expense.ends_on !== null && expense.ends_on < current
  const endsThisMonth = expense.ends_on === current
  const month = typeof m === 'string' && isValidMonth(m) ? m : monthISO()
  const date = monthStart(month)
  const applies = expense.starts_on <= date && (!expense.ends_on || expense.ends_on >= date)
  const override = applies ? await getRecurringExpenseOverride(id, month) : null
  const saved = {
    amount: override?.amount ?? expense.amount,
    description: override?.description ?? expense.description,
    category: override?.category ?? expense.category,
  }

  return (
    <div className="flex flex-col gap-10">
      <p className="text-base text-muted-foreground">
        Valendo desde {since}
        {expense.ends_on && `, até ${formatMonthTitle(expense.ends_on.slice(0, 7)).toLowerCase()}`}.
      </p>

      {applies && (
        <section className="space-y-4">
          <h2 className="font-serif text-xl">Somente {formatMonthTitle(month).toLowerCase()}</h2>
          {override?.amount === null && <p>Despesa excluída deste mês. Salve para incluí-la novamente.</p>}
          <ExpenseForm action={saveRecurringMonth.bind(null, id, month)} saved={saved} hint="Altera apenas este mês." />
          {override?.amount !== null && <ActionButton
            action={deleteRecurringMonth.bind(null, id, month)}
            label="Excluir só deste mês"
            pendingLabel="Excluindo..."
            confirm={{
              title: 'Excluir a despesa deste mês?',
              description: 'A despesa continua nos outros meses.',
              confirmLabel: 'Excluir deste mês',
            }}
            variant="destructive"
          />}
        </section>
      )}

      {ended ? (
        <p className="text-base">Esta despesa já foi encerrada.</p>
      ) : (
        <>
          <h2 className="font-serif text-xl">Configuração da despesa fixa</h2>
          <ExpenseForm
            action={saveRecurringExpense.bind(null, expense.id)}
            saved={expense}
            hint="Um novo valor vale a partir deste mês. Os meses anteriores não mudam."
          />
          {!endsThisMonth && (
            <div className="border-t border-border pt-8">
              <p className="mb-4 text-base text-muted-foreground">
                Encerrar: este mês ainda conta, os próximos não.
              </p>
              <ActionButton
                action={endRecurringExpense.bind(null, expense.id)}
                label="Encerrar despesa"
                pendingLabel="Encerrando..."
                confirm={{
                  title: `Encerrar "${expense.description}"?`,
                  description: 'Este mês ainda conta. A partir do próximo, ela não entra mais.',
                  confirmLabel: 'Encerrar',
                }}
                variant="destructive"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
