import { addDays, dayOf, todayISO } from './agenda'
import { returnDaysOf } from './return-visit'

// "Hora de voltar" (docs/12-plano-agendamentos.md, item 4.3): clientes cujo
// retorno chegou (ou chega em poucos dias) e que não têm nada marcado. O prazo
// vem dos serviços da última visita (o menor deles); só serviço avulso não
// entra. Evolui as "sumidas", que usavam um prazo fixo para todas.

type ServiceInfo = { id: string; name: string; return_days: number | null }

type Client = {
  id: string
  name: string
  phone: string | null
  appointments: {
    starts_at: string
    status: string
    services: ServiceInfo | null
    // Vários serviços (mãos e pés), em ordem.
    appointment_services?: { position: number; services: ServiceInfo | null }[]
  }[]
}

// Avisa alguns dias antes: dá tempo de a cliente achar um horário.
export const DUE_SOON_DAYS = 3
// Sem serviço registrado (lançamento antigo), vale o padrão de um mês.
const DEFAULT_RETURN_DAYS = 30

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000)

export function dueClients(clients: Client[], inactiveDays: number, now = new Date()) {
  const today = todayISO(now)
  const list = []

  for (const c of clients) {
    if (c.appointments.some((a) => a.status === 'scheduled' && new Date(a.starts_at) >= now)) continue
    // A última visita: concluída, ou agendada que já passou e ela esqueceu de
    // concluir (a cliente veio; não é hora de convidar de novo por causa dela).
    const last = c.appointments
      .filter((a) => a.status === 'completed' || (a.status === 'scheduled' && new Date(a.starts_at) < now))
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      .at(-1)
    if (!last) continue

    const items = [...(last.appointment_services ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((i) => i.services)
      .filter((s): s is ServiceInfo => !!s)
    const services = items.length ? items : last.services ? [last.services] : []
    const returnDays = services.length ? returnDaysOf(services) : DEFAULT_RETURN_DAYS
    if (!returnDays) continue

    const lastDay = dayOf(last.starts_at)
    const dueDay = addDays(lastDay, returnDays)
    // Positivo: dias de atraso; negativo: faltam tantos dias.
    const late = daysBetween(dueDay, today)
    if (late < -DUE_SOON_DAYS) continue

    const daysAway = daysBetween(lastDay, today)
    list.push({
      id: c.id,
      name: c.name,
      phone: c.phone,
      services,
      lastDay,
      dueDay,
      late,
      daysAway,
      // Passou muito do prazo: provavelmente sumiu, o convite muda de tom.
      gone: daysAway > inactiveDays,
    })
  }

  // Primeiro quem acabou de vencer (mais chance de voltar); as sumidas por último.
  return list.sort((a, b) => Number(a.gone) - Number(b.gone) || a.late - b.late)
}

// "Manicure + Pedicure"
export const servicesName = (services: { name: string }[]) => services.map((s) => s.name).join(' + ')

// Convite pronto para o WhatsApp.
export function returnMessage(c: { name: string; services: { name: string }[]; gone: boolean }) {
  const firstName = c.name.split(' ')[0]
  if (c.gone || c.services.length === 0) {
    return `Olá, ${firstName}! Tudo bem? Faz um tempinho desde a sua última visita. Quer agendar um horário?`
  }
  // Frase neutra: "da sua manutenção", mas "do seu banho de gel".
  return `Oi, ${firstName}! Tudo bem? Já está na hora do seu retorno (${servicesName(c.services).toLowerCase()}). Quer que eu veja um horário pra você?`
}

// "Retorno em 2 dias", "Retorno hoje", "Passou 5 dias do retorno"
export function dueLabel(late: number) {
  if (late < 0) return `Retorno em ${-late} ${late === -1 ? 'dia' : 'dias'}`
  if (late === 0) return 'Retorno hoje'
  return `Passou ${late} ${late === 1 ? 'dia' : 'dias'} do retorno`
}
