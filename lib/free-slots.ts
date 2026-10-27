// Horários livres e ocupação do dia (docs/12-plano-agendamentos.md).
// Ela não tem expediente fixo: a janela abaixo vale só para as sugestões, e
// "Outro horário" aceita qualquer hora. A garantia final contra conflitos é a
// restrição appointments_no_overlap do banco, com a mesma regra daqui.
import { todayISO, toTimestamp } from './agenda'

// Janela das sugestões: começa a partir de 07:00 e termina até 21:00.
export const SUGGEST_FROM = '07:00'
export const SUGGEST_UNTIL = '21:00'

// Referência de "dia cheio" (com os intervalos), já que não há expediente fixo.
export const FULL_DAY_MINUTES = 8 * 60

// Atendimento que ocupa a agenda: do início ao fim do intervalo depois dele.
export type Busy = { starts_at: string; blocked_until: string }

// O que a agenda mostra de cada atendimento que ocupa horário.
export type BusyItem = Busy & {
  id: string
  ends_at: string
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

function intervals(day: string, busy: Busy[]) {
  return busy
    .map((b) => [minutesOfDay(day, b.starts_at), minutesOfDay(day, b.blocked_until)] as const)
    .sort((a, b) => a[0] - b[0])
}

// Primeiro minuto que ainda dá para marcar: hoje, a partir de agora; no
// passado, nenhum.
function earliestMinute(day: string, now: Date) {
  const today = todayISO(now)
  if (day < today) return Infinity
  if (day > today) return -Infinity
  return minutesOfDay(day, now.toISOString())
}

// Inícios em que o serviço cabe, de "step" em "step" minutos, mais o encaixe
// logo depois de cada atendimento (sem deixar buraco). O serviço sugerido
// termina até SUGGEST_UNTIL; o intervalo depois dele não pode invadir o
// próximo atendimento.
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
}) {
  const from = toMinutes(SUGGEST_FROM)
  const until = toMinutes(SUGGEST_UNTIL)
  const taken = intervals(day, busy)
  const earliest = earliestMinute(day, now)

  const candidates = new Set<number>()
  for (let t = from; t + duration <= until; t += step) candidates.add(t)
  for (const [, end] of taken) {
    const t = Math.ceil(end / 5) * 5
    if (t >= from && t + duration <= until) candidates.add(t)
  }

  return [...candidates]
    .sort((a, b) => a - b)
    .filter((t) => t >= earliest)
    .filter((t) => taken.every(([s, e]) => t + duration + buffer <= s || t >= e))
    .map(toTime)
}

// Um horário escolhido à mão cabe? Mesma regra do banco, sem janela.
export function fits({
  day,
  time,
  busy,
  duration,
  buffer,
}: {
  day: string
  time: string
  busy: Busy[]
  duration: number
  buffer: number
}) {
  const t = toMinutes(time)
  return intervals(day, busy).every(([s, e]) => t + duration + buffer <= s || t >= e)
}

// Minutos ocupados no dia, contando os intervalos.
export function busyMinutes(day: string, busy: Busy[]) {
  return intervals(day, busy).reduce((sum, [s, e]) => sum + (e - s), 0)
}

export function dayLoad(minutes: number): Load {
  if (minutes <= 0) return 'empty'
  return minutes >= FULL_DAY_MINUTES ? 'full' : 'some'
}

// Espaços vagos do dia dentro da janela, para a agenda mostrar "Livre · 14:00
// às 16:30". Ignora sobras menores que minGap.
export function freeGaps({
  day,
  busy,
  now = new Date(),
  minGap = 30,
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
