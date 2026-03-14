import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b border-libra-200 bg-white">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-bold text-libra-950">
          Archivo Libra
        </Link>
        <div className="flex gap-6 text-sm">
          <Link href="/explorador" className="text-libra-600 hover:text-libra-950 transition-colors">
            Explorador
          </Link>
        </div>
      </nav>
    </header>
  )
}
