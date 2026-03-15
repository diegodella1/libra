import Link from 'next/link'
import type { Metadata } from 'next'
import { NetworkGraph } from '@/components/NetworkGraph'

export const metadata: Metadata = {
  title: 'Red de conexiones — Archivo Libra',
  description: 'Mapa visual de conexiones entre personas del caso Libra',
}

export default function RedPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-3xl font-bold text-ink-950">
          Mapa de conexiones
        </h1>
        <p className="text-ink-500 text-sm mt-1 max-w-lg mx-auto">
          Cada nodo es una persona mencionada en la causa. Las líneas representan
          documentos compartidos — cuanto más gruesa la línea, más documentos en común.
        </p>
        <p className="text-ink-400 text-xs mt-2">
          Arrastrá los nodos para explorar. Tocá uno para ver sus documentos.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-ink-200 p-4">
        <NetworkGraph />
      </div>
      <div className="mt-6 text-center">
        <Link href="/evidencia" className="text-sm text-ink-400 hover:text-ink-700 transition-colors">
          Ver evidencia clave del caso →
        </Link>
      </div>
    </div>
  )
}
