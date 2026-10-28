// Datas da agenda no horário de Brasília. Hoje o fuso é UTC-3 (sem horário de
// verão desde 2019), mas o deslocamento é calculado pela base de fusos do
// sistema: se o horário de verão voltar, as datas continuam certas.
const OFFSET = '-03:00'
const tz = 'America/Sao_Paulo'

const offsetFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })

// Deslocamento de Brasília num dia e hora: "-03:00" (ou "-02:00" no verão).
function offsetAt(day: string, time: string) {
  const instant = new Date(`${day}T${time}:00${OFFSET}`)
  const name = offsetFmt.formatToParts(instant).find((p) => p.type === 'timeZoneName')?.value
  const offset = name?.replace('GMT', '')
  return offset && /^[+-]\d{2}:\d{2}$/.test(offset) ? offset : OFFSET
}

// Dia de hoje em Brasília, "AAAA-MM-DD".
export function todayISO(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now)
}

// "HH:MM" de verdade: recusa "25:99" (antes passava e o banco recusava com erro genérico).
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export function isValidDay(day: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(`${day}T00:00:00${OFFSET}`))
}

export function addDays(day: string, amount: number) {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

// Início e fim do dia em Brasília, para filtrar starts_at.
export function dayRange(day: string) {
  return {
    start: toTimestamp(day, '00:00'),
    end: toTimestamp(addDays(day, 1), '00:00'),
  }
}

// "2026-10-12" + "14:30" → "2026-10-12T14:30:00-03:00"
export function toTimestamp(day: string, time: string) {
  return `${day}T${time}:00${offsetAt(day, time)}`
}

const titleFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

// "2026-10-12" → "Segunda, 12 de outubro"
export function formatDayTitle(day: string) {
  const text = titleFmt.format(new Date(`${day}T12:00:00Z`)).replace('-feira', '')
  return text[0].toUpperCase() + text.slice(1)
}

const weekdayFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long' })

// "2026-10-30" → "sexta, 30/10" (mensagem para a cliente)
export function formatDayShort(day: string) {
  const weekday = weekdayFmt.format(new Date(`${day}T12:00:00Z`)).replace('-feira', '')
  return `${weekday}, ${day.slice(8)}/${day.slice(5, 7)}`
}

const timeFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: tz,
  hour: '2-digit',
  minute: '2-digit',
})

// "2026-10-12T17:00:00Z" → "14:00"
export function formatTime(iso: string) {
  return timeFmt.format(new Date(iso))
}

// Dia (em Brasília) de um horário, "AAAA-MM-DD".
export function dayOf(iso: string) {
  return todayISO(new Date(iso))
}

// Mês atual em Brasília, "AAAA-MM".
export function monthISO(now = new Date()) {
  return todayISO(now).slice(0, 7)
}

export function isValidMonth(month: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
}

export function addMonths(month: string, amount: number) {
  const [y, m] = month.split('-').map(Number)
  const total = y * 12 + (m - 1) + amount
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

// Início e fim do mês em Brasília.
export function monthRange(month: string) {
  return {
    start: toTimestamp(`${month}-01`, '00:00'),
    end: toTimestamp(`${addMonths(month, 1)}-01`, '00:00'),
  }
}

const monthFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: 'long', year: 'numeric' })

// "2026-10" → "Outubro de 2026"
export function formatMonthTitle(month: string) {
  const text = monthFmt.format(new Date(`${month}-15T12:00:00Z`))
  return text[0].toUpperCase() + text.slice(1)
}

// Horários de 15 em 15 minutos, das 6h às 22h: o horário dela é flexível.
export const timeOptions = Array.from({ length: 65 }, (_, i) => {
  const minutes = 6 * 60 + i * 15
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
})

// "14:30" + 150 → "17:00"
export function addMinutesToTime(time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// Segunda-feira da semana de um dia, "AAAA-MM-DD".
export function weekStart(day: string) {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay() // 0 = domingo
  return addDays(day, -((weekday + 6) % 7))
}

const shortWeekday = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'short' })

// "2026-10-12" → "seg"
export function formatShortWeekday(day: string) {
  return shortWeekday.format(new Date(`${day}T12:00:00Z`)).replace('.', '')
}
