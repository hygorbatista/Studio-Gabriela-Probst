// Resumo da cliente calculado a partir dos atendimentos: nada é digitado à mão,
// então os números estão sempre certos.

type Appointment = {
  starts_at: string
  status: string
  price_charged: number
  services: { name: string } | null
}

const tz = 'America/Sao_Paulo'
const weekdayFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: tz, weekday: 'long' })
const hourFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' })

// Valor mais frequente de uma lista (empate: o que apareceu primeiro).
function mode<T>(items: T[]) {
  const counts = new Map<T, number>()
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1)
  let best: T | undefined
  let bestCount = 0
  for (const [item, count] of counts) {
    if (count > bestCount) [best, bestCount] = [item, count]
  }
  return best
}

export function clientStats(appointments: Appointment[], now = new Date()) {
  const done = appointments.filter((a) => a.status === 'completed')
  const upcoming = appointments
    .filter((a) => a.status === 'scheduled' && new Date(a.starts_at) >= now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))

  const dates = done.map((a) => new Date(a.starts_at))
  // Horário favorito só faz sentido a partir de 2 atendimentos.
  const favoriteDay = done.length >= 2 ? mode(dates.map((d) => weekdayFmt.format(d))) : undefined
  const favoriteHour = done.length >= 2 ? mode(dates.map((d) => Number(hourFmt.format(d)))) : undefined

  return {
    visits: done.length,
    totalSpent: done.reduce((sum, a) => sum + a.price_charged, 0),
    averageTicket: done.length ? done.reduce((sum, a) => sum + a.price_charged, 0) / done.length : 0,
    lastVisit: done.length ? done.map((a) => a.starts_at).sort().at(-1) : undefined,
    nextVisit: upcoming[0]?.starts_at,
    favoriteService: mode(done.map((a) => a.services?.name).filter(Boolean)),
    // "terça-feira" + 14 → "Terças, por volta das 14h"
    favoriteTime:
      favoriteDay && favoriteHour !== undefined
        ? `${favoriteDay.replace('-feira', '')[0].toUpperCase()}${favoriteDay.replace('-feira', '').slice(1)}s, por volta das ${favoriteHour}h`
        : undefined,
  }
}

const months = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

// "1990-03-12" → "12 de março (36 anos)". Lê a data como texto para não
// sofrer com fuso horário.
export function formatBirthday(birthDate: string, now = new Date()) {
  const [y, m, d] = birthDate.split('-').map(Number)
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now).split('-').map(Number)
  let age = today[0] - y
  if (today[1] < m || (today[1] === m && today[2] < d)) age--
  return `${d} de ${months[m - 1]} (${age} anos)`
}
