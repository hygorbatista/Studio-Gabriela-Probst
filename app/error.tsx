'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function SiteError({
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
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-24 text-center">
      <h1 className="font-serif text-4xl md:text-5xl">Algo deu errado</h1>
      <p className="max-w-md text-base text-muted-foreground">
        Não foi possível carregar a página. Tente de novo em instantes.
      </p>
      <Button onClick={() => retry()}>Tentar de novo</Button>
    </main>
  )
}
