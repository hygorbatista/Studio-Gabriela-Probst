'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatPhone } from '@/lib/phone'

type Client = { id: string; name: string; phone: string | null }

// Escolher a cliente digitando parte do nome ou do telefone, ou cadastrar uma nova.
export function ClientPicker({
  clients,
  values,
  errors,
  initialClientId,
  optional = false,
  onChange,
}: {
  clients: Client[]
  values?: Record<string, string>
  errors: Record<string, string[] | undefined>
  initialClientId?: string
  // No lançamento de atendimento antigo, pode ficar sem cliente.
  optional?: boolean
  // Avisa a cliente escolhida (null: nenhuma ou nova).
  onChange?: (clientId: string | null) => void
}) {
  const label = optional ? 'Cliente (opcional)' : 'Cliente'
  const searchId = useId()
  const optionsId = useId()
  const focusAfterSelection = useRef(false)
  const selectionTarget = useRef<HTMLInputElement>(null)
  const changeTarget = useRef<HTMLButtonElement>(null)
  const startId = values?.client_id ?? initialClientId ?? ''
  const [selected, setSelectedState] = useState<Client | 'new' | null>(
    startId === 'new' ? 'new' : (clients.find((c) => c.id === startId) ?? null)
  )
  const setSelected = (c: Client | 'new' | null) => {
    focusAfterSelection.current = true
    setSelectedState(c)
    onChange?.(c && c !== 'new' ? c.id : null)
  }
  const [query, setQuery] = useState('')

  const [browsing, setBrowsing] = useState(false)
  const [page, setPage] = useState(1)
  const [retry, setRetry] = useState(0)
  const term = query.trim()
  const active = !selected && (browsing || !!term)
  const key = JSON.stringify([term, page, retry])
  const [result, setResult] = useState<{ key: string; clients: Client[]; hasMore: boolean; error?: string } | null>(null)
  const [draft, setDraft] = useState({ name: values?.new_client_name ?? '', phone: values?.new_client_phone ?? '' })
  const loading = active && result?.key !== key
  const matches = active && !loading ? result?.clients ?? [] : []

  useEffect(() => {
    if (!focusAfterSelection.current) return
    focusAfterSelection.current = false
    const target = selected && selected !== 'new' ? changeTarget.current : selectionTarget.current
    target?.focus()
  }, [selected])

  useEffect(() => {
    if (!active) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: term, p: String(page) })
        const response = await fetch('/painel/clientes/opcoes?' + params, { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('request')
        const data = await response.json()
        if (!controller.signal.aborted) setResult({ key, ...data })
      } catch {
        if (!controller.signal.aborted) setResult({ key, clients: [], hasMore: false, error: 'Não foi possível carregar as clientes.' })
      }
    }, term ? 250 : 0)
    return () => { clearTimeout(timer); controller.abort() }
  }, [active, term, page, key])

  const optionClass =
    'flex min-h-12 w-full items-center gap-3 border-b border-border px-4 py-2 text-left text-base hover:bg-muted'

  // Cliente escolhida: mostra o nome e a opção de trocar.
  if (selected && selected !== 'new') {
    return (
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <input type="hidden" name="client_id" value={selected.id} />
        <div className="flex min-h-12 items-center justify-between gap-4 border border-primary bg-surface px-4 py-2">
          <div>
            <p className="text-base font-semibold">{selected.name}</p>
            {selected.phone && (
              <p className="text-base text-muted-foreground">{formatPhone(selected.phone)}</p>
            )}
          </div>
          <button
            ref={changeTarget}
            type="button"
            onClick={() => setSelected(null)}
            aria-label={`Trocar cliente selecionada: ${selected.name}`}
            className="min-h-11 text-sm font-semibold text-primary underline underline-offset-4"
          >
            Trocar
          </button>
        </div>
      </Field>
    )
  }

  // Nova cliente: nome (já com o que foi digitado) e WhatsApp.
  if (selected === 'new') {
    return (
      <div className="flex flex-col gap-5 border-l-2 border-primary pl-4">
        <input type="hidden" name="client_id" value="new" />
        <Field data-invalid={!!errors.new_client_name}>
          <FieldLabel htmlFor="new_client_name">Nome da nova cliente</FieldLabel>
          <Input
            ref={selectionTarget}
            id="new_client_name"
            name="new_client_name"
            autoComplete="off"
            value={draft.name}
            onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
            autoCapitalize="words"
            enterKeyHint="next"
            aria-invalid={!!errors.new_client_name}
            required
          />
          <FieldError>{errors.new_client_name?.[0]}</FieldError>
        </Field>
        <Field data-invalid={!!errors.new_client_phone}>
          <FieldLabel htmlFor="new_client_phone">WhatsApp</FieldLabel>
          <Input
            id="new_client_phone"
            name="new_client_phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="(48) 99999-9999"
            value={draft.phone}
            onChange={(e) => setDraft((current) => ({ ...current, phone: e.target.value }))}
            enterKeyHint="next"
            aria-invalid={!!errors.new_client_phone}
          />
          <FieldError>{errors.new_client_phone?.[0]}</FieldError>
        </Field>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="min-h-11 self-start text-sm font-semibold text-muted-foreground underline underline-offset-4"
        >
          Escolher uma cliente cadastrada
        </button>
      </div>
    )
  }

  // Busca.
  return (
    <Field data-invalid={!!errors.client_id}>
      <FieldLabel htmlFor={searchId}>{label}</FieldLabel>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={selectionTarget}
          id={searchId}
          type="search"
          autoComplete="off"
          placeholder="Digite o nome ou telefone"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); setBrowsing(false) }}
          aria-controls={optionsId}
          autoCapitalize="words"
          aria-invalid={!!errors.client_id}
          className="pl-12"
        />
      </div>
      <button type="button" onClick={() => { setBrowsing(true); setQuery(''); setPage(1) }}
        className="min-h-11 self-start text-sm font-semibold text-primary underline underline-offset-4">
        Ver todas as clientes
      </button>
      <p role="status" className="sr-only">
        {loading ? 'Carregando clientes' : active && !result?.error
          ? `Página ${page}. ${matches.length} resultados.` : ''}
      </p>
      {loading && <p aria-hidden="true" className="text-sm text-muted-foreground">Carregando clientes...</p>}
      {active && !loading && result?.error && <div role="alert" className="text-sm text-destructive">
        {result.error} <button type="button" onClick={() => setRetry((n) => n + 1)} className="min-h-11 underline">Tentar novamente</button>
      </div>}
      <ul id={optionsId} aria-busy={loading} className="border-x border-t border-border bg-surface">
        {matches.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => setSelected(c)} className={optionClass}>
              <span className="flex-1 font-semibold">{c.name}</span>
              {c.phone && <span className="text-muted-foreground">{formatPhone(c.phone)}</span>}
            </button>
          </li>
        ))}
        {active && !loading && !result?.error && matches.length === 0 && (
          <li className="border-b border-border px-4 py-3 text-base text-muted-foreground">
            Nenhuma cliente encontrada.
          </li>
        )}
        <li>
          <button
            type="button"
            onClick={() => {
              if (!draft.name && term && !/^[-+()\d\s]+$/.test(term)) setDraft((current) => ({ ...current, name: term }))
              if (!draft.phone && /^[+()\d\s-]{3,}$/.test(term)) setDraft((current) => ({ ...current, phone: term }))
              setSelected('new')
            }}
            className={`${optionClass} font-semibold text-primary`}
          >
            <UserPlus className="size-5" aria-hidden="true" />
            {query.trim() ? `Cadastrar "${query.trim()}" como nova cliente` : 'Nova cliente'}
          </button>
        </li>
      </ul>
      {active && (page > 1 || result?.hasMore) && <nav aria-label="Páginas de clientes" className="flex justify-between gap-3">
        <button type="button" aria-disabled={page === 1 || loading} onClick={() => { if (page > 1 && !loading) setPage(page - 1) }} className="min-h-11 text-sm font-semibold aria-disabled:opacity-40">Anterior</button>
        <span className="self-center text-sm text-muted-foreground">Página {page}</span>
        <button type="button" aria-disabled={loading || !result?.hasMore} onClick={() => { if (!loading && result?.hasMore) setPage(page + 1) }} className="min-h-11 text-sm font-semibold aria-disabled:opacity-40">Próxima</button>
      </nav>}
      <FieldError>{errors.client_id?.[0]}</FieldError>
    </Field>
  )
}
