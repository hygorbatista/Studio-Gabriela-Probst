import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarCheck, CalendarClock, CalendarPlus, Pencil } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { WhatsAppIcon } from '@/components/icons'
import { dayOf, formatDayTitle, formatTime, todayISO } from '@/lib/agenda'
import { returnDaysOf, suggestReturn } from '@/lib/return-visit'
import { formatPrice, noClient, noService, paymentMethodLabels, serviceLabel } from '@/lib/format'
import { whatsappTo } from '@/lib/phone'
import { ActionButton } from '../../action-button'
import { BackLink } from '../../back-link'
import { StatusBadge } from '../../status-badge'
import { reopenAppointment, setAppointmentStatus } from '../actions'
import { CompleteForm } from '../complete-form'
import { ConfirmToggle } from '../confirm-toggle'
import { ConfirmedBadge } from '../confirmed-badge'
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
  const label = serviceLabel(a)?.toLowerCase()
  // Todos os serviços do atendimento (antigos têm só o principal).
  const serviceIds = a.appointment_services.length
    ? a.appointment_services.map((i) => i.service_id)
    : a.service_id
      ? [a.service_id]
      : []
  const returnDays = a.appointment_services.length
    ? returnDaysOf(a.appointment_services.map((i) => ({ return_days: i.services?.return_days ?? null })))
    : (a.services?.return_days ?? null)
  const confirmation = rescheduled
    ? `Olá, ${firstName}! Seu horário de ${label} foi remarcado para ${when.slice(3)}. Até lá!`
    : `Olá, ${firstName}! Confirmando seu horário de ${label} ${when}. Até lá!`

  return (
    <>
      <BackLink href={`/painel?d=${day}`} label="Agenda" />

      <div className="mb-10">
        {a.status === 'scheduled' && a.confirmed_at ? <ConfirmedBadge /> : <StatusBadge status={a.status} />}
        <h1 className="mt-3 font-serif text-4xl">{serviceLabel(a) ?? noService}</h1>
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
              {/* A cliente respondeu: marca como confirmado. */}
              <ConfirmToggle key={String(!!a.confirmed_at)} id={a.id} confirmed={!!a.confirmed_at} />
              <Link
                href={`/painel/agenda/${a.id}/remarcar`}
                className={buttonVariants({ variant: 'outline', className: 'w-full' })}
              >
                <CalendarClock className="size-5" aria-hidden="true" />
                Remarcar
              </Link>
              <Link
                href={`/painel/agenda/${a.id}/editar`}
                className={buttonVariants({ variant: 'outline', className: 'w-full' })}
              >
                <Pencil className="size-5" aria-hidden="true" />
                Editar
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
            serviceIds={serviceIds}
            serviceName={serviceLabel(a) ?? undefined}
            returnDays={returnDays}
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

        {/* Corrigir cliente, serviços, valor, dia ou pagamento, mesmo de antigos. */}
        {a.status !== 'scheduled' && (
          <Link
            href={`/painel/agenda/${a.id}/editar`}
            className={buttonVariants({ variant: 'outline', className: 'w-full' })}
          >
            <Pencil className="size-5" aria-hidden="true" />
            Editar atendimento
          </Link>
        )}

        {/* Lançamento sem cliente ou sem horário reaberto viraria um agendamento
            sem cliente ao meio-dia: nesses, corrige-se pelo Editar. */}
        {a.status !== 'scheduled' && !(a.status === 'completed' && (!a.time_known || !client)) && (
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
  serviceIds,
  serviceName,
  returnDays,
  day,
  time,
  startsAt,
}: {
  clientId: string
  firstName: string
  serviceIds: string[]
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
  if (!suggestion || serviceIds.length === 0) return null

  const params = new URLSearchParams({ cliente: clientId, s: serviceIds.join(','), d: suggestion.day })
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
          href={`/painel/agenda/novo?cliente=${clientId}&s=${serviceIds.join(',')}`}
          className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-primary underline underline-offset-4"
        >
          Escolher outra data
        </Link>
      </div>
    </section>
  )
}
