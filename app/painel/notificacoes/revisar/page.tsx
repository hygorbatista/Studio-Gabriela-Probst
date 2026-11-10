import { Suspense } from 'react'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { formatWhen, formatPrice, noClient } from '@/lib/format'
import { BackLink } from '../../back-link'
import { PageHeader } from '../../page-header'
import { ListSkeleton } from '../../skeletons'

export const metadata = { title: 'Revisar notificações' }

export default function ReviewPage({ searchParams }: PageProps<'/painel/notificacoes/revisar'>) {
  return (
    <>
      <BackLink href="/painel/notificacoes" label="Notificações" />
      <Suspense fallback={<ListSkeleton />}><Review searchParams={searchParams} /></Suspense>
    </>
  )
}

async function Review({ searchParams }: Pick<PageProps<'/painel/notificacoes/revisar'>, 'searchParams'>) {
  const { tipo } = await searchParams
  const { supabase } = await requireUser()
  if (tipo === 'aniversarios') {
    const { data, error } = await supabase.rpc('panel_birthdays_today')
    if (error) throw error
    return (
      <>
        <PageHeader title="Aniversariantes de hoje" />
        {data.length ? <ul className="divide-y divide-border">
          {data.map((client) => (
            <li key={client.id}>
              <Link href={`/painel/clientes/${client.id}`} className="flex min-h-12 items-center font-semibold text-primary">
                {client.name}
              </Link>
            </li>
          ))}
        </ul> : <p>Nenhum aniversário cadastrado para hoje.</p>}
      </>
    )
  }

  const { data, error } = await supabase.from('appointments')
    .select('id,starts_at,time_known,price_charged,clients(name)')
    .eq('status', 'scheduled')
    .lt('ends_at', new Date().toISOString())
    .order('starts_at')
    .order('id')
  if (error) throw error

  return (
    <>
      <PageHeader title="Atendimentos pendentes" />
      {data.length ? <ul className="divide-y divide-border">
        {data.map((item) => (
          <li key={item.id}>
            <Link href={`/painel/agenda/${item.id}`} className="flex min-h-16 items-center justify-between gap-3 py-3">
              <span>
                <span className="block font-semibold text-primary">{item.clients?.name ?? noClient}</span>
                <span className="block text-sm text-muted-foreground">{formatWhen(item.starts_at, item.time_known)}</span>
              </span>
              <span className="shrink-0 text-sm">{formatPrice(item.price_charged)} previstos</span>
            </Link>
          </li>
        ))}
      </ul> : <p>Nenhum atendimento pendente de revisão.</p>}
    </>
  )
}
