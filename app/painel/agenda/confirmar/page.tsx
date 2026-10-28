import { Suspense } from 'react'
import Link from 'next/link'
import { connection } from 'next/server'
import { CalendarCheck } from 'lucide-react'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'
import { WhatsAppIcon } from '@/components/icons'
import { addDays, dayOf, formatDayTitle, formatTime, isValidDay, todayISO } from '@/lib/agenda'
import { noClient, noService, serviceLabel } from '@/lib/format'
import { formatPhone, whatsappTo } from '@/lib/phone'
import { reminderMessage } from '@/lib/reminder'
import { BackLink } from '../../back-link'
import { EmptyState } from '../../empty-state'
import { PageHeader } from '../../page-header'
import { ListSkeleton } from '../../skeletons'
import { ConfirmToggle } from '../confirm-toggle'
import { getToConfirm } from '../data'

export const metadata = { title: 'Confirmar horários' }

export default function ConfirmarPage({ searchParams }: PageProps<'/painel/agenda/confirmar'>) {
  return (
    <>
      <BackLink href="/painel" label="Agenda" />
      <PageHeader title="Confirmar horários" />
      <Suspense fallback={<ListSkeleton count={3} />}>
        <ToConfirm searchParams={searchParams} />
      </Suspense>
    </>
  )
}

// Lembrete da véspera (docs/12-plano-agendamentos.md, etapa 5): um WhatsApp
// pronto para cada cliente e um toque para marcar quem confirmou.
async function ToConfirm({ searchParams }: Pick<PageProps<'/painel/agenda/confirmar'>, 'searchParams'>) {
  const { d } = await searchParams
  await connection()
  const today = todayISO()
  const tomorrow = addDays(today, 1)
  const day = typeof d === 'string' && isValidDay(d) && d >= today ? d : tomorrow
  const list = await getToConfirm(day)
  const confirmed = list.filter((a) => a.confirmed_at).length

  const choices = [
    { day: today, label: 'Hoje' },
    { day: tomorrow, label: 'Amanhã' },
    { day: addDays(today, 2), label: 'Depois de amanhã' },
  ]

  return (
    <>
      <nav aria-label="Dia" className="mb-6 grid grid-cols-3 gap-2">
        {choices.map((c) => (
          <Link
            key={c.day}
            href={`/painel/agenda/confirmar?d=${c.day}`}
            aria-current={c.day === day ? 'date' : undefined}
            className={cn(
              'flex h-12 items-center justify-center border text-sm font-semibold',
              c.day === day ? 'border-foreground bg-foreground text-white' : 'border-border bg-surface'
            )}
          >
            {c.label}
          </Link>
        ))}
      </nav>

      <div className="mb-4">
        <p className="font-serif text-2xl leading-tight">{formatDayTitle(day)}</p>
        {list.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {confirmed} de {list.length} {list.length === 1 ? 'confirmado' : 'confirmados'}
          </p>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="Nada para confirmar">
          Nenhum atendimento agendado neste dia.
        </EmptyState>
      ) : (
        <>
          <p className="mb-4 text-base text-muted-foreground">
            Toque em WhatsApp para mandar o lembrete. Quando a cliente responder, marque como confirmado.
          </p>
          <ul className="flex flex-col gap-3">
            {list.map((a) => {
              const time = formatTime(a.starts_at)
              const phone = a.clients?.phone
              const message = reminderMessage({
                name: a.clients?.name ?? '',
                service: serviceLabel(a),
                day: dayOf(a.starts_at),
                time,
                today,
              })
              return (
                <li
                  key={a.id}
                  className={cn(
                    'border-l-3 bg-surface p-4 shadow-card',
                    a.confirmed_at ? 'border-l-success' : 'border-l-primary'
                  )}
                >
                  <Link href={`/painel/agenda/${a.id}`} className="flex gap-4">
                    <span className="w-14 shrink-0 text-lg font-semibold">{time}</span>
                    <span className="min-w-0">
                      <span className="block text-base font-semibold">{a.clients?.name ?? noClient}</span>
                      <span className="block text-base text-muted-foreground">
                        {serviceLabel(a) ?? noService}
                      </span>
                    </span>
                  </Link>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {phone ? (
                      <a
                        href={whatsappTo(phone, message)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Mandar lembrete para ${formatPhone(phone)}`}
                        className={buttonVariants({ variant: 'outline', className: 'w-full' })}
                      >
                        <WhatsAppIcon className="size-5" />
                        WhatsApp
                      </a>
                    ) : (
                      <p className="flex items-center text-sm text-muted-foreground">Sem WhatsApp cadastrado</p>
                    )}
                    <ConfirmToggle key={`${a.id}-${!!a.confirmed_at}`} id={a.id} confirmed={!!a.confirmed_at} />
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </>
  )
}
