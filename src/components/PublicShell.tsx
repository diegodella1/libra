'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/Header'
import { ScrollProgress } from '@/components/ScrollProgress'
import { BackToTop } from '@/components/BackToTop'
import Link from 'next/link'

const STORAGE_KEY = 'libra_access_token'

function LoginGate({ onAuth }: { onAuth: () => void }) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      })
      const data = await res.json()

      if (data.ok) {
        localStorage.setItem(STORAGE_KEY, token.trim())
        onAuth()
      } else {
        setError('Token inválido')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-gold-400 text-xs font-mono tracking-widest uppercase mb-4">Acceso restringido</p>
          <h1 className="font-serif text-4xl font-bold text-white mb-2">
            Archivo <span className="text-gold-400">Libra</span>
          </h1>
          <p className="text-sm text-ink-400">Ingresá el token de acceso para continuar.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-ink-200 p-6 shadow-lg">
          <label htmlFor="token" className="block text-xs text-ink-500 mb-1.5 font-mono uppercase tracking-wide">
            Token de acceso
          </label>
          <input
            id="token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Ingresá el token"
            autoFocus
            className="w-full border border-ink-200 rounded-lg px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
          />
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="w-full mt-4 bg-ink-950 text-white py-3 rounded-lg font-medium text-sm hover:bg-ink-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')
  const isPublic = pathname === '/pitch'
  const [authed, setAuthed] = useState<boolean | null>(null) // null = checking

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      setAuthed(false)
      return
    }

    // Verify saved token is still valid
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: saved }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setAuthed(true)
        } else {
          localStorage.removeItem(STORAGE_KEY)
          setAuthed(false)
        }
      })
      .catch(() => setAuthed(false))
  }, [])

  if (isAdmin) {
    return <>{children}</>
  }

  // Splash screen while checking auth (skip for public pages)
  if (authed === null && !isPublic) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ink-950">
        <h1 className="font-serif text-3xl font-bold text-white mb-2">
          Archivo <span className="text-gold-400">Libra</span>
        </h1>
        <div className="flex gap-1 mt-4">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" style={{ animationDelay: '200ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    )
  }

  // Not authenticated (skip for public pages)
  if (!authed && !isPublic) {
    return <LoginGate onAuth={() => setAuthed(true)} />
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-gold-400 focus:text-ink-950 focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium focus:text-sm"
      >
        Ir al contenido
      </a>
      <ScrollProgress />
      <Header />
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      <BackToTop />

      {/* FAB — link to /chat */}
      <Link
        href="/chat"
        className="fixed bottom-6 right-6 bg-ink-950 text-gold-300 w-14 h-14 rounded-full shadow-lg hover:bg-ink-800 transition-colors motion-safe:hover:scale-105 flex items-center justify-center z-40"
        aria-label="Abrir asistente"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </Link>

      <footer className="bg-ink-950 text-ink-400 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-serif text-white text-sm font-bold mb-3">Archivo Libra</h4>
              <p className="text-xs leading-relaxed">
                Archivo periodístico de documentos judiciales públicos del caso por el token $LIBRA.
                Toda la información proviene del expediente del Juzgado Federal N°8.
              </p>
              <p className="text-[10px] text-ink-500 mt-3 font-mono leading-relaxed">
                Fuente: Expediente XXXX/2025, Juzgado Federal N°8, Juez Martinez de Giorgi
              </p>
            </div>
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wide text-ink-500 mb-3">Navegar</h4>
              <nav className="flex flex-col gap-2 text-xs">
                <Link href="/historia" className="hover:text-white transition-colors">La historia</Link>
                <Link href="/evidencia" className="hover:text-white transition-colors">Evidencia clave</Link>
                <Link href="/explorador" className="hover:text-white transition-colors">Explorar archivo</Link>
                <Link href="/entidades" className="hover:text-white transition-colors">Entidades extraídas</Link>
                <Link href="/datos" className="hover:text-white transition-colors">Datos y estadísticas</Link>
                <Link href="/red" className="hover:text-white transition-colors">Red de conexiones</Link>
              </nav>
            </div>
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wide text-ink-500 mb-3">Sobre el proyecto</h4>
              <nav className="flex flex-col gap-2 text-xs">
                <Link href="/about" className="hover:text-white transition-colors">Metodología</Link>
                <Link href="/chat" className="hover:text-white transition-colors">Asistente de investigación</Link>
              </nav>
            </div>
          </div>
          <div className="border-t border-ink-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-ink-600">
              Archivo Libra — Documentos de acceso público
            </p>
            <p className="text-[10px] text-ink-600 bg-ink-900/50 px-3 py-1.5 rounded border border-ink-800">
              Sin edición ni interpretación. Reproducción textual del expediente judicial.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
