import { addDays, formatDayShort } from './agenda'

// Lembrete da véspera (docs/12-plano-agendamentos.md, item 5.1), pronto para
// o WhatsApp. "amanhã" quando é amanhã; senão, o dia da semana e a data.
export function reminderMessage({
  name,
  service,
  day,
  time,
  today,
}: {
  name: string
  service: string | null
  day: string
  time: string
  today: string
}) {
  const firstName = name.split(' ')[0]
  const date = formatDayShort(day)
  // "na quarta, 28/10", "no sábado, 31/10"
  const when = day === addDays(today, 1) ? `amanhã (${date})` : `${/^(sábado|domingo)/.test(date) ? 'no' : 'na'} ${date}`
  const what = service ? ` de ${service.toLowerCase()}` : ''
  return `Oi, ${firstName}! Passando para lembrar do seu horário${what} ${when}, às ${time}. Posso confirmar?`
}
