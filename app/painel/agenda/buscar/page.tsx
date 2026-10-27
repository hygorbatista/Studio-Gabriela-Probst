import { Suspense } from 'react'
import Link from 'next/link'
import { connection } from 'next/server'
import { CalendarClock, Plus, Search } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { WhatsAppIcon } from '@/components/icons'
import { dayOf, formatDayTitle, formatTime } from '@/lib/agenda'
import { noService } from '@/lib/format'
import { formatPhone, whatsappTo } from '@/lib/phone'
import { BackLink } from '../../back-link'
import { EmptyState } from '../../empty-state'
import { PageHeader } from '../../page-header'
import { ListSkeleton } from '../../skeletons'
import { ConfirmedBadge } from '../confirmed-badge'
import { searchAgenda } from '../data'
import { AgendaSearch } from '../views/shared'

export const metadata = { title: 'Buscar na agenda' }

export default function BuscarPage({ searchParams }: PageProps<'/painel/agenda/buscar'>) {
  return (
    <>
      <BackLink href="/painel" label="Agenda" />
      <PageHeader title="Buscar na agenda" />
      <Suspense fallback={<ListSkeleton count={3} />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </>
  )
}

// "Quando é o horário da Ana?" (docs/12-plano-agendamentos.md, item 3.2): os
// próximos horários de cada cliente encontrada, com Remarcar e WhatsApp.
async function Results({ searchParams }: Pick<PageProps<'/painel/agenda/buscar'>, 'searchParams'>) {
  const { q } = await searchParams
  await connection()
  const term = typeof q === 'string' ? q : ''
  const clients = await searchAgenda(term)
  const now = new Date().toISOString()

  return (
    <>
      <AgendaSearch defaultValue={term} autoFocus={!term} />

      {!term.trim() ? (
        <p className="text-base text-muted-foreground">Digite o nome ou o telefone da cliente.</p>
      ) : clients.length === 0 ? (
        <EmptyState icon={Search} title="Nenhuma cliente encontrada">
          Confira o nome ou busque pelo telefone.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-4">
          {clients.map((c) => {
            const upcoming = c.appointments.filter((a) => a.status === 'scheduled' && a.starts_at >= now)
            const last = c.appointments.filter((a) => a.status === 'completed').at(-1)
            return (
              <li key={c.id} className="bg-surface p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/painel/clientes/${c.id}`}
                      className="text-lg font-semibold underline-offset-4 hover:underline"
                    >
                      {c.name}
                    </Link>
                    {c.phone && <p className="text-sm text-muted-foreground">{formatPhone(c.phone)}</p>}
                  </div>
                  {c.phone && (
                    <a
                      href={whatsappTo(c.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`WhatsApp de ${c.name}`}
                      className={buttonVariants({ variant: 'outline', size: 'icon', className: 'size-11 shrink-0' })}
                    >
                      <WhatsAppIcon className="size-5" />
                    </a>
                  )}
                </div>

                {upcoming.length === 0 ? (
                  <p className="mt-3 text-base text-muted-foreground">Nada marcado.</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {upcoming.map((a) => (
                      <li key={a.id} className="flex items-center gap-3 border-l-3 border-l-primary bg-background py-2 pr-2 pl-3">
                        <Link href={`/painel/agenda/${a.id}`} className="min-w-0 flex-1">
                          <span className="block text-base font-semibold">
                            {formatDayTitle(dayOf(a.starts_at))}
                            {a.time_known && `, às ${formatTime(a.starts_at)}`}
                          </span>
                          <span className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                            {a.services?.name ?? noService}
                            {a.confirmed_at && <ConfirmedBadge />}
                          </span>
                        </Link>
                        <Link
                          href={`/painel/agenda/${a.id}/remarcar`}
                          className="inline-flex h-11 shrink-0 items-center gap-1.5 px-2 text-sm font-semibold text-primary"
                        >
                          <CalendarClock className="size-4" aria-hidden="true" />
                          Remarcar
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {last && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Última vez: {formatDayTitle(dayOf(last.starts_at)).toLowerCase()}
                    {last.services?.name && `, ${last.services.name.toLowerCase()}`}
                  </p>
                )}

                <Link
                  href={`/painel/agenda/novo?cliente=${c.id}`}
                  className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-4"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Agendar para {c.name.split(' ')[0]}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
