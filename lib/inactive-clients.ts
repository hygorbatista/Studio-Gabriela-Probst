// Clientes "sumidas": já vieram, a última visita foi há mais de N dias e não
// têm nada agendado. Função pura, sem acesso ao banco.

type Client = {
  id: string
  name: string
  phone: string | null
  appointments: { starts_at: string; status: string }[]
}

const DAY = 24 * 60 * 60 * 1000

export function inactiveClients(clients: Client[], thresholdDays: number, now = new Date()) {
  return clients
    .map((c) => {
      const visits = c.appointments
        .filter((a) => a.status === 'completed')
        .map((a) => a.starts_at)
        .sort()
      const upcoming = c.appointments.some(
        (a) => a.status === 'scheduled' && new Date(a.starts_at) >= now
      )
      const lastVisit = visits.at(-1)
      const daysAway = lastVisit
        ? Math.floor((now.getTime() - new Date(lastVisit).getTime()) / DAY)
        : null
      return { id: c.id, name: c.name, phone: c.phone, lastVisit, daysAway, upcoming }
    })
    .filter((c) => c.daysAway !== null && c.daysAway > thresholdDays && !c.upcoming)
    .sort((a, b) => b.daysAway! - a.daysAway!)
    .map(({ id, name, phone, lastVisit, daysAway }) => ({
      id,
      name,
      phone,
      lastVisit: lastVisit!,
      daysAway: daysAway!,
    }))
}
