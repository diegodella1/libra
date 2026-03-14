import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { verifySession } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const period = request.nextUrl.searchParams.get('period') || '7d'
  const days = period === '30d' ? 30 : 7

  const since = new Date()
  since.setDate(since.getDate() - days)

  const supabase = createClient()

  const { data: queries } = await supabase
    .from('query_log')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })

  const allQueries = queries || []

  // Total counts
  const totalSearch = allQueries.filter((q) => q.type === 'search').length
  const totalChat = allQueries.filter((q) => q.type === 'chat').length
  const zeroResults = allQueries.filter((q) => q.results_count === 0).length

  // Top queries (by frequency)
  const queryFreq: Record<string, number> = {}
  for (const q of allQueries) {
    const key = q.query.toLowerCase().trim()
    queryFreq[key] = (queryFreq[key] || 0) + 1
  }
  const topQueries = Object.entries(queryFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }))

  // Zero-result queries
  const zeroResultQueries = allQueries
    .filter((q) => q.results_count === 0)
    .slice(0, 10)
    .map((q) => ({ query: q.query, type: q.type, created_at: q.created_at }))

  // Queries per day
  const perDay: Record<string, number> = {}
  for (const q of allQueries) {
    const day = q.created_at.split('T')[0]
    perDay[day] = (perDay[day] || 0) + 1
  }

  // Avg response time
  const withTime = allQueries.filter((q) => q.response_time_ms != null)
  const avgResponseTime = withTime.length > 0
    ? Math.round(withTime.reduce((s, q) => s + q.response_time_ms, 0) / withTime.length)
    : 0

  return NextResponse.json({
    period,
    totalSearch,
    totalChat,
    zeroResults,
    avgResponseTime,
    topQueries,
    zeroResultQueries,
    perDay,
  })
}
