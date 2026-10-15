import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { formatMonthTitle, monthISO } from '@/lib/agenda'
import { monthStart } from '@/lib/expenses'
import { ActionButton } from '../../../action-button'
import { BackLink } from '../../../back-link'
import { PageHeader } from '../../../page-header'
import { endRecurringExpense, saveRecurringExpense } from '../../actions'
import { getRecurringExpense } from '../../data'
import { ExpenseForm } from '../../expense-form'
import { FormSkeleton } from '../../../skeletons'

export const metadata = { title: 'Despesa de todo mês' }

export default function DespesaFixaPage({ params }: PageProps<'/painel/despesas/fixas/[id]'>) {
  return (
    <>
      <BackLink href="/painel/despesas" label="Despesas" />
      <PageHeader title="Despesa de todo mês" />
      <Suspense fallback={<FormSkeleton />}>
        <EditRecurring params={params} />
      </Suspense>
    </>
  )
}

async function EditRecurring({ params }: Pick<PageProps<'/painel/despesas/fixas/[id]'>, 'params'>) {
  const { id } = await params
  const expense = /^[0-9a-f-]{36}$/i.test(id) ? await getRecurringExpense(id) : null
  if (!expense) notFound()

  const current = monthStart(monthISO())
  const since = formatMonthTitle(expense.starts_on.slice(0, 7)).toLowerCase()
  const ended = expense.ends_on !== null && expense.ends_on < current
  const endsThisMonth = expense.ends_on === current

  return (
    <div className="flex flex-col gap-10">
      <p className="text-base text-muted-foreground">
        Valendo desde {since}
        {expense.ends_on && `, até ${formatMonthTitle(expense.ends_on.slice(0, 7)).toLowerCase()}`}.
      </p>

      {ended ? (
        <p className="text-base">Esta despesa já foi encerrada.</p>
      ) : (
        <>
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
