import { Suspense } from 'react'
import { isValidMonth, monthISO, todayISO } from '@/lib/agenda'
import { BackLink } from '../../back-link'
import { PageHeader } from '../../page-header'
import { saveExpense } from '../actions'
import { ExpenseForm } from '../expense-form'
import { FormSkeleton } from '../../skeletons'

export const metadata = { title: 'Nova despesa' }

export default function NovaDespesaPage({ searchParams }: PageProps<'/painel/despesas/nova'>) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <NewExpense searchParams={searchParams} />
    </Suspense>
  )
}

async function NewExpense({ searchParams }: Pick<PageProps<'/painel/despesas/nova'>, 'searchParams'>) {
  const { m } = await searchParams
  const month = typeof m === 'string' && isValidMonth(m) ? m : monthISO()
  // No mês atual, a data sugerida é hoje; em outro mês, o dia 1.
  const date = month === monthISO() ? todayISO() : `${month}-01`

  return (
    <>
      <BackLink href={`/painel/despesas?m=${month}`} label="Despesas" />
      <PageHeader title="Despesa do dia a dia" />
      <ExpenseForm
        action={saveExpense.bind(null, null)}
        dateField={{ name: 'expense_date', label: 'Data', value: date }}
      />
    </>
  )
}
