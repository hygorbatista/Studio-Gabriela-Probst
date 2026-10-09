import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPhone } from '@/lib/phone'
import { PageHeader } from '../page-header'
import { searchClients } from './data'
import { SearchInput } from './search-input'

export const metadata = { title: 'Clientes' }

export default function ClientesPage({ searchParams }: PageProps<'/painel/clientes'>) {
  return (
    <>
      <PageHeader
        title="Clientes"
        action={
          <Link href="/painel/clientes/nova" className={buttonVariants({ size: 'sm' })}>
            <Plus aria-hidden="true" />
            Nova
          </Link>
        }
      />
      <form role="search" className="mb-6">
        <Suspense fallback={<Input disabled placeholder="Buscar por nome ou telefone" />}>
          <SearchInput />
        </Suspense>
      </form>
      <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
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
    return (
      <p className="text-muted-foreground">
        {term ? 'Nenhuma cliente encontrada.' : 'Nenhuma cliente cadastrada ainda.'}
      </p>
    )
  }

  return (
    <ul className="border-t border-border">
      {clients.map((client) => (
        <li key={client.id} className="border-b border-border">
          <Link
            href={`/painel/clientes/${client.id}`}
            className="flex min-h-16 items-center gap-4 py-3 hover:bg-surface"
          >
            <div className="flex-1">
              <p className="text-base font-semibold">{client.name}</p>
              {client.phone && (
                <p className="text-base text-muted-foreground">{formatPhone(client.phone)}</p>
              )}
            </div>
            <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
