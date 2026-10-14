import { Suspense } from 'react'
import { connection } from 'next/server'
import { monthISO } from '@/lib/agenda'
import { BackLink } from '../../../back-link'
import { PageHeader } from '../../../page-header'
import { saveRecurringExpense } from '../../actions'
import { ExpenseForm } from '../../expense-form'

export const metadata = { title: 'Nova despesa fixa' }

export default function NovaDespesaFixaPage() {
  return (
    <>
      <BackLink href="/painel/despesas" label="Despesas" />
      <PageHeader title="Despesa fixa" />
      {/* O mês atual depende da hora do acesso. */}
      <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
        <NewRecurring />
      </Suspense>
    </>
  )
}

async function NewRecurring() {
  // Lê a hora do acesso, não a do build.
  await connection()
  return (
    <ExpenseForm
      action={saveRecurringExpense.bind(null, null)}
      dateField={{ name: 'starts_month', label: 'Começa em', value: monthISO() }}
      hint="Entra automaticamente em todo mês a partir deste."
    />
  )
}
