import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarClock } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { WhatsAppIcon } from '@/components/icons'
import { dayOf, formatDayTitle, formatTime } from '@/lib/agenda'
import { formatPrice, paymentMethods, type PaymentMethod } from '@/lib/format'
import { whatsappTo } from '@/lib/phone'
import { ActionButton } from '../../action-button'
import { BackLink } from '../../back-link'
import { StatusBadge } from '../../status-badge'
import { reopenAppointment, setAppointmentStatus } from '../actions'
import { CompleteForm } from '../complete-form'
import { getAppointment } from '../data'
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
        <h1 className="mt-3 font-serif text-4xl">{a.services?.name}</h1>
        <p className="mt-2 text-base">
          {formatDayTitle(day)} · {formatTime(a.starts_at)} às {formatTime(a.ends_at)}
        </p>
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

        {a.status === 'completed' && payment && (
          <section className={card}>
            <h2 className={dataLabel}>Pagamento</h2>
            <p className="mt-2 text-2xl font-semibold">{formatPrice(payment.amount)}</p>
            <p className="text-base text-muted-foreground">
              {paymentMethods[payment.method as PaymentMethod]}
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
