import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { WhatsAppIcon } from '@/components/icons'
import { clientStats, formatBirthday } from '@/lib/client-stats'
import { formatDateTime, formatPrice, statusLabels } from '@/lib/format'
import { formatPhone, whatsappTo } from '@/lib/phone'
import { BackLink } from '../../back-link'
import { DeleteButton } from '../../delete-button'
import { deleteClient } from '../actions'
import { ClientForm } from '../client-form'
import { getClient } from '../data'

export const metadata = { title: 'Cliente' }

export default function ClientePage({ params }: PageProps<'/painel/clientes/[id]'>) {
  return (
    <>
      <BackLink href="/painel/clientes" label="Clientes" />
      <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
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
  const summary = [
    { label: 'Total gasto', value: formatPrice(stats.totalSpent) },
    { label: 'Atendimentos', value: String(stats.visits) },
    { label: 'Ticket médio', value: stats.visits ? formatPrice(stats.averageTicket) : '—' },
    { label: 'Última visita', value: stats.lastVisit ? formatDateTime(stats.lastVisit) : '—' },
    { label: 'Próximo horário', value: stats.nextVisit ? formatDateTime(stats.nextVisit) : '—' },
    { label: 'Serviço favorito', value: stats.favoriteService ?? '—' },
    { label: 'Horário favorito', value: stats.favoriteTime ?? '—' },
    {
      label: 'Aniversário',
      value: client.birth_date ? formatBirthday(client.birth_date) : '—',
    },
  ]

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="font-serif text-4xl">{client.name}</h1>
        {client.phone && (
          <a
            href={whatsappTo(client.phone, `Olá, ${firstName}!`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ className: 'mt-6 w-full' })}
          >
            <WhatsAppIcon className="size-5" />
            {formatPhone(client.phone)}
          </a>
        )}
      </div>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Resumo
        </h2>
        {/* Calculado dos atendimentos concluídos: nada é digitado à mão. */}
        <dl className="grid grid-cols-2 border-t border-l border-border">
          {summary.map((item) => (
            <div key={item.label} className="border-r border-b border-border bg-surface p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-1 text-base font-semibold">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Atendimentos
        </h2>
        {client.appointments.length === 0 ? (
          <p className="border-t border-border pt-4 text-muted-foreground">
            Nenhum atendimento ainda.
          </p>
        ) : (
          <ul className="border-t border-border">
            {client.appointments.map((a) => (
              <li key={a.id} className="border-b border-border">
                <Link
                  href={`/painel/agenda/${a.id}`}
                  className="flex min-h-16 items-center gap-4 py-3 hover:bg-surface"
                >
                  <div className="flex-1">
                    <p className="text-base font-semibold">{a.services?.name}</p>
                    <p className="text-base text-muted-foreground">
                      {formatDateTime(a.starts_at)} · {statusLabels[a.status]}
                    </p>
                  </div>
                  <p className="text-base">{formatPrice(a.price_charged)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Dados
        </h2>
        <ClientForm client={client} />
      </section>

      <section className="border-t border-border pt-8">
        <DeleteButton
          action={deleteClient.bind(null, client.id)}
          label="Excluir cliente"
          confirmText={`Excluir "${client.name}"? Não dá para desfazer.`}
        />
      </section>
    </div>
  )
}
