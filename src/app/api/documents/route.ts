import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { validateRequest } from '@/lib/auth'

const LIST_FIELDS = 'id, title, doc_type, date, participants, tags, file_path, file_size'

function makeSnippet(raw: string | null): string {
  if (!raw) return ''
  const cleaned = raw
    .replace(/Informe de la extracción[^\n]*/i, '')
    .replace(/Archivo de origen:[^\n]*/gi, '')
    .replace(/EXTRACTION_FFS\.zip[^\n]*/g, '')
    .replace(/Información de origen:[^\n]*/gi, '')
    .replace(/\(Tabla:\s*\w+;[^)]*\)/g, '')
    .replace(/\(Tamaño:\s*\d+\s*bytes\)/g, '')
    .replace(/0x[0-9A-Fa-f]+/g, '')
    .replace(/@s\.whatsapp\.net/g, '')
    .replace(/\(UTC[^)]*\)/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  if (cleaned.length <= 150) return cleaned
  const truncated = cleaned.slice(0, 150)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated) + '…'
}

export async function GET(request: NextRequest) {
  const authError = validateRequest(request)
  if (authError) return authError

  const params = request.nextUrl.searchParams
  const ids = params.get('ids')
  const type = params.get('type')
  const date_from = params.get('date_from')
  const date_to = params.get('date_to')
  const person = params.get('person')
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1)
  const limit = Math.min(parseInt(params.get('limit') || '20', 10) || 20, 100)

  const supabase = createClient()

  // Fetch by specific IDs
  if (ids) {
    const idList = ids.split(',').map((id) => id.trim()).filter(Boolean)
    const { data, error } = await supabase
      .from('documents')
      .select(LIST_FIELDS)
      .in('id', idList)

    if (error) {
      return NextResponse.json({ error: 'Error consultando documentos' }, { status: 500 })
    }
    return NextResponse.json({ documents: data || [], total: data?.length || 0, page: 1, limit: idList.length })
  }

  // Person filter requires client-side filtering (participants is an array)
  if (person) {
    let query = supabase
      .from('documents')
      .select(LIST_FIELDS)

    if (type) query = query.eq('doc_type', type)
    if (date_from) query = query.gte('date', date_from)
    if (date_to) query = query.lte('date', date_to)
    query = query.order('date', { ascending: false, nullsFirst: false })

    const { data: allData, error } = await query
    if (error) {
      console.error('Browse error:', error)
      return NextResponse.json({ error: 'Error consultando documentos' }, { status: 500 })
    }
    const filtered = (allData || []).filter((d: any) =>
      d.participants?.some((p: string) => p.toLowerCase().includes(person.toLowerCase()))
    )
    const total = filtered.length
    const offset = (page - 1) * limit
    const documents = filtered.slice(offset, offset + limit)
    return NextResponse.json({ documents, total, page, limit })
  }

  // Use RPC for efficient browsing with content preview
  const { data, error } = await supabase.rpc('documents_browse', {
    p_type: type || null,
    p_date_from: date_from || null,
    p_date_to: date_to || null,
    p_page: page,
    p_limit: limit,
  })

  if (error) {
    console.error('Browse RPC error:', error)
    return NextResponse.json({ error: 'Error consultando documentos' }, { status: 500 })
  }

  const rows = data || []
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0
  const documents = rows.map((r: any) => {
    const { total_count, snippet: raw, ...rest } = r
    return { ...rest, snippet: makeSnippet(raw) }
  })

  return NextResponse.json({ documents, total, page, limit })
}
