'use client'

import { useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatPhone } from '@/lib/phone'

type Client = { id: string; name: string; phone: string | null }

// "João" e "joao" são iguais na busca.
const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const MAX_RESULTS = 8

// Escolher a cliente digitando parte do nome ou do telefone, ou cadastrar uma nova.
export function ClientPicker({
  clients,
  values,
  errors,
  initialClientId,
}: {
  clients: Client[]
  values?: Record<string, string>
  errors: Record<string, string[] | undefined>
  initialClientId?: string
}) {
  const startId = values?.client_id ?? initialClientId ?? ''
  const [selected, setSelected] = useState<Client | 'new' | null>(
    startId === 'new' ? 'new' : (clients.find((c) => c.id === startId) ?? null)
  )
  const [query, setQuery] = useState('')

  const term = normalize(query)
  const digits = query.replace(/\D/g, '')
  const matches = clients
    .filter(
      (c) =>
        !term ||
        normalize(c.name).includes(term) ||
        (digits.length >= 3 && c.phone?.includes(digits))
    )
    .slice(0, MAX_RESULTS)

  const optionClass =
    'flex min-h-12 w-full items-center gap-3 border-b border-border px-4 py-2 text-left text-base hover:bg-muted'

  // Cliente escolhida: mostra o nome e a opção de trocar.
  if (selected && selected !== 'new') {
    return (
      <Field>
        <FieldLabel>Cliente</FieldLabel>
        <input type="hidden" name="client_id" value={selected.id} />
        <div className="flex min-h-12 items-center justify-between gap-4 border border-primary bg-surface px-4 py-2">
          <div>
            <p className="text-base font-semibold">{selected.name}</p>
            {selected.phone && (
              <p className="text-base text-muted-foreground">{formatPhone(selected.phone)}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
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
            id="new_client_name"
            name="new_client_name"
            autoComplete="off"
            defaultValue={values?.new_client_name ?? query}
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
            defaultValue={values?.new_client_phone}
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
      <FieldLabel htmlFor="client_search">Cliente</FieldLabel>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="client_search"
          type="search"
          autoComplete="off"
          placeholder="Digite o nome ou telefone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-invalid={!!errors.client_id}
          className="pl-12"
        />
      </div>
      <ul className="border-x border-t border-border bg-surface">
        {matches.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => setSelected(c)} className={optionClass}>
              <span className="flex-1 font-semibold">{c.name}</span>
              {c.phone && <span className="text-muted-foreground">{formatPhone(c.phone)}</span>}
            </button>
          </li>
        ))}
        {term && matches.length === 0 && (
          <li className="border-b border-border px-4 py-3 text-base text-muted-foreground">
            Nenhuma cliente com esse nome.
          </li>
        )}
        <li>
          <button
            type="button"
            onClick={() => setSelected('new')}
            className={`${optionClass} font-semibold text-primary`}
          >
            <UserPlus className="size-5" aria-hidden="true" />
            {query.trim() ? `Cadastrar "${query.trim()}" como nova cliente` : 'Nova cliente'}
          </button>
        </li>
      </ul>
      <FieldError>{errors.client_id?.[0]}</FieldError>
    </Field>
  )
}
