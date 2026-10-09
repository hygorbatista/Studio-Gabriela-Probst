'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatPhone } from '@/lib/phone'
import { saveClient, type ClientFormState } from './actions'

type Client = { id: string; name: string; phone: string | null; preferences: string | null }

export function ClientForm({ client }: { client?: Client }) {
  const [state, action, pending] = useActionState<ClientFormState, FormData>(
    saveClient.bind(null, client?.id ?? null),
    null
  )

  // Depois de um erro, mostra o que foi digitado; senão, o valor salvo.
  const value = (field: string, saved?: string | null) =>
    state?.values?.[field] ?? saved ?? ''
  const errors = state?.errors ?? {}

  return (
    <form action={action}>
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="off"
            defaultValue={value('name', client?.name)}
            aria-invalid={!!errors.name}
            required
          />
          <FieldError>{errors.name?.[0]}</FieldError>
        </Field>

        <Field data-invalid={!!errors.phone}>
          <FieldLabel htmlFor="phone">WhatsApp</FieldLabel>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="(48) 99999-9999"
            defaultValue={value('phone', client?.phone ? formatPhone(client.phone) : null)}
            aria-invalid={!!errors.phone}
          />
          <FieldError>{errors.phone?.[0]}</FieldError>
        </Field>

        <Field data-invalid={!!errors.preferences}>
          <FieldLabel htmlFor="preferences">Preferências</FieldLabel>
          <textarea
            id="preferences"
            name="preferences"
            rows={4}
            defaultValue={value('preferences', client?.preferences)}
            aria-invalid={!!errors.preferences}
            className="w-full border border-input bg-surface px-4 py-3 text-base outline-none focus-visible:border-primary aria-invalid:border-destructive"
          />
          <FieldDescription>Formato, cor preferida, alergias, o que ela gosta.</FieldDescription>
          <FieldError>{errors.preferences?.[0]}</FieldError>
        </Field>

        {state?.message && (
          <p role="alert" className="text-base text-destructive">
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Salvando...' : 'Salvar'}
        </Button>
      </FieldGroup>
    </form>
  )
}
