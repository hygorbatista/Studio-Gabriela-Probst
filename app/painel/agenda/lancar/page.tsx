import { Suspense } from 'react'
import Link from 'next/link'
import { connection } from 'next/server'
import { formatDayTitle, isValidDay, todayISO } from '@/lib/agenda'
import { formatPrice, noClient, noService } from '@/lib/format'
import { BackLink } from '../../back-link'
import { PageHeader } from '../../page-header'
import { FormSkeleton } from '../../skeletons'
import { card, sectionTitle } from '../../styles'
import { getDayAppointments, getFormOptions } from '../data'
import { PastForm } from '../past-form'

export const metadata = { title: 'Lançar atendimento' }

export default function LancarPage({ searchParams }: PageProps<'/painel/agenda/lancar'>) {
  return (
    <>
      <BackLink href="/painel" label="Agenda" />
      <PageHeader title="Lançar atendimento" />
      <p className="mb-6 text-base text-muted-foreground">
        Para atendimentos que já aconteceram e não foram registrados. Só o valor é obrigatório:
        preencha o resto se lembrar.
      </p>
      <Suspense fallback={<FormSkeleton fields={4} />}>
        <Past searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function Past({ searchParams }: Pick<PageProps<'/painel/agenda/lancar'>, 'searchParams'>) {
  const { d, n } = await searchParams
  await connection()
  const today = todayISO()
  const day = typeof d === 'string' && isValidDay(d) && d <= today ? d : today
  const [{ clients, services }, appointments] = await Promise.all([
    getFormOptions(),
    getDayAppointments(day),
  ])
  const done = appointments.filter((a) => a.status === 'completed')
  const total = done.reduce((sum, a) => sum + a.price_charged, 0)

  return (
    <div className="flex flex-col gap-10">
      {/* key: depois de lançar, o formulário volta limpo para o próximo. */}
      <PastForm
        key={typeof n === 'string' ? n : 'novo'}
        clients={clients}
        services={services}
        defaultDay={day}
        today={today}
      />

      <section>
        <div className="mb-2 flex items-end justify-between gap-4">
          <h2 className={sectionTitle}>Concluídos em {formatDayTitle(day).toLowerCase()}</h2>
          {done.length > 0 && <span className="text-sm font-semibold">{formatPrice(total)}</span>}
        </div>
        {done.length === 0 ? (
          <p className="text-base text-muted-foreground">Nenhum ainda neste dia.</p>
        ) : (
          <ul className={`${card} divide-y divide-border py-0`}>
            {done.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/painel/agenda/${a.id}`}
                  className="flex min-h-14 items-center gap-3 py-2 text-base hover:bg-muted/50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{a.services?.name ?? noService}</span>
                    <span className="block text-sm text-muted-foreground">
                      {a.clients?.name ?? noClient}
                    </span>
                  </span>
                  <span className="font-semibold">{formatPrice(a.price_charged)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
