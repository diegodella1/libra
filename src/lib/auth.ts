import { NextRequest, NextResponse } from 'next/server'

const SITE_TOKEN = process.env.SITE_TOKEN

export function validateRequest(request: NextRequest): NextResponse | null {
  if (!SITE_TOKEN) return null // No token = open access

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  // Also check cookie
  const cookieToken = request.cookies.get('libra_token')?.value

  // Also check query param (for backwards compat with frontend)
  const paramToken = request.nextUrl.searchParams.get('token')

  if (token === SITE_TOKEN || cookieToken === SITE_TOKEN || paramToken === SITE_TOKEN) {
    return null // Valid
  }

  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}
