'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { registerNotificationDevice, removeNotificationDevice, testNotificationDevice } from './actions'

export function NotificationDevice({ publicKey }: { publicKey: string }) {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>()
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [status, setStatus] = useState('Preparando notificações neste aparelho…')
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (!publicKey) return
    let stopped = false
    async function prepare() {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
          await Promise.resolve()
          if (!stopped) setStatus('Este navegador não oferece notificações aqui. No iPhone, abra o painel pelo ícone da Tela de Início.')
          return
        }
        await navigator.serviceWorker.register('/panel-push-sw.js')
        const worker = await navigator.serviceWorker.ready
        const current = await worker.pushManager.getSubscription()
        if (stopped) return
        setRegistration(worker)
        setSubscription(current)
        setStatus(Notification.permission === 'denied'
          ? 'Permissão bloqueada. Ative as notificações nos ajustes do aparelho.'
          : current ? 'Inscrição encontrada neste aparelho.' : 'Notificações desativadas neste aparelho.')
      } catch {
        if (!stopped) setStatus('Não foi possível preparar as notificações neste aparelho.')
      }
    }
    void prepare()
    return () => { stopped = true }
  }, [publicKey])

  async function change() {
    if (!registration) return
    setWorking(true)
    try {
      if (subscription) {
        if (!await removeNotificationDevice(subscription.endpoint)) throw new Error('remove')
        setSubscription(null)
        await subscription.unsubscribe()
        setStatus('Notificações desativadas neste aparelho.')
      } else {
        if (Notification.permission === 'denied') {
          setStatus('Permissão bloqueada. Ative as notificações nos ajustes do aparelho.')
          return
        }
        const next = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey })
        const { keys } = next.toJSON()
        if (!await registerNotificationDevice({ endpoint: next.endpoint, ...keys })) {
          await next.unsubscribe()
          throw new Error('register')
        }
        setSubscription(next)
        setStatus('Notificações ativadas neste aparelho.')
      }
    } catch {
      setStatus(Notification.permission === 'denied'
        ? 'Permissão bloqueada. Ative as notificações nos ajustes do aparelho.'
        : 'Não foi possível atualizar as notificações. Tente novamente.')
    } finally {
      setWorking(false)
    }
  }

  async function test() {
    if (!subscription) return
    setWorking(true)
    try {
      const result = await testNotificationDevice(subscription.endpoint)
      if (result === 'expired') {
        await subscription.unsubscribe()
        setSubscription(null)
        setStatus('A inscrição expirou. Ative as notificações novamente.')
      } else {
        setStatus(result === 'accepted' ? 'Teste enviado. Confira as notificações do aparelho.' : 'Não foi possível enviar o teste.')
      }
    } catch {
      setStatus('Não foi possível enviar o teste.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-3">
      <p role="status" className="text-sm text-muted-foreground">
        {publicKey ? status : 'O envio de notificações ainda está em configuração.'}
      </p>
      {registration && <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={change} disabled={working}>
          {subscription ? 'Desativar neste aparelho' : 'Ativar neste aparelho'}
        </Button>
        {subscription && <Button type="button" variant="outline" onClick={test} disabled={working}>
          Enviar notificação de teste
        </Button>}
      </div>}
    </div>
  )
}
