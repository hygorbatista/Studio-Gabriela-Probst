// Melhores clientes e serviços mais feitos no mês, a partir dos pagamentos.
// Função pura, sem acesso ao banco.

type Payment = {
  amount: number
  appointments: {
    clients: { id: string; name: string } | null
    services: { name: string } | null
  } | null
}

const TOP = 5

export function monthRankings(payments: Payment[]) {
  const clients = new Map<string, { id: string; name: string; total: number; visits: number }>()
  const services = new Map<string, { name: string; total: number; count: number }>()

  for (const p of payments) {
    const client = p.appointments?.clients
    if (client) {
      const c = clients.get(client.id) ?? { ...client, total: 0, visits: 0 }
      c.total += p.amount
      c.visits += 1
      clients.set(client.id, c)
    }
    const service = p.appointments?.services
    if (service) {
      const s = services.get(service.name) ?? { name: service.name, total: 0, count: 0 }
      s.total += p.amount
      s.count += 1
      services.set(service.name, s)
    }
  }

  return {
    topClients: [...clients.values()].sort((a, b) => b.total - a.total).slice(0, TOP),
    topServices: [...services.values()]
      .sort((a, b) => b.count - a.count || b.total - a.total)
      .slice(0, TOP),
  }
}
