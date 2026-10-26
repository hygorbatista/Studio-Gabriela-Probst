'use client'

import { useActionState } from 'react'
import { Check } from 'lucide-react'
import { cn } from 'cn'
import type { ActionState } from '../action-button'
import { setConfirmed } from './actions'

// Um toque marca que a cliente confirmou; outro desfaz.
export function ConfirmToggle({
  id,
  confirmed,
  className,
}: {
  id: string
  confirmed: boolean
  className?: string
}) {
  const [state, action, pending] = useActionState<ActionState>(setConfirmed.bind(null, id, !confirmed), null)

  return (
    <form action={action} className={className}>
      <button
        type="submit"
        disabled={pending}
        aria-pressed={confirmed}
        className={cn(
          'inline-flex h-12 w-full items-center justify-center gap-2 border px-4 text-base font-semibold disabled:opacity-60',
          confirmed
            ? 'border-success bg-success text-white hover:bg-success/90'
            : 'border-input bg-surface hover:border-foreground'
        )}
      >
        <Check className="size-5" aria-hidden="true" />
        {pending ? 'Salvando...' : confirmed ? 'Confirmado' : 'Marcar confirmado'}
      </button>
      {state?.message && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {state.message}
        </p>
      )}
    </form>
  )
}
