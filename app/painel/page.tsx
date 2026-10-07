import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '../login/actions'

export const metadata = {
  title: 'Painel',
  robots: { index: false, follow: false },
}

async function PainelContent() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims) {
    redirect('/login')
  }

  return (
    <>
      <p>Logada como {String(data.claims.email)}</p>
      <form action={logout}>
        <button
          type="submit"
          className="h-12 border border-foreground px-8 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-foreground hover:text-white"
        >
          Sair
        </button>
      </form>
    </>
  )
}

export default function PainelPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 bg-background px-5 py-12 text-foreground">
      <h1 className="text-3xl">Painel</h1>
      <Suspense fallback={<p>Carregando...</p>}>
        <PainelContent />
      </Suspense>
    </main>
  )
}
