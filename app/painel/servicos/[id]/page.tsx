import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PageHeader } from '../../page-header'
import { setServiceActive } from '../actions'
import { BackLink } from '../back-link'
import { DeleteServiceButton } from '../delete-service-button'
import { categoriesOf, listAllServices } from '../data'
import { ServiceForm } from '../service-form'

export const metadata = { title: 'Editar serviço' }

export default function EditarServicoPage({ params }: PageProps<'/painel/servicos/[id]'>) {
  return (
    <>
      <BackLink />
      <PageHeader title="Editar serviço" />
      <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
        <EditService params={params} />
      </Suspense>
    </>
  )
}

async function EditService({ params }: Pick<PageProps<'/painel/servicos/[id]'>, 'params'>) {
  const { id } = await params
  const services = await listAllServices()
  const service = services.find((s) => s.id === id)
  if (!service) notFound()

  return (
    <div className="flex flex-col gap-12">
      <ServiceForm service={service} categories={categoriesOf(services)} />

      <section className="border-t border-border pt-8">
        {service.active ? (
          <>
            <p className="mb-4 text-base text-muted-foreground">
              Desativar tira o serviço do site e da agenda. Os atendimentos antigos continuam no
              histórico.
            </p>
            <form action={setServiceActive.bind(null, service.id, false)}>
              <Button type="submit" variant="destructive" className="w-full">
                Desativar serviço
              </Button>
            </form>
          </>
        ) : (
          <>
            <p className="mb-4 text-base text-muted-foreground">
              Este serviço está desativado: não aparece no site nem na agenda.
            </p>
            <form action={setServiceActive.bind(null, service.id, true)}>
              <Button type="submit" variant="outline" className="w-full">
                Reativar serviço
              </Button>
            </form>
          </>
        )}
        <div className="mt-6">
          <DeleteServiceButton id={service.id} name={service.name} />
        </div>
      </section>
    </div>
  )
}
