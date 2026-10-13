'use client'

import { ActionButton, type ActionState } from './action-button'

export type DeleteState = ActionState

// Excluir com confirmação. A action devolve uma mensagem quando o banco recusa,
// por exemplo, por haver histórico.
export function DeleteButton({
  action,
  label,
  confirmText,
}: {
  action: () => Promise<DeleteState>
  label: string
  confirmText: string
}) {
  return (
    <ActionButton
      action={action}
      label={label}
      pendingLabel="Excluindo..."
      confirmText={confirmText}
      variant="link"
      className="w-full text-destructive"
    />
  )
}
