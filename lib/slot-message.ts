import { formatDayShort } from './agenda'

export type SlotChoice = { day: string; time: string }

// Texto para colar no WhatsApp com os horários que ela escolheu oferecer.
export function slotMessage(service: string, choices: SlotChoice[]) {
  const sorted = [...choices].sort((a, b) => `${a.day}${a.time}`.localeCompare(`${b.day}${b.time}`))
  const when = (c: SlotChoice) => `${formatDayShort(c.day)}, às ${c.time}`
  if (sorted.length === 1) {
    return `Oi! Tenho ${when(sorted[0])} para ${service}. Fica bom pra você?`
  }
  return [
    `Oi! Tenho estes horários para ${service}:`,
    ...sorted.map((c) => `• ${when(c)}`),
    'Qual fica melhor pra você?',
  ].join('\n')
}

// Abre o WhatsApp para escolher a conversa, já com o texto.
export function whatsappShare(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}
