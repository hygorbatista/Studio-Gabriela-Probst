'use client'

import { useActionState, type ComponentProps } from 'react'
import { Button } from '@/components/ui/button'

export type ActionState = { message: string } | null

// Botão que dispara uma Server Action (já com o id via bind), com confirmação
// opcional e a mensagem de erro que a action devolver.
export function ActionButton({
  action,
  label,
  pendingLabel,
  confirmText,
  variant = 'outline',
  className,
}: {
  action: () => Promise<ActionState>
  label: string
  pendingLabel: string
  confirmText?: string
  variant?: ComponentProps<typeof Button>['variant']
  className?: string
}) {
  const [state, formAction, pending] = useActionState<ActionState>(action, null)

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirmText && !confirm(confirmText)) e.preventDefault()
      }}
    >
      {state?.message && (
        <p role="alert" className="mb-4 text-base text-destructive">
          {state.message}
        </p>
      )}
      <Button type="submit" variant={variant} disabled={pending} className={className ?? 'w-full'}>
        {pending ? pendingLabel : label}
      </Button>
    </form>
  )
}
