// Datas da agenda no horário de Brasília. O Brasil não tem horário de verão
// desde 2019, então o fuso é sempre UTC-3.
const OFFSET = '-03:00'
const tz = 'America/Sao_Paulo'

// Dia de hoje em Brasília, "AAAA-MM-DD".
export function todayISO(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now)
}

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
    start: `${day}T00:00:00${OFFSET}`,
    end: `${addDays(day, 1)}T00:00:00${OFFSET}`,
  }
}

// "2026-10-12" + "14:30" → "2026-10-12T14:30:00-03:00"
export function toTimestamp(day: string, time: string) {
  return `${day}T${time}:00${OFFSET}`
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
