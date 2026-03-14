import { NextRequest, NextResponse } from 'next/server'
import {
  createSessionValue,
  addSession,
  removeSession,
  getSessionCookieOptions,
  getDeleteCookieOptions,
  COOKIE_NAME,
} from '@/lib/admin-auth'

const ADMIN_TOKEN = process.env.ADMIN_TOKEN

export async function POST(request: NextRequest) {
  if (!ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Admin no configurado' }, { status: 503 })
  }

  const { token } = await request.json()

  if (!token || token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Token incorrecto' }, { status: 401 })
  }

  const sessionValue = createSessionValue()
  addSession(sessionValue)

  const response = NextResponse.json({ ok: true })
  const cookieOpts = getSessionCookieOptions(sessionValue)
  response.cookies.set(cookieOpts)

  return response
}

export async function DELETE(request: NextRequest) {
  const session = request.cookies.get(COOKIE_NAME)
  if (session?.value) {
    removeSession(session.value)
  }

  const response = NextResponse.json({ ok: true })
  const deleteOpts = getDeleteCookieOptions()
  response.cookies.set(deleteOpts)

  return response
}
