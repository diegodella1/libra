import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: doc, error } = await supabase
    .from('documents')
    .select('id, date, doc_type, participants, tags')
    .eq('id', params.id)
    .single()

  if (error || !doc) {
    return NextResponse.json({ documents: [] })
  }

  // Find related docs by same date or same doc_type, excluding current
  let query = supabase
    .from('documents')
    .select('id, title, doc_type, date, participants, tags, file_path, file_size')
    .neq('id', params.id)
    .limit(5)

  if (doc.date) {
    // Same date first, then same type
    query = query.eq('date', doc.date).order('date', { ascending: false })
  } else if (doc.doc_type) {
    query = query.eq('doc_type', doc.doc_type).order('date', { ascending: false, nullsFirst: false })
  }

  const { data: related } = await query

  // If we got fewer than 5 from date match, try to fill with same type
  let documents = related || []
  if (doc.date && documents.length < 5) {
    const existingIds = [params.id, ...documents.map((d) => d.id)]
    const { data: typeRelated } = await supabase
      .from('documents')
      .select('id, title, doc_type, date, participants, tags, file_path, file_size')
      .eq('doc_type', doc.doc_type)
      .not('id', 'in', `(${existingIds.join(',')})`)
      .order('date', { ascending: false, nullsFirst: false })
      .limit(5 - documents.length)

    if (typeRelated) {
      documents = [...documents, ...typeRelated]
    }
  }

  return NextResponse.json({ documents })
}
