import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { formatDuration, formatPrice } from '@/lib/format'
import { groupByCategory } from '@/lib/services'
import { PageHeader } from '../page-header'
import { listAllServices } from './data'

export const metadata = { title: 'Serviços' }

export default function ServicosPage() {
  return (
    <>
      <PageHeader
        title="Serviços"
        action={
          <Link href="/painel/servicos/novo" className={buttonVariants({ size: 'sm' })}>
            <Plus aria-hidden="true" />
            Novo
          </Link>
        }
      />
      <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
        <ServiceList />
      </Suspense>
    </>
  )
}

async function ServiceList() {
  const services = await listAllServices()

  if (services.length === 0) {
    return <p className="text-muted-foreground">Nenhum serviço cadastrado.</p>
  }

  return (
    <div className="flex flex-col gap-10">
      {groupByCategory(services).map((group) => (
        <section key={group.title}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {group.title}
          </h2>
          <ul className="border-t border-border">
            {group.items.map((service) => (
              <li key={service.id} className="border-b border-border">
                <Link
                  href={`/painel/servicos/${service.id}`}
                  className="flex min-h-16 items-center gap-4 py-3 hover:bg-surface"
                >
                  <div className={service.active ? 'flex-1' : 'flex-1 opacity-50'}>
                    <p className="text-base font-semibold">{service.name}</p>
                    <p className="text-base text-muted-foreground">
                      {formatPrice(service.price)} ·{' '}
                      {formatDuration(service.duration_minutes, service.duration_up_to)}
                    </p>
                  </div>
                  {!service.active && (
                    <span className="border border-border px-2 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Desativado
                    </span>
                  )}
                  <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
