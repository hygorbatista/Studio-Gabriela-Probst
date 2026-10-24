import { cn } from 'cn'
import type { Load } from '@/lib/free-slots'

// Cores de ocupação do dia, as mesmas no Agendar, na semana e no mês.
export const loadClass: Record<Load, string> = {
  empty: 'bg-surface text-foreground',
  some: 'bg-load-some text-foreground',
  full: 'bg-primary text-primary-foreground',
}

export const loadLabel: Record<Load, string> = {
  empty: 'Vazio',
  some: 'Com espaço',
  full: 'Cheio',
}

export function LoadLegend({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground', className)}>
      {(Object.keys(loadLabel) as Load[]).map((load) => (
        <li key={load} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={cn('size-3.5 border border-border', loadClass[load])} />
          {loadLabel[load]}
        </li>
      ))}
    </ul>
  )
}
