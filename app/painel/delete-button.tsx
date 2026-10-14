'use client'

import { ActionButton, type ActionState } from './action-button'

export type DeleteState = ActionState

// Excluir com confirmação. A action devolve uma mensagem quando o banco recusa,
// por exemplo, por haver histórico.
export function DeleteButton({
  action,
  label,
  name,
}: {
  action: () => Promise<DeleteState>
  label: string
  // O que será excluído, para a pergunta da confirmação.
  name: string
}) {
  return (
    <ActionButton
      action={action}
      label={label}
      pendingLabel="Excluindo..."
      confirm={{
        title: `Excluir "${name}"?`,
        description: 'Isso não pode ser desfeito.',
        confirmLabel: 'Excluir',
      }}
      variant="link"
      className="w-full text-destructive"
    />
  )
}
