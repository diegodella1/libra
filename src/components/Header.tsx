'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/historia', label: 'La historia' },
  { href: '/evidencia', label: 'Evidencia' },
  { href: '/explorador', label: 'Explorador' },
  { href: '/red', label: 'Red' },
  { href: '/datos', label: 'Datos' },
  { href: '/chat', label: 'Asistente' },
  { href: '/about', label: 'Sobre el proyecto' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  function linkClasses(href: string) {
    const active = pathname === href
    return active
      ? 'text-ink-950 font-medium'
      : 'text-ink-500 hover:text-ink-950 transition-colors'
  }

  return (
    <header className="border-b border-ink-200 bg-white">
      <nav className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-xl font-bold text-ink-950">Archivo Libra</span>
          <span className="text-[10px] font-mono text-gold-600 bg-gold-50 px-1.5 py-0.5 rounded border border-gold-200 uppercase tracking-widest">
            público
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-6 text-sm">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={`${linkClasses(href)} cursor-pointer`}>
              {label}
            </Link>
          ))}
        </div>

        {/* Hamburger button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-ink-600 hover:text-ink-950 transition-colors"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-ink-200 bg-white px-4 py-4 space-y-3">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`block text-sm ${linkClasses(href)}`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
