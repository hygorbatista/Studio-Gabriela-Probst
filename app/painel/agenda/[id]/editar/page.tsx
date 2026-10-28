import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { dayOf, formatTime, todayISO } from '@/lib/agenda'
import { BackLink } from '../../../back-link'
import { PageHeader } from '../../../page-header'
import { FormSkeleton } from '../../../skeletons'
import { getAppointment, getEditOptions } from '../../data'
import { EditForm } from '../../edit-form'

export const metadata = { title: 'Editar atendimento' }

export default function EditarPage({ params }: PageProps<'/painel/agenda/[id]/editar'>) {
  return (
    <Suspense fallback={<FormSkeleton fields={5} />}>
      <Edit params={params} />
    </Suspense>
  )
}

async function Edit({ params }: Pick<PageProps<'/painel/agenda/[id]/editar'>, 'params'>) {
  const { id } = await params
  const a = /^[0-9a-f-]{36}$/i.test(id) ? await getAppointment(id) : null
  if (!a) notFound()

  // Os itens do atendimento (antigos sem itens: o serviço principal).
  const items = a.appointment_services.length
    ? a.appointment_services.map((i) => ({ service_id: i.service_id, price: i.price }))
    : a.service_id
      ? [{ service_id: a.service_id, price: a.price_charged }]
      : []
  const { clients, services } = await getEditOptions(items.map((i) => i.service_id))

  return (
    <>
      <BackLink href={`/painel/agenda/${a.id}`} label="Atendimento" />
      <PageHeader title="Editar atendimento" />
      <EditForm
        id={a.id}
        completed={a.status === 'completed'}
        clients={clients}
        services={services}
        keptPrices={Object.fromEntries(items.map((i) => [i.service_id, i.price]))}
        today={todayISO()}
        initial={{
          clientId: a.client_id ?? undefined,
          serviceIds: items.map((i) => i.service_id),
          price: a.price_charged,
          day: dayOf(a.starts_at),
          time: a.time_known ? formatTime(a.starts_at) : '',
          method: a.payments?.method,
          notes: a.notes ?? '',
        }}
      />
    </>
  )
}
