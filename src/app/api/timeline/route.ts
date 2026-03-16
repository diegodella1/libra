import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { validateRequest } from '@/lib/auth'

// Key events in the Libra case for timeline markers
const KEY_EVENTS = [
  { date: '2025-02-14', label: 'Lanzamiento del token $LIBRA', color: '#d4a017' },
  { date: '2025-02-15', label: 'Colapso del precio', color: '#ef4444' },
  { date: '2025-02-17', label: 'Milei borra el tweet', color: '#f97316' },
]

export async function GET(request: NextRequest) {
  const authError = validateRequest(request)
  if (authError) return authError

  const supabase = createClient()

  const { data: docs, error } = await supabase
    .from('documents')
    .select('date, doc_type')
    .not('date', 'is', null)

  if (error) {
    return NextResponse.json({ error: 'Error obteniendo datos' }, { status: 500 })
  }

  // Build histogram: date → { type → count }
  const histogram: Record<string, Record<string, number>> = {}
  let totalWithDate = 0
  for (const doc of docs || []) {
    if (!doc.date) continue
    totalWithDate++
    if (!histogram[doc.date]) histogram[doc.date] = {}
    histogram[doc.date][doc.doc_type] = (histogram[doc.date][doc.doc_type] || 0) + 1
  }

  // Get total docs for percentage
  const { count: totalDocs } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })

  const bars = Object.entries(histogram)
    .map(([date, types]) => ({ date, types }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const pctWithDate = totalDocs ? Math.round((totalWithDate / totalDocs) * 100) : 0

  return NextResponse.json({
    bars,
    events: KEY_EVENTS,
    totalWithDate,
    totalDocs: totalDocs || 0,
    pctWithDate,
  })
}
