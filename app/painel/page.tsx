import { PageHeader } from './page-header'

export const metadata = { title: 'Agenda' }

export default function AgendaPage() {
  return (
    <>
      <PageHeader title="Agenda" />
      <p className="text-muted-foreground">
        A agenda chega na próxima etapa. Por enquanto, cadastre os serviços.
      </p>
    </>
  )
}
