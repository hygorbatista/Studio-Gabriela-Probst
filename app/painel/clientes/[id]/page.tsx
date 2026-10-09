import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { WhatsAppIcon } from '@/components/icons'
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
          Atendimentos
        </h2>
        {client.appointments.length === 0 ? (
          <p className="border-t border-border pt-4 text-muted-foreground">
            Nenhum atendimento ainda.
          </p>
        ) : (
          <ul className="border-t border-border">
            {client.appointments.map((a) => (
              <li key={a.id} className="flex items-center gap-4 border-b border-border py-3">
                <div className="flex-1">
                  <p className="text-base font-semibold">{a.services?.name}</p>
                  <p className="text-base text-muted-foreground">
                    {formatDateTime(a.starts_at)} · {statusLabels[a.status]}
                  </p>
                </div>
                <p className="text-base">{formatPrice(a.price_charged)}</p>
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
