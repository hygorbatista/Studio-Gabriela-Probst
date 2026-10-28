import { Suspense } from 'react'
import Link from 'next/link'
import { connection } from 'next/server'
import { CalendarHeart, Clock, Plus } from 'lucide-react'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'
import { WhatsAppIcon } from '@/components/icons'
import { formatDayTitle } from '@/lib/agenda'
import { whatsappTo } from '@/lib/phone'
import { dueLabel, returnMessage } from '@/lib/return-due'
import { BackLink } from '../../back-link'
import { EmptyState } from '../../empty-state'
import { PageHeader } from '../../page-header'
import { ListSkeleton } from '../../skeletons'
import { sectionTitle } from '../../styles'
import { getReturnList } from '../data'

export const metadata = { title: 'Hora de voltar' }

export default function RetornosPage() {
  return (
    <>
      <BackLink href="/painel" label="Agenda" />
      <PageHeader title="Hora de voltar" />
      <p className="mb-6 text-base text-muted-foreground">
        Clientes com o retorno chegando ou vencido e nada marcado. Mande o convite e agende.
      </p>
      <Suspense fallback={<ListSkeleton count={4} />}>
        <Returns />
      </Suspense>
    </>
  )
}

async function Returns() {
  await connection()
  const list = await getReturnList()
  const due = list.filter((c) => !c.gone)
  const gone = list.filter((c) => c.gone)

  if (list.length === 0) {
    return (
      <EmptyState icon={CalendarHeart} title="Ninguém na hora de voltar">
        Todas as clientes estão com horário marcado ou ainda dentro do prazo de retorno.
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      {due.length > 0 && <Group items={due} />}
      {gone.length > 0 && (
        <section>
          <h2 className={cn(sectionTitle, 'mb-3')}>Sumidas</h2>
          <Group items={gone} />
        </section>
      )}
    </div>
  )
}

function Group({ items }: { items: Awaited<ReturnType<typeof getReturnList>> }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((c) => {
        const params = new URLSearchParams({ cliente: c.id })
        if (c.service) params.set('s', c.service.id)
        return (
          <li
            key={c.id}
            className={cn('border-l-3 bg-surface p-4 shadow-card', c.late > 0 ? 'border-l-primary' : 'border-l-border')}
          >
            <Link href={`/painel/clientes/${c.id}`} className="block">
              <span className="block text-base font-semibold">{c.name}</span>
              <span className={cn('block text-sm font-semibold', c.gone ? 'text-muted-foreground' : 'text-primary')}>
                {c.gone ? `Última visita há ${c.daysAway} dias` : dueLabel(c.late)}
              </span>
              <span className="block text-sm text-muted-foreground">
                Última vez: {formatDayTitle(c.lastDay).toLowerCase()}
                {c.service && `, ${c.service.name.toLowerCase()}`}
              </span>
            </Link>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {c.phone ? (
                <a
                  href={whatsappTo(c.phone, returnMessage(c))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'outline', className: 'w-full' })}
                >
                  <WhatsAppIcon className="size-5" />
                  Convidar
                </a>
              ) : (
                <p className="flex items-center text-sm text-muted-foreground">Sem WhatsApp cadastrado</p>
              )}
              <Link href={`/painel/agenda/novo?${params}`} className={buttonVariants({ className: 'w-full' })}>
                <Plus className="size-5" aria-hidden="true" />
                Agendar
              </Link>
            </div>
            {c.service && (
              <Link
                href={`/painel/agenda/livres?s=${c.service.id}`}
                className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-4"
              >
                <Clock className="size-4" aria-hidden="true" />
                Ver horários livres para oferecer
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}
