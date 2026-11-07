'use client'

import { useEffect, useRef, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

// Atualiza ?q= enquanto digita (com uma pequena espera). Sem JavaScript,
// o formulário GET faz a busca ao apertar Enter.
export function SearchInput() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const search = (value: string) => {
    const q = value.trim()
    const href = q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname
    startTransition(() => router.replace(href, { scroll: false }))
  }

  return (
    <form
      role="search"
      aria-label="Clientes"
      className="relative mb-6"
      onSubmit={(event) => {
        event.preventDefault()
        clearTimeout(timer.current)
        search(String(new FormData(event.currentTarget).get('q') ?? ''))
      }}
    >
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
          timer.current = setTimeout(() => search(q), 250)
        }}
      />
      <span role="status" className="pointer-events-none absolute right-3 top-0 flex h-12 items-center text-xs text-muted-foreground">
        {pending ? 'Buscando...' : ''}
      </span>
    </form>
  )
}
