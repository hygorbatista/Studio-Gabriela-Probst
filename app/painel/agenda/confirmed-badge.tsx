import { CheckCheck } from 'lucide-react'

// Selo dos agendados que a cliente já confirmou.
export function ConfirmedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-success">
      <CheckCheck className="size-4" aria-hidden="true" />
      Confirmado
    </span>
  )
}
