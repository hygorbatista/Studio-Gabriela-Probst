import Link from 'next/link'
import { CalendarHeart, ChevronRight } from 'lucide-react'
import { getReturnList } from './data'

// Atalho para "Hora de voltar", na Agenda e em Clientes. Some quando não há ninguém.
export async function ReturnLink({ className }: { className?: string }) {
  const list = await getReturnList()
  const due = list.filter((c) => !c.gone).length
  const gone = list.length - due
  if (list.length === 0) return null

  return (
    <Link
      href="/painel/agenda/retornos"
      className={`flex min-h-12 items-center gap-3 border border-border bg-surface px-4 py-3 text-base hover:border-foreground ${className ?? ''}`}
    >
      <CalendarHeart className="size-5 shrink-0 text-primary" aria-hidden="true" />
      <span className="flex-1">
        {due > 0 && (
          <>
            <strong className="font-semibold">Hora de voltar:</strong> {due} {due === 1 ? 'cliente' : 'clientes'}
          </>
        )}
        {due > 0 && gone > 0 && <span className="text-muted-foreground"> · </span>}
        {gone > 0 && (
          <span className="text-muted-foreground">
            {gone} {gone === 1 ? 'sumida' : 'sumidas'}
          </span>
        )}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}
