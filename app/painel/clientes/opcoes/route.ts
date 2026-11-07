import { NextResponse, type NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { supabase } = await requireUser()
  const term = (request.nextUrl.searchParams.get('q') ?? '').slice(0, 80)
  const page = Math.max(1, Math.min(50000, Number(request.nextUrl.searchParams.get('p')) || 1))
  const { data, error } = await supabase
    .rpc('client_options', { p_term: term, p_offset: (Math.floor(page) - 1) * 20 })
    .abortSignal(request.signal)
  const headers = { 'Cache-Control': 'private, no-store' }
  if (error) return NextResponse.json({ error: 'Não foi possível carregar as clientes.' }, { status: 503, headers })
  return NextResponse.json({ clients: data.slice(0, 20), hasMore: data.length > 20 }, { headers })
}
