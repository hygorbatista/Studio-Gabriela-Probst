'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'
import { flashMessages, type FlashCode } from '@/lib/flash'

const DURATION = 3500

// Mostra "Atendimento concluído", "Cliente salva"... depois de uma ação.
export function Flash() {
  return (
    <Suspense fallback={null}>
      <FlashMessage />
    </Suspense>
  )
}

function FlashMessage() {
  const code = useSearchParams().get('ok')
  const message = code && code in flashMessages ? flashMessages[code as FlashCode] : null

  // Depois de alguns segundos, tira o ?ok= do endereço: o aviso some, e atualizar
  // a página não mostra de novo.
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      const url = new URL(window.location.href)
      url.searchParams.delete('ok')
      window.history.replaceState(null, '', url)
    }, DURATION)
    return () => clearTimeout(timer)
  }, [message])

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 px-5"
    >
      {message && (
        <p className="mx-auto flex max-w-2xl animate-in items-center gap-3 bg-foreground px-4 py-3 text-base font-semibold text-white fade-in slide-in-from-bottom-2 duration-200">
          <Check className="size-5 text-white" aria-hidden="true" />
          {message}
        </p>
      )}
    </div>
  )
}
