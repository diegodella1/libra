import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  const type = request.nextUrl.searchParams.get('type')
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') || '20'),
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

  return NextResponse.json({ results: data || [], total: data?.length || 0 })
}
