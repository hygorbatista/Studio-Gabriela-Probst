'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'

// Algo deu errado ao carregar uma tela do painel (ex.: sem internet, banco fora do ar).
export default function PainelError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col gap-6 pt-6">
      <h1 className="font-serif text-4xl">Não foi possível carregar</h1>
      <p className="text-base text-muted-foreground">
        Pode ser a internet do celular. Confira a conexão e tente de novo. Nada do que já estava
        salvo foi perdido.
      </p>
      <div className="grid gap-2">
        <Button onClick={() => retry()} className="w-full">
          Tentar de novo
        </Button>
        <Link href="/painel" className={buttonVariants({ variant: 'outline', className: 'w-full' })}>
          Voltar para a agenda
        </Link>
      </div>
    </div>
  )
}
