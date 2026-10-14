import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { BackLink } from '../../back-link'
import { DeleteButton } from '../../delete-button'
import { PageHeader } from '../../page-header'
import { deleteExpense, saveExpense } from '../actions'
import { getExpense } from '../data'
import { ExpenseForm } from '../expense-form'

export const metadata = { title: 'Despesa' }

export default function DespesaPage({ params }: PageProps<'/painel/despesas/[id]'>) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
      <EditExpense params={params} />
    </Suspense>
  )
}

async function EditExpense({ params }: Pick<PageProps<'/painel/despesas/[id]'>, 'params'>) {
  const { id } = await params
  const expense = /^[0-9a-f-]{36}$/i.test(id) ? await getExpense(id) : null
  if (!expense) notFound()

  return (
    <>
      <BackLink href={`/painel/despesas?m=${expense.expense_date.slice(0, 7)}`} label="Despesas" />
      <PageHeader title="Despesa avulsa" />
      <div className="flex flex-col gap-10">
        <ExpenseForm
          action={saveExpense.bind(null, expense.id)}
          saved={expense}
          dateField={{ name: 'expense_date', label: 'Data', value: expense.expense_date }}
        />
        <div className="border-t border-border pt-8">
          <DeleteButton
            action={deleteExpense.bind(null, expense.id)}
            label="Excluir despesa"
            confirmText={`Excluir "${expense.description}"?`}
          />
        </div>
      </div>
    </>
  )
}
