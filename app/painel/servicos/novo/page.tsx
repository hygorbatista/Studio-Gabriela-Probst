import { Suspense } from 'react'
import { PageHeader } from '../../page-header'
import { BackLink } from '../../back-link'
import { categoriesOf, listAllServices } from '../data'
import { ServiceForm } from '../service-form'
import { FormSkeleton } from '../../skeletons'

export const metadata = { title: 'Novo serviço' }

export default function NovoServicoPage() {
  return (
    <>
      <BackLink href="/painel/servicos" label="Serviços" />
      <PageHeader title="Novo serviço" />
      <Suspense fallback={<FormSkeleton fields={5} />}>
        <NewServiceForm />
      </Suspense>
    </>
  )
}

async function NewServiceForm() {
  const services = await listAllServices()
  return <ServiceForm categories={categoriesOf(services)} />
}
