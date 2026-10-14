import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { isValidMonth, monthISO } from '@/lib/agenda'
import { expenseCategories, type ExpenseCategory } from '@/lib/expenses'
import { formatPrice } from '@/lib/format'
import { BackLink } from '../back-link'
import { MonthNav } from '../month-nav'
import { getMonthExpenses } from './data'

export const metadata = { title: 'Despesas' }

const label = 'text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground'

export default function DespesasPage({ searchParams }: PageProps<'/painel/despesas'>) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
      <Despesas searchParams={searchParams} />
    </Suspense>
  )
}

function Row({
  href,
  title,
  detail,
  amount,
}: {
  href: string
  title: string
  detail: string
  amount: number
}) {
  return (
    <li className="border-b border-border">
      <Link href={href} className="flex min-h-16 items-center gap-4 py-3 hover:bg-surface">
        <div className="flex-1">
          <p className="text-base font-semibold">{title}</p>
          <p className="text-base text-muted-foreground">{detail}</p>
        </div>
        <p className="text-base font-semibold">{formatPrice(amount)}</p>
        <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  )
}

async function Despesas({ searchParams }: Pick<PageProps<'/painel/despesas'>, 'searchParams'>) {
  const { m } = await searchParams
  const current = monthISO()
  const month = typeof m === 'string' && isValidMonth(m) ? m : current
  const e = await getMonthExpenses(month)
  const category = (c: string) => expenseCategories[c as ExpenseCategory]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <BackLink href={`/painel/resumo?m=${month}`} label="Resumo" />
        <MonthNav basePath="/painel/despesas" month={month} current={current} />
      </div>

      <section className="border border-border bg-surface p-5">
        <h2 className={label}>Despesas do mês</h2>
        <p className="mt-2 font-serif text-4xl">{formatPrice(e.total)}</p>
        <p className="mt-1 text-base text-muted-foreground">
          Fixas {formatPrice(e.recurringTotal)} · Avulsas {formatPrice(e.oneOffTotal)}
        </p>
      </section>

      <section>
        <div className="mb-2 flex items-end justify-between gap-4">
          <h2 className={label}>Fixas (todo mês)</h2>
          <Link href="/painel/despesas/fixas/nova" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            <Plus aria-hidden="true" />
            Fixa
          </Link>
        </div>
        {e.recurring.length === 0 ? (
          <p className="border-t border-border pt-4 text-muted-foreground">
            Nenhuma despesa fixa. Cadastre aluguel, MEI e o que se repete todo mês.
          </p>
        ) : (
          <ul className="border-t border-border">
            {e.recurring.map((r) => (
              <Row
                key={r.id}
                href={`/painel/despesas/fixas/${r.id}`}
                title={r.description}
                detail={category(r.category)}
                amount={r.amount}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-end justify-between gap-4">
          <h2 className={label}>Avulsas</h2>
          <Link href={`/painel/despesas/nova?m=${month}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            <Plus aria-hidden="true" />
            Avulsa
          </Link>
        </div>
        {e.oneOff.length === 0 ? (
          <p className="border-t border-border pt-4 text-muted-foreground">Nenhuma despesa avulsa no mês.</p>
        ) : (
          <ul className="border-t border-border">
            {e.oneOff.map((x) => (
              <Row
                key={x.id}
                href={`/painel/despesas/${x.id}`}
                title={x.description}
                detail={`${x.expense_date.split('-').reverse().slice(0, 2).join('/')} · ${category(x.category)}`}
                amount={x.amount}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
