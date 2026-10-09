'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { deleteService, type DeleteServiceState } from './actions'

export function DeleteServiceButton({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState<DeleteServiceState>(
    deleteService.bind(null, id),
    null
  )

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Excluir "${name}"? Não dá para desfazer.`)) e.preventDefault()
      }}
    >
      {state?.message && (
        <p role="alert" className="mb-4 text-base text-destructive">
          {state.message}
        </p>
      )}
      <Button type="submit" variant="link" disabled={pending} className="w-full text-destructive">
        {pending ? 'Excluindo...' : 'Excluir serviço'}
      </Button>
    </form>
  )
}
