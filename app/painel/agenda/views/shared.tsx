import Link from 'next/link'
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'

export type View = 'dia' | 'semana' | 'mes' | 'lista'

export const views: { value: View; label: string }[] = [
  { value: 'dia', label: 'Dia' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
  { value: 'lista', label: 'Lista' },
]

export function isView(value: unknown): value is View {
  return views.some((v) => v.value === value)
}

// Endereço da agenda numa visão e num dia. O Dia é o padrão e fica sem "v".
export function agendaHref(view: View, day?: string) {
  const params = new URLSearchParams()
  if (view !== 'dia') params.set('v', view)
  if (day) params.set('d', day)
  const query = params.toString()
  return query ? `/painel?${query}` : '/painel'
}

// Dia · Semana · Mês · Lista, como no Google Agenda.
export function ViewSwitch({ view, day }: { view: View; day: string }) {
  return (
    <nav aria-label="Visão da agenda" className="mb-4">
      <ul className="grid grid-cols-4 border border-border bg-surface p-1">
        {views.map((v) => (
          <li key={v.value}>
            <Link
              href={agendaHref(v.value, v.value === 'lista' ? undefined : day)}
              aria-current={v.value === view ? 'page' : undefined}
              className={cn(
                'flex h-10 items-center justify-center text-sm font-semibold',
                v.value === view ? 'bg-foreground text-white' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {v.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Agendar e Horários livres, no mesmo lugar em todas as visões.
export function AgendaActions({ day }: { day: string }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-2">
      <Link href="/painel/agenda/livres" className={buttonVariants({ variant: 'outline' })}>
        <Clock className="size-5" aria-hidden="true" />
        Horários livres
      </Link>
      <Link href={`/painel/agenda/novo?d=${day}`} className={buttonVariants()}>
        <Plus className="size-5" aria-hidden="true" />
        Agendar
      </Link>
    </div>
  )
}

const arrowClass =
  'inline-flex size-11 shrink-0 items-center justify-center border border-border bg-surface hover:border-foreground'

// Título do período com as setas para o anterior e o próximo.
export function PeriodNav({
  title,
  prev,
  next,
  isCurrent,
  currentHref,
  currentLabel,
}: {
  title: string
  prev?: { href: string; label: string }
  next?: { href: string; label: string }
  isCurrent: boolean
  currentHref: string
  currentLabel: string
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      {prev ? (
        <Link href={prev.href} className={arrowClass} aria-label={prev.label}>
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Link>
      ) : (
        <span className="size-11" />
      )}
      <div className="text-center">
        <h1 className="font-serif text-2xl leading-tight sm:text-3xl">{title}</h1>
        {isCurrent ? (
          <p className="text-sm font-semibold text-primary">{currentLabel}</p>
        ) : (
          <Link
            href={currentHref}
            className="inline-flex min-h-8 items-center text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Voltar para {currentLabel.toLowerCase()}
          </Link>
        )}
      </div>
      {next ? (
        <Link href={next.href} className={arrowClass} aria-label={next.label}>
          <ChevronRight className="size-5" aria-hidden="true" />
        </Link>
      ) : (
        <span className="size-11" />
      )}
    </div>
  )
}
