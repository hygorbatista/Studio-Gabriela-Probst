import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { todayISO } from '@/lib/agenda'
import { formatDuration, formatPrice, promoActive } from '@/lib/format'
import { groupByCategory } from '@/lib/services'
import { EmptyState } from '../empty-state'
import { PageHeader } from '../page-header'
import { listAllServices } from './data'
import { ListSkeleton } from '../skeletons'
import { sectionTitle } from '../styles'

export const metadata = { title: 'Serviços' }

export default function ServicosPage() {
  return (
    <>
      <PageHeader
        title="Serviços"
        action={
          <Link href="/painel/servicos/novo" className={buttonVariants({ size: 'sm' })}>
            <Plus aria-hidden="true" />
            Novo serviço
          </Link>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <ServiceList />
      </Suspense>
    </>
  )
}

async function ServiceList() {
  const services = await listAllServices()
  const today = todayISO()

  if (services.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Nenhum serviço ainda"
        action={
          <Link href="/painel/servicos/novo" className={buttonVariants()}>
            <Plus className="size-5" aria-hidden="true" />
            Cadastrar serviço
          </Link>
        }
      >
        Os serviços aparecem no site e na hora de agendar.
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      {groupByCategory(services).map((group) => (
        <section key={group.title}>
          <h2 className={`${sectionTitle} mb-2`}>{group.title}</h2>
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
                    {promoActive(service, today) && (
                      <p className="text-sm font-semibold text-primary">
                        Promoção: {formatPrice(service.promo_price!)} até{' '}
                        {service.promo_until!.slice(8)}/{service.promo_until!.slice(5, 7)}
                      </p>
                    )}
                  </div>
                  {!service.active && (
                    <span className="bg-muted px-2 py-1 text-sm font-semibold text-muted-foreground">
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
