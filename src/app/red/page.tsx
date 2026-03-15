import Link from 'next/link'
import type { Metadata } from 'next'
import { NetworkGraph } from '@/components/NetworkGraph'

export const metadata: Metadata = {
  title: 'Red de conexiones — Archivo Libra',
  description: 'Mapa visual de conexiones entre personas del caso Libra',
}

export default function RedPage() {
  return (
    <div>
      <div className="bg-ink-950 text-white py-10 mb-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gold-400 text-xs font-mono tracking-widest uppercase mb-3">Analisis forense</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold">
            Mapa de <span className="text-gold-400">conexiones</span>
          </h1>
          <p className="text-ink-400 text-sm mt-2 max-w-lg mx-auto">
            Cada nodo es una persona mencionada en la causa. Las lineas representan
            documentos compartidos — cuanto mas gruesa la linea, mas documentos en comun.
          </p>
          <p className="text-ink-500 text-xs mt-2">
            Arrastra los nodos para explorar. Toca uno para ver sus documentos.
          </p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl border border-ink-200 p-4">
          <NetworkGraph />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-400">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="6" r="3" className="animate-pulse" />
            <circle cx="18" cy="18" r="3" className="animate-pulse" style={{animationDelay: '0.5s'}} />
            <line x1="8" y1="8" x2="16" y2="16" strokeDasharray="2,2" />
          </svg>
          <span>Las conexiones se calculan en base a documentos compartidos</span>
        </div>
        <div className="mt-4 text-center pb-8">
          <Link href="/evidencia" className="text-sm text-gold-700 hover:text-gold-900 border border-gold-300 rounded-full px-4 py-2 transition-colors">
            Ver evidencia clave del caso
          </Link>
        </div>
      </div>
    </div>
  )
}
