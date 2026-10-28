// Melhores clientes e serviços mais feitos no mês, a partir dos pagamentos.
// Função pura, sem acesso ao banco.

type Payment = {
  amount: number
  appointments: {
    clients: { id: string; name: string } | null
    services: { name: string } | null
    // Atendimento com mais de um serviço (desde 2026-10-27).
    appointment_services?: { price: number; services: { name: string } | null }[]
  } | null
}

// Os serviços de um pagamento, cada um com a sua parte do valor. Com vários
// serviços, o valor pago é dividido na proporção dos preços do dia.
function serviceShares(p: Payment) {
  const items = (p.appointments?.appointment_services ?? []).filter((i) => i.services)
  if (items.length === 0) {
    const name = p.appointments?.services?.name
    return name ? [{ name, amount: p.amount }] : []
  }
  const total = items.reduce((sum, i) => sum + i.price, 0)
  return items.map((i) => ({
    name: i.services!.name,
    amount: total > 0 ? (p.amount * i.price) / total : p.amount / items.length,
  }))
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
    for (const share of serviceShares(p)) {
      const s = services.get(share.name) ?? { name: share.name, total: 0, count: 0 }
      s.total += share.amount
      s.count += 1
      services.set(share.name, s)
    }
  }

  return {
    topClients: [...clients.values()].sort((a, b) => b.total - a.total).slice(0, TOP),
    topServices: [...services.values()]
      .sort((a, b) => b.count - a.count || b.total - a.total)
      .slice(0, TOP),
  }
}
