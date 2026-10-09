import 'server-only'
import { requireUser } from '@/lib/auth'

// Todos os serviços, inclusive os desativados. Só para o painel (exige login).
export async function listAllServices() {
  const { supabase } = await requireUser()
  const { data, error } = await supabase.from('services').select('*').order('sort_order')
  if (error) throw error
  return data
}

export function categoriesOf(services: { category: string }[]) {
  return [...new Set(services.map((s) => s.category))]
}
