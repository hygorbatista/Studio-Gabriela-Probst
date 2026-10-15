'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// email volta para o formulário não apagar o que foi digitado.
export type LoginState = { error: string; email: string } | null

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Informe o e-mail e a senha.', email }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'E-mail ou senha incorretos. Confira e tente de novo.', email }
  }

  redirect('/painel')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
