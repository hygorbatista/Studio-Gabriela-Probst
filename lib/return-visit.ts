import { addDays } from './agenda'

// Retorno sugerido depois de concluir (docs/12-plano-agendamentos.md, item 4.1):
// o mesmo horário, return_days dias depois. Sem prazo no serviço, ou com a
// data já no passado (lançamento antigo), não sugere nada.
export function suggestReturn({
  day,
  time,
  returnDays,
  today,
}: {
  day: string
  // null quando o atendimento foi lançado sem horário.
  time: string | null
  returnDays: number | null | undefined
  today: string
}) {
  if (!returnDays) return null
  const suggested = addDays(day, returnDays)
  if (suggested <= today) return null
  return { day: suggested, time }
}
