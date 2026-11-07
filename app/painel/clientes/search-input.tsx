'use client'

import { useEffect, useRef, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

// Atualiza ?q= enquanto digita (com uma pequena espera). Sem JavaScript,
// o formulário GET em volta faz a busca ao apertar Enter.
export function SearchInput() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        aria-busy={pending}
        type="search"
        name="q"
        aria-label="Buscar por nome ou telefone"
        placeholder="Buscar por nome ou telefone"
        autoComplete="off"
        defaultValue={searchParams.get('q') ?? ''}
        className="pl-12 pr-24"
        onChange={(e) => {
          const q = e.target.value
          clearTimeout(timer.current)
          timer.current = setTimeout(() => {
            startTransition(() => router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false }))
          }, 250)
        }}
      />
      {pending && <span role="status" className="absolute right-3 top-0 flex h-12 items-center text-xs text-muted-foreground">Buscando...</span>}
    </div>
  )
}
