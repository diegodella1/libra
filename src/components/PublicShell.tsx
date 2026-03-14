'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/Header'
import Link from 'next/link'

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-gold-400 focus:text-ink-950 focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium focus:text-sm"
      >
        Ir al contenido
      </a>
      <Header />
      <main id="main-content" className="min-h-screen">
        {children}
      </main>

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

      <footer className="border-t border-ink-200 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-400 font-mono uppercase tracking-wide">
            Archivo Libra — Documentos de acceso público
          </p>
          <nav className="flex gap-4 text-xs text-ink-400">
            <Link href="/explorador" className="hover:text-ink-700 transition-colors">
              Explorador
            </Link>
            <Link href="/chat" className="hover:text-ink-700 transition-colors">
              Asistente
            </Link>
            <Link href="/about" className="hover:text-ink-700 transition-colors">
              Sobre el proyecto
            </Link>
          </nav>
        </div>
      </footer>
    </>
  )
}
