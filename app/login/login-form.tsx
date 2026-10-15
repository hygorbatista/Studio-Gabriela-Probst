'use client'

import { useActionState, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { login, type LoginState } from './actions'

// returnTo: a tela do painel onde ela estava quando a sessão expirou.
export function LoginForm({ returnTo }: { returnTo?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, null)
  // No celular é fácil errar a senha: o botão do olho mostra o que foi digitado.
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={formAction}>
      {returnTo && <input type="hidden" name="voltar" value={returnTo} />}
      <FieldGroup>
        <Field data-invalid={!!state?.error}>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            defaultValue={state?.email}
            aria-invalid={!!state?.error}
            required
          />
        </Field>

        <Field data-invalid={!!state?.error}>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              aria-invalid={!!state?.error}
              className="pr-14"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Esconder a senha' : 'Mostrar a senha'}
              aria-pressed={showPassword}
              className="absolute top-0 right-0 inline-flex size-12 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-5" aria-hidden="true" />
              ) : (
                <Eye className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </Field>

        {state?.error && (
          <p role="alert" className="text-base text-destructive">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Entrando...' : 'Entrar'}
        </Button>
      </FieldGroup>
    </form>
  )
}
