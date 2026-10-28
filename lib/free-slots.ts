// Horários livres e ocupação do dia (docs/12-plano-agendamentos.md).
// Ela não tem expediente fixo: a janela abaixo vale só para as sugestões, e
// "Outro horário" aceita qualquer hora. A garantia final contra conflitos é a
// restrição appointments_no_overlap do banco, com a mesma regra daqui: só o
// atendimento em si trava. O intervalo depois dele (15 min) nunca trava; no
// máximo marca o horário como "colado".
import { todayISO, toTimestamp } from './agenda'

// Janela das sugestões: começa a partir de 07:00 e termina até 21:00.
export const SUGGEST_FROM = '07:00'
export const SUGGEST_UNTIL = '21:00'

// Dia cheio: ela costuma atender até 3 clientes por dia.
export const MAX_PER_DAY = 3
// Bloqueios (folga, médico) enchem o dia a partir de 8 h.
export const FULL_DAY_MINUTES = 8 * 60

// Atendimento que ocupa a agenda: o atendimento (até ends_at) e o intervalo
// depois dele (até blocked_until).
export type Busy = { starts_at: string; ends_at: string; blocked_until: string }

// Horário sugerido. "tight": cabe, mas sem o intervalo de folga com o vizinho.
export type Slot = { time: string; tight: boolean }

// O que a agenda mostra de cada atendimento que ocupa horário.
export type BusyItem = Busy & {
  id: string
  // Bloqueio (folga, médico): ocupa a agenda, mas não é atendimento.
  kind: 'appointment' | 'block'
  // false nos lançamentos antigos sem horário: não ocupam a agenda.
  time_known: boolean
  status: string
  // A cliente confirmou o lembrete da véspera.
  confirmed: boolean
  client: string | null
  service: string | null
}

export type Load = 'empty' | 'some' | 'full'

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

// Minutos desde a meia-noite do dia (Brasília); pode passar de 1440 ou ser negativo.
function minutesOfDay(day: string, iso: string) {
  return Math.round((Date.parse(iso) - Date.parse(toTimestamp(day, '00:00'))) / 60000)
}

// [início, fim] de cada ocupação, em minutos do dia. Com withBuffer, o fim
// inclui o intervalo depois do atendimento.
function intervals(day: string, busy: Busy[], withBuffer = false) {
  return busy
    .map(
      (b) =>
        [minutesOfDay(day, b.starts_at), minutesOfDay(day, withBuffer ? b.blocked_until : b.ends_at)] as const
    )
    .sort((a, b) => a[0] - b[0])
}

// Encavala de verdade (o banco recusa)?
const overlaps = (t: number, duration: number, [s, e]: readonly [number, number]) => t < e && t + duration > s

// Cabe, mas encosta num vizinho sem o intervalo de folga (antes ou depois)?
const tooCloseTo = (t: number, duration: number, buffer: number, [s, e]: readonly [number, number]) =>
  !overlaps(t, duration, [s, e]) && t < e + buffer && t + duration + buffer > s

// Primeiro minuto que ainda dá para marcar: hoje, a partir de agora; no
// passado, nenhum.
function earliestMinute(day: string, now: Date) {
  const today = todayISO(now)
  if (day < today) return Infinity
  if (day > today) return -Infinity
  return minutesOfDay(day, now.toISOString())
}

// Inícios em que o serviço cabe, de "step" em "step" minutos, mais o encaixe
// logo depois de cada atendimento e do intervalo (sem deixar buraco). O
// serviço sugerido termina até SUGGEST_UNTIL. Horário sem o intervalo de folga
// com o vizinho continua valendo, marcado como "tight".
export function freeSlots({
  day,
  busy,
  duration,
  buffer,
  now = new Date(),
  step = 30,
}: {
  day: string
  busy: Busy[]
  duration: number
  buffer: number
  now?: Date
  step?: number
}): Slot[] {
  const from = toMinutes(SUGGEST_FROM)
  const until = toMinutes(SUGGEST_UNTIL)
  const taken = intervals(day, busy)
  const earliest = earliestMinute(day, now)

  const candidates = new Set<number>()
  for (let t = from; t + duration <= until; t += step) candidates.add(t)
  for (const [, end] of intervals(day, busy, true)) {
    const t = Math.ceil(end / 5) * 5
    if (t >= from && t + duration <= until) candidates.add(t)
  }

  return [...candidates]
    .sort((a, b) => a - b)
    .filter((t) => t >= earliest)
    .filter((t) => taken.every((iv) => !overlaps(t, duration, iv)))
    .map((t) => ({ time: toTime(t), tight: taken.some((iv) => tooCloseTo(t, duration, buffer, iv)) }))
}

// Um horário escolhido à mão: o que encavala (o banco recusa) e o que só fica
// colado, sem o intervalo de folga (aviso, dá para marcar). Sem janela.
export function checkTime<T extends Busy>({
  day,
  time,
  busy,
  duration,
  buffer,
}: {
  day: string
  time: string
  busy: T[]
  duration: number
  buffer: number
}) {
  const t = toMinutes(time)
  const span = (b: T) => intervals(day, [b])[0]
  return {
    conflict: busy.find((b) => overlaps(t, duration, span(b))),
    close: busy.find((b) => tooCloseTo(t, duration, buffer, span(b))),
  }
}

// Minutos ocupados no dia (só os atendimentos, sem os intervalos).
export function busyMinutes(day: string, busy: Busy[]) {
  return intervals(day, busy).reduce((sum, [s, e]) => sum + (e - s), 0)
}

// Ocupação: cheio com MAX_PER_DAY atendimentos ou um bloqueio longo (folga).
export function dayLoad(count: number, minutes: number): Load {
  if (count === 0 && minutes <= 0) return 'empty'
  return count >= MAX_PER_DAY || minutes >= FULL_DAY_MINUTES ? 'full' : 'some'
}

// Espaços vagos do dia dentro da janela, para a agenda mostrar "Livre · 14:00
// às 16:30". Ignora sobras menores que minGap (o serviço mais curto, manicure
// e pedicure, leva 40 min).
export function freeGaps({
  day,
  busy,
  now = new Date(),
  minGap = 40,
}: {
  day: string
  busy: Busy[]
  now?: Date
  minGap?: number
}) {
  const until = toMinutes(SUGGEST_UNTIL)
  const earliest = earliestMinute(day, now)
  let cursor = Math.max(toMinutes(SUGGEST_FROM), Math.ceil(earliest / 5) * 5)
  const gaps: { from: string; to: string }[] = []

  for (const [s, e] of [...intervals(day, busy), [until, until] as const]) {
    const end = Math.min(s, until)
    if (end - cursor >= minGap) gaps.push({ from: toTime(cursor), to: toTime(end) })
    cursor = Math.max(cursor, e)
  }
  return gaps
}

// "09:30" → "Manhã"
export function period(time: string) {
  const t = toMinutes(time)
  if (t < 12 * 60) return 'Manhã'
  return t < 18 * 60 ? 'Tarde' : 'Noite'
}
