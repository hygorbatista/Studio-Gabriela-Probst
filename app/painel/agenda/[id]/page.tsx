import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
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

export const metadata = { title: 'Atendimento' }

export default function AtendimentoPage({ params }: PageProps<'/painel/agenda/[id]'>) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
      <Appointment params={params} />
    </Suspense>
  )
}

async function Appointment({ params }: Pick<PageProps<'/painel/agenda/[id]'>, 'params'>) {
  const { id } = await params
  const a = /^[0-9a-f-]{36}$/i.test(id) ? await getAppointment(id) : null
  if (!a) notFound()

  const day = dayOf(a.starts_at)
  const dayTitle = formatDayTitle(day).toLowerCase()
  // "no sábado", "no domingo", "na segunda"...
  const when = `${/^(sábado|domingo)/.test(dayTitle) ? 'no' : 'na'} ${dayTitle}, às ${formatTime(a.starts_at)}`
  const client = a.clients
  const payment = a.payments
  const confirmation = client
    ? `Olá, ${client.name.split(' ')[0]}! Confirmando seu horário de ${a.services?.name} ${when}. Até lá!`
    : ''

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
            {client?.phone && (
              <a
                href={whatsappTo(client.phone, confirmation)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline', className: 'w-full' })}
              >
                <WhatsAppIcon className="size-5" />
                Enviar confirmação
              </a>
            )}

            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Concluir
              </h2>
              <CompleteForm id={a.id} price={a.price_charged} />
            </section>

            <section className="grid grid-cols-2 gap-2 border-t border-border pt-8">
              <ActionButton
                action={setAppointmentStatus.bind(null, a.id, 'no_show')}
                label="Faltou"
                pendingLabel="Salvando..."
                confirmText="Marcar que a cliente faltou?"
              />
              <ActionButton
                action={setAppointmentStatus.bind(null, a.id, 'cancelled')}
                label="Cancelar"
                pendingLabel="Cancelando..."
                confirmText="Cancelar este atendimento? O horário fica livre."
                variant="destructive"
              />
            </section>
          </>
        )}

        {a.status === 'completed' && payment && (
          <section className="border border-border bg-surface p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Pagamento
            </h2>
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
            confirmText={
              a.status === 'completed'
                ? 'Reabrir? O pagamento registrado será apagado.'
                : 'Reabrir este atendimento como agendado?'
            }
            variant="link"
            className="w-full text-muted-foreground"
          />
        )}
      </div>
    </>
  )
}
