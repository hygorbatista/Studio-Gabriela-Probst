import { BackLink } from '../../back-link'
import { PageHeader } from '../../page-header'
import { ClientForm } from '../client-form'

export const metadata = { title: 'Nova cliente' }

export default function NovaClientePage() {
  return (
    <>
      <BackLink href="/painel/clientes" label="Clientes" />
      <PageHeader title="Nova cliente" />
      <ClientForm />
    </>
  )
}
