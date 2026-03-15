import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { validateRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authError = validateRequest(request)
  if (authError) return authError

  const supabase = createClient()

  const [nodesRes, edgesRes] = await Promise.all([
    supabase.rpc('graph_nodes'),
    supabase.rpc('graph_edges'),
  ])

  if (nodesRes.error || edgesRes.error) {
    console.error('Graph error:', nodesRes.error, edgesRes.error)
    return NextResponse.json({ error: 'Error obteniendo datos del grafo' }, { status: 500 })
  }

  return NextResponse.json(
    { nodes: nodesRes.data, edges: edgesRes.data },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  )
}
