import { cn } from 'cn'
import { statusLabels } from '@/lib/format'

// Bolinha + palavra. As bolinhas são a exceção redonda do design system.
const styles: Record<string, string> = {
  scheduled: 'text-primary',
  completed: 'text-success',
  cancelled: 'text-muted-foreground',
  no_show: 'text-destructive',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-semibold before:size-2 before:rounded-full before:bg-current',
        styles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  )
}
