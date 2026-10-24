// Ordem em que aparecem na lista; "Outros" sempre por último.
// Para criar uma categoria nova, inclua aqui e na regra do banco
// (supabase/migrations/*_despesas_categorias.sql).
export const expenseCategories = {
  rent: 'Aluguel',
  bills: 'Contas (luz, água, internet)',
  mei: 'MEI',
  materials: 'Materiais',
  equipment: 'Equipamentos',
  courses: 'Cursos',
  transport: 'Transporte',
  food: 'Alimentação',
  marketing: 'Marketing',
  other: 'Outros',
} as const

export type ExpenseCategory = keyof typeof expenseCategories

// Meses são guardados como o dia 1: "2026-10" → "2026-10-01".
export function monthStart(month: string) {
  return `${month}-01`
}
