import { cacheLife, cacheTag } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import type { Database } from '@/lib/supabase/database.types'

export type Service = Database['public']['Tables']['services']['Row']

// Etiqueta do cache dos serviços. O painel chama updateTag(SERVICES_TAG) ao salvar.
export const SERVICES_TAG = 'services'

// Serviços ativos para o site. Ficam em cache até o painel alterar algum.
export async function getActiveServices() {
  'use cache'
  cacheTag(SERVICES_TAG)
  cacheLife('max')

  const { data, error } = await createPublicClient()
    .from('services')
    .select('*')
    .eq('active', true)
    .order('sort_order')

  if (error) throw error
  return data
}

// Agrupa pela categoria, mantendo a ordem em que aparecem.
export function groupByCategory(services: Service[]) {
  const groups = new Map<string, Service[]>()
  for (const service of services) {
    groups.set(service.category, [...(groups.get(service.category) ?? []), service])
  }
  return [...groups].map(([title, items]) => ({ title, items }))
}
