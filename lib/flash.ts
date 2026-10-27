// Avisos de "deu certo" depois de salvar. A Server Action redireciona com
// ?ok=<código> e o painel mostra a mensagem por alguns segundos.

export const flashMessages = {
  agendado: 'Atendimento agendado',
  lancado: 'Atendimento lançado',
  concluido: 'Atendimento concluído',
  cancelado: 'Atendimento cancelado',
  falta: 'Falta registrada',
  reaberto: 'Atendimento reaberto',
  bloqueado: 'Horário bloqueado',
  desbloqueado: 'Horário desbloqueado',
  'cliente-salva': 'Cliente salva',
  'cliente-excluida': 'Cliente excluída',
  'servico-salvo': 'Serviço salvo',
  'servico-desativado': 'Serviço desativado',
  'servico-reativado': 'Serviço reativado',
  'servico-excluido': 'Serviço excluído',
  'despesa-salva': 'Despesa salva',
  'despesa-excluida': 'Despesa excluída',
  'despesa-encerrada': 'Despesa encerrada',
  'metas-salvas': 'Metas salvas',
} as const

export type FlashCode = keyof typeof flashMessages

// "/painel?d=2026-10-14" + "agendado" → "/painel?d=2026-10-14&ok=agendado"
export function withFlash(path: string, code: FlashCode) {
  return `${path}${path.includes('?') ? '&' : '?'}ok=${code}`
}
