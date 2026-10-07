'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './actions'

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    null
  )

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
        E-mail
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 border border-[#D6D6D6] bg-white px-3 text-base font-normal normal-case tracking-normal outline-none focus:border-[#6E1628]"
        />
      </label>

      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
        Senha
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 border border-[#D6D6D6] bg-white px-3 text-base font-normal normal-case tracking-normal outline-none focus:border-[#6E1628]"
        />
      </label>

      {state?.error && (
        <p role="alert" className="text-sm text-[#BA1A1A]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-12 border border-[#6E1628] bg-[#6E1628] text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#881D33] disabled:opacity-60"
      >
        {pending ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
