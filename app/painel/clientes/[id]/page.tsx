import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, CalendarPlus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { WhatsAppIcon } from '@/components/icons'
import { cn } from 'cn'
import { daysAgo, formatNextVisit } from '@/lib/client-list'
import { clientStats, formatBirthday } from '@/lib/client-stats'
import { formatDateTime, formatPrice, statusLabels } from '@/lib/format'
import { formatPhone, whatsappTo } from '@/lib/phone'
import { BackLink } from '../../back-link'
import { DeleteButton } from '../../delete-button'
import { EmptyState } from '../../empty-state'
import { deleteClient } from '../actions'
import { ClientForm } from '../client-form'
import { getClient } from '../data'
import { Initials } from '../initials'
import { DetailSkeleton } from '../../skeletons'
import { card, dataLabel, sectionTitle } from '../../styles'

export const metadata = { title: 'Cliente' }

// Bolinha da linha do tempo, na cor do status.
const dotColors: Record<string, string> = {
  scheduled: 'bg-primary',
  completed: 'bg-success',
  cancelled: 'bg-muted-foreground/50',
  no_show: 'bg-destructive',
}

export default function ClientePage({ params }: PageProps<'/painel/clientes/[id]'>) {
  return (
    <>
      <BackLink href="/painel/clientes" label="Clientes" />
      <Suspense fallback={<DetailSkeleton />}>
        <ClientDetail params={params} />
      </Suspense>
    </>
  )
}

async function ClientDetail({ params }: Pick<PageProps<'/painel/clientes/[id]'>, 'params'>) {
  const { id } = await params
  const client = /^[0-9a-f-]{36}$/i.test(id) ? await getClient(id) : null
  if (!client) notFound()

  const firstName = client.name.split(' ')[0]
  const stats = clientStats(client.appointments)
  // Os três números que ela olha primeiro.
  const highlights = [
    { label: 'Total gasto', value: formatPrice(stats.totalSpent) },
    { label: 'Atendimentos', value: String(stats.visits) },
    { label: 'Última visita', value: stats.lastVisit ? daysAgo(stats.lastVisit) : '—' },
  ]
  const details = [
    { label: 'Próximo horário', value: stats.nextVisit ? formatNextVisit(stats.nextVisit) : '—' },
    { label: 'Serviço favorito', value: stats.favoriteService ?? '—' },
    { label: 'Horário favorito', value: stats.favoriteTime ?? '—' },
    { label: 'Média por atendimento', value: stats.visits ? formatPrice(stats.averageTicket) : '—' },
    { label: 'Aniversário', value: client.birth_date ? formatBirthday(client.birth_date) : '—' },
  ]

  return (
    <div className="flex flex-col gap-10">
      <div>
        <div className="flex items-center gap-4">
          <Initials name={client.name} className="size-16 text-xl" />
          <h1 className="min-w-0 font-serif text-3xl leading-tight sm:text-4xl">{client.name}</h1>
        </div>
        <div className="mt-6 grid gap-2">
          <Link
            href={`/painel/agenda/novo?cliente=${client.id}`}
            className={buttonVariants({ className: 'w-full' })}
          >
            <CalendarPlus className="size-5" aria-hidden="true" />
            Agendar
          </Link>
          {client.phone && (
            <a
              href={whatsappTo(client.phone, `Olá, ${firstName}!`)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', className: 'w-full' })}
            >
              <WhatsAppIcon className="size-5" />
              {formatPhone(client.phone)}
            </a>
          )}
        </div>
      </div>

      {/* Calculado dos atendimentos concluídos: nada é digitado à mão. */}
      <section aria-label="Resumo" className={card}>
        <dl className="grid grid-cols-3 gap-3">
          {highlights.map((item) => (
            <div key={item.label}>
              <dt className={dataLabel}>{item.label}</dt>
              <dd className="mt-1 font-serif text-xl leading-tight sm:text-2xl">{item.value}</dd>
            </div>
          ))}
        </dl>
        <dl className="mt-5 divide-y divide-border border-t border-border">
          {details.map((item) => (
            <div key={item.label} className="flex items-baseline justify-between gap-4 py-3">
              <dt className={dataLabel}>{item.label}</dt>
              <dd className="text-right text-base font-semibold">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className={`${sectionTitle} mb-4`}>Atendimentos</h2>
        {client.appointments.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Nenhum atendimento ainda">
            Toque em Agendar para marcar o primeiro.
          </EmptyState>
        ) : (
          // Linha do tempo: uma linha vertical com uma bolinha por atendimento.
          <ol className="relative ml-1.5 border-l border-border">
            {client.appointments.map((a) => (
              <li key={a.id} className="relative">
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-5 -left-1.25 size-2.5 rounded-full ring-4 ring-background',
                    dotColors[a.status]
                  )}
                />
                <Link
                  href={`/painel/agenda/${a.id}`}
                  className="ml-4 flex min-h-16 items-center gap-4 px-2 py-3 hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-base font-semibold', a.status === 'cancelled' && 'line-through')}>
                      {a.services?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(a.starts_at)} · {statusLabels[a.status]}
                    </p>
                  </div>
                  <p className="text-base">{formatPrice(a.price_charged)}</p>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2 className={`${sectionTitle} mb-6`}>Dados</h2>
        <ClientForm client={client} />
      </section>

      <section className="border-t border-border pt-8">
        <DeleteButton
          action={deleteClient.bind(null, client.id)}
          label="Excluir cliente"
          name={client.name}
        />
      </section>
    </div>
  )
}
