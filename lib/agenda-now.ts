// Onde o "agora" cai na agenda do dia e quais atendimentos pedem atenção.

export type Moment = 'now' | 'late' | 'next'

type Item = { id: string; starts_at: string; ends_at: string; status: string }

export function agendaMoments(appointments: Item[], now: Date) {
  const t = now.getTime()
  const moments = new Map<string, Moment>()
  let nextFound = false

  for (const a of appointments) {
    if (a.status !== 'scheduled') continue
    const start = Date.parse(a.starts_at)
    if (start <= t) {
      // Já começou e não foi concluído: em andamento ou esquecido.
      moments.set(a.id, Date.parse(a.ends_at) > t ? 'now' : 'late')
    } else if (!nextFound) {
      moments.set(a.id, 'next')
      nextFound = true
    }
  }

  // A linha "Agora" entra antes do primeiro atendimento que ainda não começou.
  const index = appointments.findIndex((a) => Date.parse(a.starts_at) > t)
  return { moments, nowIndex: index === -1 ? appointments.length : index }
}

// Pede "Concluir": agendado que já começou (hoje ou em dia passado).
export function needsCompletion(moment: Moment | undefined) {
  return moment === 'now' || moment === 'late'
}
