export const expenseCategories = {
  rent: 'Aluguel',
  mei: 'MEI',
  materials: 'Materiais',
  other: 'Outros',
} as const

export type ExpenseCategory = keyof typeof expenseCategories

// Meses são guardados como o dia 1: "2026-10" → "2026-10-01".
export function monthStart(month: string) {
  return `${month}-01`
}
