import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarCheck, CalendarClock, CalendarPlus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { WhatsAppIcon } from '@/components/icons'
import { dayOf, formatDayTitle, formatTime, todayISO } from '@/lib/agenda'
import { suggestReturn } from '@/lib/return-visit'
import { formatPrice, noClient, noService, paymentMethodLabels } from '@/lib/format'
import { whatsappTo } from '@/lib/phone'
import { ActionButton } from '../../action-button'
import { BackLink } from '../../back-link'
import { StatusBadge } from '../../status-badge'
import { reopenAppointment, setAppointmentStatus } from '../actions'
import { CompleteForm } from '../complete-form'
import { getAppointment, getNextScheduled } from '../data'
import { DetailSkeleton } from '../../skeletons'
import { card, dataLabel, sectionTitle } from '../../styles'

export const metadata = { title: 'Atendimento' }

export default function AtendimentoPage({ params, searchParams }: PageProps<'/painel/agenda/[id]'>) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <Appointment params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function Appointment({
  params,
  searchParams,
}: Pick<PageProps<'/painel/agenda/[id]'>, 'params' | 'searchParams'>) {
  const { id } = await params
  // Acabou de remarcar: destaca o aviso para a cliente.
  const rescheduled = (await searchParams).remarcado === '1'
  const a = /^[0-9a-f-]{36}$/i.test(id) ? await getAppointment(id) : null
  if (!a) notFound()

  const day = dayOf(a.starts_at)
  const dayTitle = formatDayTitle(day).toLowerCase()
  // "no sábado", "no domingo", "na segunda"...
  const when = `${/^(sábado|domingo)/.test(dayTitle) ? 'no' : 'na'} ${dayTitle}, às ${formatTime(a.starts_at)}`
  const client = a.clients
  const payment = a.payments
  const firstName = client?.name.split(' ')[0]
  const confirmation = rescheduled
    ? `Olá, ${firstName}! Seu horário de ${a.services?.name} foi remarcado para ${when.slice(3)}. Até lá!`
    : `Olá, ${firstName}! Confirmando seu horário de ${a.services?.name} ${when}. Até lá!`

  return (
    <>
      <BackLink href={`/painel?d=${day}`} label="Agenda" />

      <div className="mb-10">
        <StatusBadge status={a.status} />
        <h1 className="mt-3 font-serif text-4xl">{a.services?.name ?? noService}</h1>
        <p className="mt-2 text-base">
          {formatDayTitle(day)} ·{' '}
          {a.time_known ? `${formatTime(a.starts_at)} às ${formatTime(a.ends_at)}` : 'sem horário'}
        </p>
        {!client && <p className="text-base text-muted-foreground">{noClient}</p>}
        {client && (
          <Link
            href={`/painel/clientes/${client.id}`}
            className="mt-1 inline-flex min-h-11 items-center text-base font-semibold text-primary underline underline-offset-4"
          >
            {client.name}
          </Link>
        )}
        <p className="text-base text-muted-foreground">{formatPrice(a.price_charged)}</p>
        {a.notes && <p className="mt-4 border-l-2 border-border pl-4 text-base">{a.notes}</p>}
      </div>

      <div className="flex flex-col gap-10">
        {a.status === 'scheduled' && (
          <>
            {rescheduled && (
              <p role="status" className="border border-primary bg-surface p-4 text-base">
                <strong>Remarcado</strong> para {when.slice(3)}.
                {client?.phone && ' Avise a cliente da nova data:'}
              </p>
            )}

            <div className="grid gap-2">
              {client?.phone && (
                <a
                  href={whatsappTo(client.phone, confirmation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    variant: rescheduled ? 'default' : 'outline',
                    className: 'w-full',
                  })}
                >
                  <WhatsAppIcon className="size-5" />
                  {rescheduled ? 'Avisar da nova data' : 'Enviar confirmação'}
                </a>
              )}
              <Link
                href={`/painel/agenda/${a.id}/remarcar`}
                className={buttonVariants({ variant: 'outline', className: 'w-full' })}
              >
                <CalendarClock className="size-5" aria-hidden="true" />
                Remarcar
              </Link>
            </div>

            {/* Alvo do "Concluir" da agenda (#concluir). */}
            <section id="concluir" className="scroll-mt-6">
              <h2 className={`${sectionTitle} mb-4`}>Concluir</h2>
              <CompleteForm id={a.id} price={a.price_charged} />
            </section>

            <section className="grid grid-cols-2 gap-2 border-t border-border pt-8">
              <ActionButton
                action={setAppointmentStatus.bind(null, a.id, 'no_show')}
                label="Faltou"
                pendingLabel="Salvando..."
                confirm={{
                  title: 'A cliente faltou?',
                  description: 'O atendimento fica marcado como falta e não entra no faturamento.',
                  confirmLabel: 'Sim, faltou',
                }}
              />
              <ActionButton
                action={setAppointmentStatus.bind(null, a.id, 'cancelled')}
                label="Cancelar"
                pendingLabel="Cancelando..."
                confirm={{
                  title: 'Cancelar este atendimento?',
                  description: 'O horário fica livre para outra cliente.',
                  confirmLabel: 'Cancelar atendimento',
                }}
                variant="destructive"
              />
            </section>
          </>
        )}

        {a.status === 'completed' && client && (
          <ReturnVisit
            clientId={client.id}
            firstName={firstName ?? ''}
            serviceId={a.services?.id}
            serviceName={a.services?.name}
            returnDays={a.services?.return_days}
            day={day}
            time={a.time_known ? formatTime(a.starts_at) : null}
            startsAt={a.starts_at}
          />
        )}

        {a.status === 'completed' && payment && (
          <section className={card}>
            <h2 className={dataLabel}>Pagamento</h2>
            <p className="mt-2 text-2xl font-semibold">{formatPrice(payment.amount)}</p>
            <p className="text-base text-muted-foreground">
              {paymentMethodLabels[payment.method]}
            </p>
          </section>
        )}

        {a.status !== 'scheduled' && (
          <ActionButton
            action={reopenAppointment.bind(null, a.id)}
            label="Reabrir atendimento"
            pendingLabel="Reabrindo..."
            confirm={{
              title: 'Reabrir este atendimento?',
              description:
                a.status === 'completed'
                  ? 'Ele volta a ficar agendado e o pagamento registrado é apagado.'
                  : 'Ele volta a ficar agendado.',
              confirmLabel: 'Reabrir',
            }}
            variant="link"
            className="w-full text-muted-foreground"
          />
        )}
      </div>
    </>
  )
}

