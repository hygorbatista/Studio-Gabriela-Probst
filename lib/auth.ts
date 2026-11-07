import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Exige login e devolve o cliente do Supabase já autenticado.
// Usar em toda página do painel e em toda Server Action: o proxy protege as
// páginas, mas uma Server Action pode ser chamada direto por POST.
export const requireUser = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims) {
    redirect('/login')
  }

  return { supabase, email: String(data.claims.email ?? '') }
})
