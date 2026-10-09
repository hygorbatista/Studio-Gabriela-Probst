'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Sparkles, Users } from 'lucide-react'
import { cn } from 'cn'

const items = [
  { href: '/painel', label: 'Agenda', icon: CalendarDays },
  { href: '/painel/clientes', label: 'Clientes', icon: Users },
  { href: '/painel/servicos', label: 'Serviços', icon: Sparkles },
]

// Barra fixa embaixo: no celular, fica ao alcance do polegar.
// O endereço só é conhecido na hora do acesso: a barra sai pronta sem destaque
// e a aba ativa aparece em seguida.
export function PainelNav() {
  return (
    <Suspense fallback={<NavBar pathname="" />}>
      <ActiveNavBar />
    </Suspense>
  )
}

function ActiveNavBar() {
  return <NavBar pathname={usePathname()} />
}

function NavBar({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Painel"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/painel'
              ? pathname === href || pathname.startsWith('/painel/agenda')
              : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold uppercase tracking-[0.15em] transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
