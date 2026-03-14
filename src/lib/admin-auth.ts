import { cookies } from 'next/headers'
import { createHash, randomBytes } from 'crypto'

const COOKIE_NAME = 'admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 // 24 hours

export function createSessionValue(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// Server-side session store (in-memory, resets on deploy — fine for single admin)
const sessions = new Set<string>()

export function addSession(sessionValue: string) {
  sessions.add(sessionValue)
}

export function removeSession(sessionValue: string) {
  sessions.delete(sessionValue)
}

export function isValidSession(sessionValue: string): boolean {
  return sessions.has(sessionValue)
}

export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get(COOKIE_NAME)
  if (!session?.value) return false
  return isValidSession(session.value)
}

export function getSessionCookieOptions(value: string) {
  return {
    name: COOKIE_NAME,
    value,
    httpOnly: true,
    secure: false, // LAN only
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  }
}

export function getDeleteCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  }
}

export { COOKIE_NAME }
