// Telefones guardados só com dígitos e DDI: 5548998402796.

// "(48) 99840-2796" → "5548998402796". Devolve null se não for um número válido.
export function normalizePhone(input: string) {
  let digits = input.replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`
  return /^55\d{10,11}$/.test(digits) ? digits : null
}

// "5548998402796" → "(48) 99840-2796"
export function formatPhone(phone: string) {
  const local = phone.startsWith('55') ? phone.slice(2) : phone
  const ddd = local.slice(0, 2)
  const number = local.slice(2)
  const split = number.length - 4
  return `(${ddd}) ${number.slice(0, split)}-${number.slice(split)}`
}

export function whatsappTo(phone: string, message?: string) {
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${phone}${text}`
}
