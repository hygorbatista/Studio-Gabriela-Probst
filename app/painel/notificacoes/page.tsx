import { Suspense } from 'react'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { notificationDefaults } from '@/lib/notifications'
import { PageHeader } from '../page-header'
import { DetailSkeleton } from '../skeletons'
import { card, sectionTitle } from '../styles'
import { NotificationDevice } from './device'
import { NotificationPreferences } from './preferences'

export const metadata = { title: 'Notificações' }

export default function NotificationsPage() {
  return (
    <>
      <PageHeader title="Notificações" />
      <Suspense fallback={<DetailSkeleton />}><Settings /></Suspense>
    </>
  )
}

async function Settings() {
  const { supabase } = await requireUser()
  const { data, error } = await supabase.from('notification_preferences')
    .select('upcoming,pending,birthdays,goals,confirmations,lead_minutes').maybeSingle()

  return (
    <div className="space-y-6">
      <section className={card}>
        <h2 className={`${sectionTitle} mb-3`}>Este aparelho</h2>
        <NotificationDevice publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''} />
      </section>
      <section className={card}>
        <h2 className={`${sectionTitle} mb-3`}>O que receber</h2>
        {error ? <p role="status">As preferências ainda estão indisponíveis.</p>
          : <NotificationPreferences preferences={data ?? notificationDefaults} />}
      </section>
      <nav aria-label="Listas de revisão" className="flex flex-wrap gap-4 text-primary underline underline-offset-4">
        <Link href="/painel/notificacoes/revisar?tipo=pendencias" className="inline-flex min-h-11 items-center">Revisar pendências</Link>
        <Link href="/painel/notificacoes/revisar?tipo=aniversarios" className="inline-flex min-h-11 items-center">Aniversariantes de hoje</Link>
      </nav>
    </div>
  )
}
