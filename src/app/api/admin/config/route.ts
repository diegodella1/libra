import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { verifySession } from '@/lib/admin-auth'

export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createClient()

  const { data } = await supabase
    .from('site_config')
    .select('key, value, updated_at')

  const config: Record<string, unknown> = {}
  for (const row of data || []) {
    config[row.key] = row.value
  }

  return NextResponse.json(config)
}

export async function PUT(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { key, value } = await request.json()

  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key y value son requeridos' }, { status: 400 })
  }

  const supabase = createClient()

  const { error } = await supabase
    .from('site_config')
    .upsert({ key, value, updated_at: new Date().toISOString() })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
