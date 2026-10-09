import type { Metadata } from 'next'
import { logout } from '../login/actions'
import { PainelNav } from './painel-nav'

export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s | Painel' },
  robots: { index: false, follow: false },
}

export default function PainelLayout({ children }: LayoutProps<'/painel'>) {
  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-5">
          <p className="font-serif text-xl">Gabriela Probst</p>
          <form action={logout}>
            <button
              type="submit"
              className="h-11 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      {/* pb-24: espaço para a barra de navegação fixa. */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pt-8 pb-24">
        {children}
      </main>

      <PainelNav />
    </div>
  )
}
