'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { notificationDefaults, notificationOptions } from '@/lib/notifications'
import { saveNotificationPreferences } from './actions'

export function NotificationPreferences({ preferences }: { preferences: typeof notificationDefaults }) {
  const [message, action, saving] = useActionState(saveNotificationPreferences, '')
  const [draft, setDraft] = useState(preferences)
  return (
    <form action={action} className="space-y-4">
      <fieldset className="divide-y divide-border" disabled={saving}>
        <legend className="sr-only">Tipos de notificação</legend>
        {(Object.keys(notificationOptions) as (keyof typeof notificationOptions)[]).map((key) => (
          <label key={key} className="flex min-h-12 items-center justify-between gap-4">
            {notificationOptions[key]}
            <input type="checkbox" name={key} checked={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.checked })} className="size-5 accent-primary" />
          </label>
        ))}
        <label className="flex min-h-12 flex-wrap items-center justify-between gap-3">
          Antecedência do atendimento
          <select name="lead_minutes" value={draft.lead_minutes} onChange={(event) => setDraft({ ...draft, lead_minutes: Number(event.target.value) })} className="min-h-11 border border-input bg-surface px-2">
            <option value="30">30 minutos</option>
            <option value="60">1 hora</option>
          </select>
        </label>
      </fieldset>
      <Button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar preferências'}</Button>
      <p role="status" className="text-sm">{message}</p>
    </form>
  )
}
