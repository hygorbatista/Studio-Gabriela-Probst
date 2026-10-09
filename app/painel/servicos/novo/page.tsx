import { Suspense } from 'react'
import { PageHeader } from '../../page-header'
import { BackLink } from '../back-link'
import { categoriesOf, listAllServices } from '../data'
import { ServiceForm } from '../service-form'

export const metadata = { title: 'Novo serviço' }

export default function NovoServicoPage() {
  return (
    <>
      <BackLink />
      <PageHeader title="Novo serviço" />
      <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
        <NewServiceForm />
      </Suspense>
    </>
  )
}

async function NewServiceForm() {
  const services = await listAllServices()
  return <ServiceForm categories={categoriesOf(services)} />
}
