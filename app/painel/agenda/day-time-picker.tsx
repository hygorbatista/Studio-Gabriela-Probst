'use client'

import { useState, useTransition } from 'react'
import { CalendarDays, Clock, Star } from 'lucide-react'
import { cn } from 'cn'
import { FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  addDays,
  addMinutesToTime,
  dayOf,
  formatDayTitle,
  formatShortWeekday,
  formatTime,
} from '@/lib/agenda'
import { noClient, noService } from '@/lib/format'
import {
  busyMinutes,
  dayLoad,
  fits,
  freeSlots,
  period,
  type BusyItem,
} from '@/lib/free-slots'
import { loadBusy } from './actions'
import { loadClass, LoadLegend } from './load'

const DAYS = 14
const periods = ['Manhã', 'Tarde', 'Noite'] as const

// Dia e horário de um agendamento (docs/12-plano-agendamentos.md, etapa 1):
// os próximos 14 dias pintados pela ocupação e só os horários em que o serviço
// cabe. "Outro horário" aceita qualquer hora, porque o horário dela é flexível.
export function DayTimePicker({
  busy,
  range,
  today,
  now,
  buffer,
  duration,
  initialDay,
  initialTime = '',
  excludeId,
  favoriteHour,
  errors,
}: {
  // Agenda já carregada pelo servidor, de range.from a range.to.
  busy: BusyItem[]
  range: { from: string; to: string }
  today: string
  now: string
  buffer: number
  // Sem serviço escolhido, ainda não dá para calcular os horários.
  duration: number | null
  initialDay: string
  initialTime?: string
  // No Remarcar, o próprio atendimento não ocupa o horário.
  excludeId?: string
  favoriteHour?: number
  errors: { day?: string[]; time?: string[] }
}) {
  const [day, setDay] = useState(initialDay)
  const [time, setTime] = useState(initialTime)
  const [custom, setCustom] = useState(false)
  const [otherDate, setOtherDate] = useState(false)
  const [loaded, setLoaded] = useState([{ ...range, items: busy }])
  const [loading, startLoading] = useTransition()
  const nowDate = new Date(now)

  const itemsOf = (d: string) => {
    const source = loaded.find((r) => d >= r.from && d <= r.to)
    if (!source) return null
    return source.items.filter((a) => a.id !== excludeId && dayOf(a.starts_at) === d)
  }
  const slotsOf = (d: string) => {
    const items = itemsOf(d)
    if (!items || !duration) return []
    return freeSlots({ day: d, busy: items.filter((a) => a.time_known), duration, buffer, now: nowDate })
  }

  const chooseDay = (d: string) => {
    setDay(d)
    if (!custom) setTime('')
    if (!itemsOf(d)) {
      startLoading(async () => {
        const items = await loadBusy(d)
        setLoaded((l) => [...l, { from: d, to: addDays(d, DAYS - 1), items }])
      })
    }
  }

  const dayItems = itemsOf(day)
  const occupying = dayItems?.filter((a) => a.time_known) ?? []
  const slots = slotsOf(day)
  // Escolhido na lista: só vale se ainda cabe (o serviço pode ter mudado).
  const chosen = custom ? time : slots.includes(time) ? time : ''
  const conflict =
    custom && time && duration && !fits({ day, time, busy: occupying, duration, buffer })
      ? occupying.find((a) => fits({ day, time, busy: [a], duration, buffer }) === false)
      : undefined

  const chips = Array.from({ length: DAYS }, (_, i) => addDays(today, i))
  const nextWithSlot = duration ? chips.find((d) => d > day && slotsOf(d).length > 0) : undefined

  return (
    <div className="flex flex-col gap-6">
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="time" value={chosen} />

      {/* Dias ------------------------------------------------------------- */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">Dia</p>
          <p className="text-sm text-muted-foreground">{formatDayTitle(day)}</p>
        </div>
        <div className="-mx-5 overflow-x-auto px-5 pb-1">
          <ul className="flex w-max gap-1.5">
            {chips.map((d, i) => {
              const items = itemsOf(d) ?? []
              const load = dayLoad(busyMinutes(d, items.filter((a) => a.time_known)))
              const noRoom = duration !== null && slotsOf(d).length === 0
              const count = items.filter((a) => a.kind === 'appointment').length
              const selected = d === day
              const label = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : formatShortWeekday(d)
              return (
                <li key={d}>
                  <button
                    type="button"
                    onClick={() => chooseDay(d)}
                    aria-pressed={selected}
                    aria-label={`${formatDayTitle(d)}: ${count} ${count === 1 ? 'atendimento' : 'atendimentos'}${noRoom ? ', sem vaga para esse serviço' : ''}`}
                    className={cn(
                      'flex h-16 w-14 flex-col items-center justify-center gap-0.5 border',
                      loadClass[load],
                      selected ? 'outline-2 outline-offset-2 outline-foreground' : 'border-border',
                      noRoom && 'opacity-45'
                    )}
                  >
                    <span className="text-xs font-semibold uppercase">{label}</span>
                    <span className={cn('text-lg leading-none font-semibold', noRoom && 'line-through')}>
                      {Number(d.slice(8))}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
        <LoadLegend />

        {otherDate || day < today || day > chips[DAYS - 1] ? (
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Outra data</span>
            <Input
              type="date"
              value={day}
              onChange={(e) => e.target.value && chooseDay(e.target.value)}
              aria-invalid={!!errors.day}
            />
          </label>
        ) : (
          <button
            type="button"
            onClick={() => setOtherDate(true)}
            className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-primary underline underline-offset-4"
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            Outra data
          </button>
        )}
        <FieldError>{errors.day?.[0]}</FieldError>
      </div>

      {/* Horários --------------------------------------------------------- */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">Horário</p>

        {custom ? (
          <div className="flex flex-col gap-2">
            <Input
              type="time"
              step={300}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-label="Horário"
              aria-invalid={!!errors.time || !!conflict}
              className="max-w-40"
            />
            {conflict && (
              <p role="alert" className="text-base text-destructive">
                {conflict.kind === 'block' ? (
                  <>
                    Cai num horário bloqueado{conflict.service ? ` (${conflict.service})` : ''}:{' '}
                    {formatTime(conflict.starts_at)} às {formatTime(conflict.ends_at)}.
                  </>
                ) : (
                  <>
                    Encavala com {conflict.client ?? noClient} ({formatTime(conflict.starts_at)} às{' '}
                    {formatTime(conflict.ends_at)}, mais {buffer} min de intervalo).
                  </>
                )}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setCustom(false)
                setTime('')
              }}
              className="min-h-11 self-start text-sm font-semibold text-primary underline underline-offset-4"
            >
              Ver os horários livres
            </button>
          </div>
        ) : !duration ? (
          <p className="text-base text-muted-foreground">Escolha o serviço para ver os horários livres.</p>
        ) : loading || !dayItems ? (
          <p role="status" className="text-base text-muted-foreground">
            Carregando a agenda do dia...
          </p>
        ) : slots.length === 0 ? (
          <div className="flex flex-col gap-2 border border-dashed border-border p-4">
            <p className="text-base">
              {day < today
                ? 'Esse dia já passou.'
                : 'Nenhum horário livre para esse serviço entre 07:00 e 21:00.'}
            </p>
            {nextWithSlot && (
              <button
                type="button"
                onClick={() => chooseDay(nextWithSlot)}
                className="min-h-11 self-start text-sm font-semibold text-primary underline underline-offset-4"
              >
                Próximo dia com vaga: {formatDayTitle(nextWithSlot).toLowerCase()}
              </button>
            )}
          </div>
        ) : (
          <>
            {favoriteHour !== undefined && slots.some((s) => Number(s.slice(0, 2)) === favoriteHour) && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Star className="size-4 fill-primary text-primary" aria-hidden="true" />
                Horário de costume da cliente
              </p>
            )}
            {periods.map((p) => {
              const list = slots.filter((s) => period(s) === p)
              if (list.length === 0) return null
              return (
                <div key={p} className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">{p}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {list.map((s) => {
                      const favorite = Number(s.slice(0, 2)) === favoriteHour
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setTime(s)}
                          aria-pressed={chosen === s}
                          aria-label={favorite ? `${s}, horário de costume` : s}
                          className={cn(
                            'relative h-12 border text-base font-semibold',
                            chosen === s
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-input bg-surface hover:border-foreground',
                            favorite && chosen !== s && 'border-primary'
                          )}
                        >
                          {s}
                          {favorite && (
                            <Star
                              className={cn(
                                'absolute top-1 right-1 size-3',
                                chosen === s ? 'fill-white text-white' : 'fill-primary text-primary'
                              )}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {!custom && (
          <button
            type="button"
            onClick={() => {
              setCustom(true)
              setTime(chosen)
            }}
            className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-primary underline underline-offset-4"
          >
            <Clock className="size-4" aria-hidden="true" />
            Outro horário
          </button>
        )}

        {chosen && duration && (
          <p className="text-base text-muted-foreground">
            Termina às <strong className="text-foreground">{addMinutesToTime(chosen, duration)}</strong>,
            mais {buffer} min de intervalo.
          </p>
        )}
        <FieldError>{errors.time?.[0]}</FieldError>
      </div>

      {/* O dia escolhido, para ela se situar -------------------------------- */}
      {dayItems && (
        <div className="flex flex-col gap-2 border-t border-border pt-5">
          <p className="text-sm font-semibold">Já marcado nesse dia</p>
          {dayItems.length === 0 ? (
            <p className="text-base text-muted-foreground">Nada marcado.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {dayItems.map((a) => (
                <li key={a.id} className="flex gap-3 text-base">
                  <span className="w-28 shrink-0 text-muted-foreground">
                    {a.time_known ? `${formatTime(a.starts_at)} às ${formatTime(a.ends_at)}` : 'sem hora'}
                  </span>
                  <span className="min-w-0 truncate">
                    {a.kind === 'block'
                      ? `Bloqueado${a.service ? ` · ${a.service}` : ''}`
                      : `${a.client ?? noClient} · ${a.service ?? noService}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
