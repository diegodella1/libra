import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { verifySession } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const page = parseInt(params.get('page') || '1')
  const limit = Math.min(parseInt(params.get('limit') || '20'), 100)
  const type = params.get('type')
  const q = params.get('q')
  const offset = (page - 1) * limit

  const supabase = createClient()

  let query = supabase
    .from('documents')
    .select('id, title, doc_type, date, participants, tags, file_path, file_size, ocr_status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type) query = query.eq('doc_type', type)
  if (q) query = query.ilike('title', `%${q}%`)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ documents: data || [], total: count || 0, page, limit })
}

export async function POST(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { title, doc_type, date, participants, tags, content, file_path } = body

  if (!title || !file_path) {
    return NextResponse.json({ error: 'title y file_path son requeridos' }, { status: 400 })
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('documents')
    .insert({
      title,
      doc_type: doc_type || 'otro',
      date: date || null,
      participants: participants || [],
      tags: tags || [],
      content: content || null,
      file_path,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
