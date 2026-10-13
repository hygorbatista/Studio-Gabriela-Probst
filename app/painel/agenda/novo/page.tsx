import { Suspense } from 'react'
import { isValidDay, todayISO } from '@/lib/agenda'
import { BackLink } from '../../back-link'
import { PageHeader } from '../../page-header'
import { AppointmentForm } from '../appointment-form'
import { getFormOptions } from '../data'

export const metadata = { title: 'Novo agendamento' }

export default function NovoAgendamentoPage({ searchParams }: PageProps<'/painel/agenda/novo'>) {
  return (
    <>
      <BackLink href="/painel" label="Agenda" />
      <PageHeader title="Agendar" />
      <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
        <NewAppointment searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function NewAppointment({
  searchParams,
}: Pick<PageProps<'/painel/agenda/novo'>, 'searchParams'>) {
  const { d } = await searchParams
  const day = typeof d === 'string' && isValidDay(d) ? d : todayISO()
  const { clients, services } = await getFormOptions()

  return <AppointmentForm clients={clients} services={services} defaultDay={day} />
}
