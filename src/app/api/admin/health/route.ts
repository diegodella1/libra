import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { verifySession } from '@/lib/admin-auth'

export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const checks: Record<string, { ok: boolean; latency?: number; error?: string }> = {}

  // Check Supabase
  try {
    const start = Date.now()
    const supabase = createClient()
    const { error } = await supabase.from('documents').select('id', { count: 'exact', head: true })
    checks.supabase = { ok: !error, latency: Date.now() - start, error: error?.message }
  } catch (err) {
    checks.supabase = { ok: false, error: String(err) }
  }

  // Check OpenRouter
  const openrouterKey = process.env.OPENROUTER_API_KEY
  if (openrouterKey) {
    try {
      const start = Date.now()
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${openrouterKey}` },
        signal: AbortSignal.timeout(5000),
      })
      checks.openrouter = { ok: res.ok, latency: Date.now() - start }
    } catch (err) {
      checks.openrouter = { ok: false, error: String(err) }
    }
  } else {
    checks.openrouter = { ok: false, error: 'API key no configurada' }
  }

  const allOk = Object.values(checks).every((c) => c.ok)

  return NextResponse.json({ status: allOk ? 'healthy' : 'degraded', checks })
}
