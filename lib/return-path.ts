// Para onde voltar depois do login. Só aceita endereços dentro do painel: um
// link de fora não pode usar o login para levar a outro site.
export function safeReturnPath(value: unknown) {
  const path = typeof value === 'string' ? value : ''
  return /^\/painel(?:[/?][^\\]*)?$/.test(path) && !path.includes('//') && !path.includes('..') ? path : '/painel'
}
