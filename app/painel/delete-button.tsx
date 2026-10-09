'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'

export type DeleteState = { message: string } | null

// Botão de excluir com confirmação. A action já vem com o id (bind) e devolve
// uma mensagem quando o banco recusa, por exemplo, por haver histórico.
export function DeleteButton({
  action,
  label,
  confirmText,
}: {
  action: () => Promise<DeleteState>
  label: string
  confirmText: string
}) {
  const [state, formAction, pending] = useActionState<DeleteState>(action, null)

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault()
      }}
    >
      {state?.message && (
        <p role="alert" className="mb-4 text-base text-destructive">
          {state.message}
        </p>
      )}
      <Button type="submit" variant="link" disabled={pending} className="w-full text-destructive">
        {pending ? 'Excluindo...' : label}
      </Button>
    </form>
  )
}
