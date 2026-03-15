import { NextRequest, NextResponse } from 'next/server'

const SITE_TOKEN = process.env.SITE_TOKEN

export async function POST(request: NextRequest) {
  if (!SITE_TOKEN) {
    // No token configured = open access
    return NextResponse.json({ ok: true })
  }

  const { token } = await request.json()

  if (token === SITE_TOKEN) {
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: false, error: 'Token inválido' }, { status: 401 })
}
