import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus, Search, Users } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from 'cn'
import { clientContext } from '@/lib/client-list'
import { formatPhone } from '@/lib/phone'
import { Initials } from './initials'
import { EmptyState } from '../empty-state'
import { PageHeader } from '../page-header'
import { searchClients } from './data'
import { ReturnLink } from '../agenda/return-link'
import { SearchInput } from './search-input'
import { ListSkeleton } from '../skeletons'

export const metadata = { title: 'Clientes' }

export default function ClientesPage({ searchParams }: PageProps<'/painel/clientes'>) {
  return (
    <>
      <PageHeader
        title="Clientes"
        action={
          <Link href="/painel/clientes/nova" className={buttonVariants({ size: 'sm' })}>
            <Plus aria-hidden="true" />
            Nova cliente
          </Link>
        }
      />
      <form role="search" className="mb-6">
        <Suspense fallback={<Input disabled placeholder="Buscar por nome ou telefone" />}>
          <SearchInput />
        </Suspense>
      </form>
      <Suspense fallback={null}>
        <ReturnLink className="mb-8" />
      </Suspense>
      <Suspense fallback={<ListSkeleton />}>
        <ClientList searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function ClientList({ searchParams }: Pick<PageProps<'/painel/clientes'>, 'searchParams'>) {
  const { q } = await searchParams
  const term = typeof q === 'string' ? q : ''
  const clients = await searchClients(term)

  if (clients.length === 0) {
    const action = (
      <Link href="/painel/clientes/nova" className={buttonVariants()}>
        <Plus className="size-5" aria-hidden="true" />
        Cadastrar cliente
      </Link>
    )
    return term ? (
      <EmptyState icon={Search} title="Nenhuma cliente encontrada" action={action}>
        Confira o nome ou o telefone, ou cadastre uma cliente nova.
      </EmptyState>
    ) : (
      <EmptyState icon={Users} title="Nenhuma cliente ainda" action={action}>
        Cadastre a primeira para agendar e acompanhar o histórico dela.
      </EmptyState>
    )
  }

  // Buscando por telefone, o telefone aparece para ela conferir.
  const showPhone = term.replace(/\D/g, '').length >= 3
  const now = new Date()

  return (
    <ul className="divide-y divide-border bg-surface shadow-card">
      {clients.map((client) => {
        const context = clientContext(client.appointments, now)
        return (
          <li key={client.id}>
            <Link
              href={`/painel/clientes/${client.id}`}
              className="flex min-h-18 items-center gap-3 px-4 py-3 hover:bg-muted/50"
            >
              <Initials name={client.name} />
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold">{client.name}</p>
                <p className={cn('text-sm', context.kind === 'next' ? 'font-semibold text-primary' : 'text-muted-foreground')}>
                  {context.text}
                </p>
                {showPhone && client.phone && (
                  <p className="text-sm text-muted-foreground">{formatPhone(client.phone)}</p>
                )}
              </div>
              <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
