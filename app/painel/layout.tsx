import type { Metadata } from 'next'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { logout } from '../login/actions'
import { Flash } from './flash'
import { PainelNav } from './painel-nav'

export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s | Painel' },
  robots: { index: false, follow: false },
}

export default function PainelLayout({ children }: LayoutProps<'/painel'>) {
  return (
    <div className="painel-theme flex flex-1 flex-col bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-5">
          {/* Monograma "G": o mesmo do ícone do site e do app. */}
          <Link href="/painel" className="flex min-h-11 items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center bg-foreground font-serif text-xl leading-none text-white"
            >
              G
            </span>
            <span className="font-serif text-xl">Gabriela Probst</span>
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sair
            </button>
          </form>
        </div>
      </header>

      {/* pb-24: espaço para a barra de navegação fixa. */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pt-8 pb-24">
        {children}
      </main>

      <Flash />
      <PainelNav />
    </div>
  )
}
