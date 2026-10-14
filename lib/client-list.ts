// Textos curtos sobre a cliente, para a lista e a ficha. Funções puras.

import { addDays, dayOf, formatShortWeekday, formatTime, todayISO } from '@/lib/agenda'

type Appointment = { starts_at: string; status: string }

// "Maria da Silva" → "MS"; "Ana" → "A". Ignora "da", "de", "dos"...
export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter((w) => !/^(da|de|do|das|dos|e)$/i.test(w))
  const first = words[0]?.[0] ?? '?'
  const last = words.length > 1 ? words.at(-1)![0] : ''
  return (first + last).toUpperCase()
}

// Tom fixo por nome (0 a 3): a mesma cliente sempre com a mesma cor.
export function tone(name: string) {
  let sum = 0
  for (const char of name) sum += char.codePointAt(0)!
  return sum % 4
}

// Dias de calendário (Brasília) entre um horário e hoje: "hoje", "ontem", "há 12 dias".
export function daysAgo(iso: string, now = new Date()) {
  const day = dayOf(iso)
  const today = todayISO(now)
  if (day === today) return 'hoje'
  if (day === addDays(today, -1)) return 'ontem'
  const diff = Math.round((Date.parse(today) - Date.parse(day)) / 86_400_000)
  return `há ${diff} dias`
}

// "2026-10-16T17:00:00Z" → "sex, 16/10 às 14:00"
export function formatNextVisit(iso: string) {
  const day = dayOf(iso)
  return `${formatShortWeekday(day)}, ${day.slice(8)}/${day.slice(5, 7)} às ${formatTime(iso)}`
}

// Linha de contexto na lista: o próximo horário, senão a última visita.
export function clientContext(appointments: Appointment[], now = new Date()) {
  const next = appointments
    .filter((a) => a.status === 'scheduled' && Date.parse(a.starts_at) >= now.getTime())
    .map((a) => a.starts_at)
    .sort()[0]
  if (next) return { kind: 'next' as const, text: `Próximo: ${formatNextVisit(next)}` }

  const last = appointments
    .filter((a) => a.status === 'completed')
    .map((a) => a.starts_at)
    .sort()
    .at(-1)
  if (last) return { kind: 'last' as const, text: `Última visita ${daysAgo(last, now)}` }

  return { kind: 'none' as const, text: 'Ainda sem atendimentos' }
}
