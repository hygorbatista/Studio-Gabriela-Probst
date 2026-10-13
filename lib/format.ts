// Formatação pt-BR, usada no servidor e no navegador.

// 180 → "3 h", 150 → "2 h 30", 45 → "45 min"; com upTo: "até 2 h".
export function formatDuration(minutes: number, upTo = false) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const text = h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m}`
  return upTo ? `até ${text}` : text
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatPrice(value: number) {
  return brl.format(value)
}

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

// "2026-10-12T12:00:00Z" → "12/10/2026, 09:00" (horário de Brasília)
export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso))
}

export const statusLabels: Record<string, string> = {
  scheduled: 'Agendado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Faltou',
}

// Aceita "180", "180,50", "R$ 1.234,50". Vazio vira undefined.
export function parseMoney(raw: unknown) {
  let text = String(raw ?? '').replace(/[^\d,.]/g, '')
  if (text.includes(',')) text = text.replace(/\./g, '').replace(',', '.')
  return text === '' ? undefined : Number(text)
}

export const paymentMethods = {
  pix: 'Pix',
  cash: 'Dinheiro',
  debit: 'Débito',
  credit: 'Crédito',
} as const

export type PaymentMethod = keyof typeof paymentMethods
