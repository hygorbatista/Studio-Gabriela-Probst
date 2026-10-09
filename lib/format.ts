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
