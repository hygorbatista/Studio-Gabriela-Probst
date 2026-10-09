import type { ReactNode } from 'react'

export function PageHeader({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <h1 className="font-serif text-4xl">{title}</h1>
      {action}
    </div>
  )
}
