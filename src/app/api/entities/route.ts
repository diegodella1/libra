import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { validateRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authError = validateRequest(request)
  if (authError) return authError

  const { searchParams } = request.nextUrl
  const type = searchParams.get('type') || null
  const q = searchParams.get('q') || null
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)))

  const supabase = createClient()
  const { data, error } = await supabase.rpc('browse_entities', {
    p_type: type,
    p_search: q,
    p_page: page,
    p_limit: limit,
  })

  if (error) {
    console.error('browse_entities error:', error)
    return NextResponse.json({ error: 'Error consultando entidades' }, { status: 500 })
  }

  const rows = data || []
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0
  const entities = rows.map((r: Record<string, unknown>) => ({
    id: r.id,
    entity_type: r.entity_type,
    value: r.value,
    display_name: r.display_name,
    doc_count: Number(r.doc_count),
  }))

  return NextResponse.json({ entities, total, page })
}
