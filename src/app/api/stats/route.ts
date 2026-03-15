import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { validateRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authError = validateRequest(request)
  if (authError) return authError

  const supabase = createClient()

  const [typesRes, minDateRes, maxDateRes, personsRes, datesRes, personsTopRes] = await Promise.all([
    supabase.from('documents').select('doc_type'),
    supabase.from('documents').select('date').not('date', 'is', null).order('date', { ascending: true }).limit(1),
    supabase.from('documents').select('date').not('date', 'is', null).order('date', { ascending: false }).limit(1),
    supabase.from('persons').select('id, name').order('name'),
    supabase.from('documents').select('date').not('date', 'is', null),
    supabase.rpc('graph_nodes'),
  ])

  if (typesRes.error) {
    console.error('Stats error:', typesRes.error)
    return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 })
  }

  const docs = typesRes.data || []
  const total = docs.length
  const by_type: Record<string, number> = {}
  for (const doc of docs) {
    by_type[doc.doc_type] = (by_type[doc.doc_type] || 0) + 1
  }

  const date_range = {
    min: minDateRes.data?.[0]?.date || null,
    max: maxDateRes.data?.[0]?.date || null,
  }

  const persons = personsRes.data || []

  // Build date histogram
  const byDateMap: Record<string, number> = {}
  for (const doc of (datesRes.data || [])) {
    byDateMap[doc.date] = (byDateMap[doc.date] || 0) + 1
  }
  const by_date = Object.entries(byDateMap)
    .map(function(entry) { return { date: entry[0], count: entry[1] } })
    .sort(function(a, b) { return a.date.localeCompare(b.date) })

  const persons_top = personsTopRes.data || []

  return NextResponse.json({ total, by_type, date_range, persons, by_date, persons_top })
}
