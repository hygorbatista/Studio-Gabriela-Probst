'use client'

import { useActionState, useId, useState, type ComponentProps } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export type ActionState = { message: string } | null

export type Confirm = {
  // A pergunta: "Cancelar este atendimento?"
  title: string
  // O que acontece: "O horário fica livre para outra cliente."
  description?: string
  // Rótulo do botão que confirma. Padrão: o mesmo do botão que abre.
  confirmLabel?: string
}

// Botão que dispara uma Server Action (já com o id via bind), com confirmação
// opcional numa janela do próprio sistema e a mensagem de erro que a action devolver.
export function ActionButton({
  action,
  label,
  pendingLabel,
  confirm,
  variant = 'outline',
  className,
}: {
  action: () => Promise<ActionState>
  label: string
  pendingLabel: string
  confirm?: Confirm
  variant?: ComponentProps<typeof Button>['variant']
  className?: string
}) {
  const [state, formAction, pending] = useActionState<ActionState>(action, null)
  const [open, setOpen] = useState(false)
  // A janela fica fora do formulário (portal): o botão de confirmar aponta para ele pelo id.
  const formId = useId()
  const buttonClass = className ?? 'w-full'

  return (
    <form id={formId} action={formAction}>
      {state?.message && (
        <p role="alert" className="mb-4 text-base text-destructive">
          {state.message}
        </p>
      )}

      {confirm ? (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger
            render={
              <Button type="button" variant={variant} disabled={pending} className={buttonClass} />
            }
          >
            {pending ? pendingLabel : label}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
              {confirm.description && (
                <AlertDialogDescription>{confirm.description}</AlertDialogDescription>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                type="submit"
                form={formId}
                onClick={() => setOpen(false)}
                className={
                  variant === 'destructive' || variant === 'link'
                    ? 'border-destructive bg-destructive text-white hover:bg-destructive/90'
                    : undefined
                }
              >
                {confirm.confirmLabel ?? label}
              </Button>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button type="submit" variant={variant} disabled={pending} className={buttonClass}>
          {pending ? pendingLabel : label}
        </Button>
      )}
    </form>
  )
}
