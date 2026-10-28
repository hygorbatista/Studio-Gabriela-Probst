'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Copy, Plus, X } from 'lucide-react'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'
import { WhatsAppIcon } from '@/components/icons'
import { addDays, dayOf, formatDayTitle } from '@/lib/agenda'
import { formatDuration } from '@/lib/format'
import { freeSlots, MAX_PER_DAY, type BusyItem } from '@/lib/free-slots'
import { slotMessage, whatsappShare, type SlotChoice } from '@/lib/slot-message'

type Service = { id: string; name: string; duration_minutes: number; duration_up_to: boolean }

// "Tem horário quinta?" (docs/12-plano-agendamentos.md, etapa 2): os horários
// livres das próximas duas semanas para um serviço. Ela marca as opções e
// copia a mensagem pronta para o WhatsApp.
export function FreeBoard({
  services,
  busy,
  today,
  now,
  buffer,
  days,
  initialServiceId,
}: {
  services: Service[]
  busy: BusyItem[]
  today: string
  now: string
  buffer: number
  days: number
  initialServiceId?: string
}) {
  // Um ou mais serviços (ex.: mãos e pés): a duração é a soma.
  const [serviceIds, setServiceIds] = useState<string[]>(() => {
    const first = initialServiceId ?? services[0]?.id
    return first ? [first] : []
  })
  const [picked, setPicked] = useState<SlotChoice[]>([])
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null)
  const chosen = serviceIds.map((id) => services.find((s) => s.id === id)).filter((s) => !!s)
  const duration = chosen.reduce((sum, s) => sum + s.duration_minutes, 0)
  const serviceName = chosen.map((s) => s.name).join(' + ')
  const nowDate = new Date(now)

  const toggleService = (id: string) => {
    setServiceIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
    // Outra duração: as opções marcadas podem não caber mais.
    setPicked([])
    setCopied(null)
  }

  const list = Array.from({ length: days }, (_, i) => addDays(today, i)).map((day) => {
    const dayItems = busy.filter((a) => dayOf(a.starts_at) === day)
    return {
      day,
      count: dayItems.filter((a) => a.kind === 'appointment').length,
      slots: duration
        ? freeSlots({
            day,
            busy: dayItems.filter((a) => a.time_known),
            duration,
            buffer,
            now: nowDate,
            // De hora em hora (mais o encaixe depois de cada atendimento): menos botões.
            step: 60,
          })
        : [],
    }
  })

  const isPicked = (c: SlotChoice) => picked.some((p) => p.day === c.day && p.time === c.time)
  const toggle = (c: SlotChoice) => {
    setCopied(null)
    setPicked((p) => (isPicked(c) ? p.filter((x) => x.day !== c.day || x.time !== c.time) : [...p, c]))
  }

  const message = chosen.length > 0 && picked.length > 0 ? slotMessage(serviceName, picked) : ''
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied('ok')
    } catch {
      setCopied('fail')
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', picked.length > 0 && 'pb-44')}>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Serviços</legend>
        <div className="flex flex-wrap gap-2">
          {services.map((s) => {
            const on = serviceIds.includes(s.id)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleService(s.id)}
                aria-pressed={on}
                className={cn(
                  'inline-flex min-h-11 items-center gap-1.5 border px-3 text-sm font-semibold',
                  on ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-surface hover:border-foreground'
                )}
              >
                {on && <Check className="size-4" aria-hidden="true" />}
                {s.name}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {chosen.length === 0
            ? 'Escolha um ou mais serviços.'
            : `${serviceName}: ${formatDuration(duration, chosen.some((s) => s.duration_up_to))}`}
        </p>
      </fieldset>

      <p className="text-base text-muted-foreground">
        Toque nos horários que quer oferecer e copie a mensagem para a cliente.
      </p>

      <ul className="flex flex-col gap-3">
        {list.map(({ day, count, slots }, i) => (
          <li key={day} className="bg-surface p-4 shadow-card">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold">
                {formatDayTitle(day)}
                {i < 2 && (
                  <span className="ml-2 text-sm font-semibold text-primary">{i === 0 ? 'Hoje' : 'Amanhã'}</span>
                )}
              </h2>
              {/* Ela costuma atender até 3 por dia: avisa, sem esconder os horários. */}
              {count > 0 && (
                <span className={cn('text-sm', count >= MAX_PER_DAY ? 'font-semibold text-primary' : 'text-muted-foreground')}>
                  {count >= MAX_PER_DAY ? `Cheio · ${count} atendimentos` : `${count} ${count === 1 ? 'atendimento' : 'atendimentos'}`}
                </span>
              )}
            </div>
            {slots.length === 0 ? (
              <p className="text-base text-muted-foreground">
                {chosen.length === 0 ? 'Escolha o serviço acima.' : 'Sem vaga para esse serviço.'}
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map(({ time, tight }) => {
                  const on = isPicked({ day, time })
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => toggle({ day, time })}
                      aria-pressed={on}
                      aria-label={tight ? `${time}, colado em outro atendimento` : time}
                      className={cn(
                        'relative flex h-12 items-center justify-center gap-1 border text-base font-semibold',
                        on
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-surface hover:border-foreground'
                      )}
                    >
                      {on && <Check className="size-4" aria-hidden="true" />}
                      {time}
                      {tight && (
                        <span aria-hidden="true" className="absolute top-1.5 left-1.5 size-2 rounded-full bg-amber-500" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Barra das opções marcadas, acima da navegação. */}
      {picked.length > 0 && chosen.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-surface px-5 py-3 shadow-card">
          <div className="mx-auto flex max-w-2xl flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {picked.length} {picked.length === 1 ? 'horário marcado' : 'horários marcados'}
              </p>
              <button
                type="button"
                onClick={() => setPicked([])}
                className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted-foreground"
              >
                <X className="size-4" aria-hidden="true" />
                Limpar
              </button>
            </div>
            {copied === 'fail' && (
              <textarea
                readOnly
                value={message}
                rows={4}
                aria-label="Mensagem para copiar"
                onFocus={(e) => e.target.select()}
                className="w-full border border-input px-3 py-2 text-sm"
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={copy} className={buttonVariants({ className: 'w-full' })}>
                {copied === 'ok' ? (
                  <Check className="size-5" aria-hidden="true" />
                ) : (
                  <Copy className="size-5" aria-hidden="true" />
                )}
                {copied === 'ok' ? 'Copiado' : 'Copiar'}
              </button>
              <a
                href={whatsappShare(message)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline', className: 'w-full' })}
              >
                <WhatsAppIcon className="size-5" />
                WhatsApp
              </a>
            </div>
            <p role="status" className="text-sm text-muted-foreground empty:hidden">
              {copied === 'ok'
                ? 'Agora é só colar na conversa com a cliente.'
                : copied === 'fail'
                  ? 'Não deu para copiar sozinho: segure no texto acima e copie.'
                  : null}
            </p>
            {/* A cliente escolheu: com uma opção marcada, agenda direto. */}
            {picked.length === 1 && (
              <Link
                href={`/painel/agenda/novo?d=${picked[0].day}&h=${picked[0].time}&s=${serviceIds.join(',')}`}
                className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-primary underline underline-offset-4"
              >
                <Plus className="size-4" aria-hidden="true" />
                Agendar {formatDayTitle(picked[0].day).toLowerCase()}, às {picked[0].time}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
