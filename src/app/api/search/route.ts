import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { createHash } from 'crypto'
import { validateRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authError = validateRequest(request)
  if (authError) return authError

  const startTime = Date.now()
  const q = request.nextUrl.searchParams.get('q')
  const type = request.nextUrl.searchParams.get('type')
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') || '20', 10) || 20,
    100
  )

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ results: [], total: 0 })
  }

  const supabase = createClient()

  const { data, error } = await supabase.rpc('search_documents', {
    query: q,
    max_results: limit,
  })

  if (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 })
  }

  let results = data || []

  if (type) results = results.filter((d: any) => d.doc_type === type)

  const date_from = request.nextUrl.searchParams.get('date_from')
  const date_to = request.nextUrl.searchParams.get('date_to')
  const person = request.nextUrl.searchParams.get('person')

  if (date_from) results = results.filter((d: any) => d.date && d.date >= date_from)
  if (date_to) results = results.filter((d: any) => d.date && d.date <= date_to)
  if (person) results = results.filter((d: any) => d.participants?.some((p: string) => p.toLowerCase().includes(person.toLowerCase())))

  // Fire-and-forget query log
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  Promise.resolve(supabase.from('query_log').insert({
    type: 'search',
    query: q,
    results_count: results.length,
    ip_hash: createHash('sha256').update(ip).digest('hex').slice(0, 16),
    response_time_ms: Date.now() - startTime,
  })).catch(() => {})

  return NextResponse.json({ results, total: results.length })
}
