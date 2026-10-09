import { PageHeader } from '../page-header'

export const metadata = { title: 'Clientes' }

export default function ClientesPage() {
  return (
    <>
      <PageHeader title="Clientes" />
      <p className="text-muted-foreground">O cadastro de clientes chega na próxima etapa.</p>
    </>
  )
}
