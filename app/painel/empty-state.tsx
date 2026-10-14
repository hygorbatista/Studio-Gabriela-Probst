import type { LucideIcon } from 'lucide-react'

// Tela vazia que orienta: ícone fino, o que aconteceu e o que fazer.
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon
  title: string
  children?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <Icon className="mb-1 size-10 text-muted-foreground" strokeWidth={1} aria-hidden="true" />
      <p className="text-base font-semibold">{title}</p>
      {children && <p className="max-w-xs text-base text-muted-foreground">{children}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
