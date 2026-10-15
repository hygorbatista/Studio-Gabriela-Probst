import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, formatMonthTitle } from '@/lib/agenda'

const navClass =
  'inline-flex size-11 items-center justify-center border border-border bg-surface hover:border-foreground'

// Setas de mês anterior/próximo, título e atalho para o mês atual.
export function MonthNav({
  basePath,
  month,
  current,
}: {
  basePath: string
  month: string
  current: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Link href={`${basePath}?m=${addMonths(month, -1)}`} className={navClass} aria-label="Mês anterior">
        <ChevronLeft className="size-5" aria-hidden="true" />
      </Link>
      <div className="text-center">
        <h1 className="font-serif text-3xl leading-tight">{formatMonthTitle(month)}</h1>
        {month === current ? (
          <p className="text-sm font-semibold text-primary">Este mês</p>
        ) : (
          <Link
            href={basePath}
            className="inline-flex min-h-8 items-center text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Voltar para este mês
          </Link>
        )}
      </div>
      <Link href={`${basePath}?m=${addMonths(month, 1)}`} className={navClass} aria-label="Próximo mês">
        <ChevronRight className="size-5" aria-hidden="true" />
      </Link>
    </div>
  )
}