// "Agendar o retorno?" depois de concluir (docs/12-plano-agendamentos.md, 4.1):
// um toque abre o Agendar com cliente, serviço, dia e hora preenchidos.
async function ReturnVisit({
  clientId,
  firstName,
  serviceId,
  serviceName,
  returnDays,
  day,
  time,
  startsAt,
}: {
  clientId: string
  firstName: string
  serviceId?: string
  serviceName?: string
  returnDays?: number | null
  day: string
  time: string | null
  startsAt: string
}) {
  const next = await getNextScheduled(clientId, startsAt)

  // Já tem horário marcado depois deste: o retorno está garantido.
  if (next) {
    return (
      <Link
        href={`/painel/agenda/${next.id}`}
        className="flex min-h-12 items-center gap-3 border border-border bg-surface px-4 py-3 text-base hover:border-foreground"
      >
        <CalendarCheck className="size-5 shrink-0 text-success" aria-hidden="true" />
        <span>
          Retorno já marcado: <strong>{formatDayTitle(dayOf(next.starts_at)).toLowerCase()}</strong>, às{' '}
          {formatTime(next.starts_at)}
        </span>
      </Link>
    )
  }

  const suggestion = suggestReturn({ day, time, returnDays, today: todayISO() })
  if (!suggestion || !serviceId) return null

  const params = new URLSearchParams({ cliente: clientId, s: serviceId, d: suggestion.day })
  if (suggestion.time) params.set('h', suggestion.time)

  return (
    <section className="border-l-3 border-l-primary bg-surface p-5 shadow-card">
      <h2 className="font-serif text-2xl">Agendar o retorno?</h2>
      <p className="mt-2 text-base text-muted-foreground">
        Para {serviceName?.toLowerCase()}, o retorno é em {returnDays} dias:{' '}
        <strong className="text-foreground">
          {formatDayTitle(suggestion.day).toLowerCase()}
          {suggestion.time && `, às ${suggestion.time}`}
        </strong>
        . Dá para marcar com a {firstName || 'cliente'} antes de ela ir embora.
      </p>
      <div className="mt-4 grid gap-2">
        <Link href={`/painel/agenda/novo?${params}`} className={buttonVariants({ className: 'w-full' })}>
          <CalendarPlus className="size-5" aria-hidden="true" />
          Agendar o retorno
        </Link>
        <Link
          href={`/painel/agenda/novo?cliente=${clientId}&s=${serviceId}`}
          className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-primary underline underline-offset-4"
        >
          Escolher outra data
        </Link>
      </div>
    </section>
  )
}
