import { cn } from 'cn'
import { statusLabels } from '@/lib/format'

const styles: Record<string, string> = {
  scheduled: 'border-foreground text-foreground',
  completed: 'border-primary bg-primary text-primary-foreground',
  cancelled: 'border-border text-muted-foreground line-through',
  no_show: 'border-destructive text-destructive',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-block border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.15em]',
        styles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  )
}
