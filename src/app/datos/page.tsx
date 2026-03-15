'use client'

import { useState, useEffect } from 'react'
import { authFetch } from '@/lib/api'
import { StatCard } from '@/components/charts/StatCard'
import { HBarChart } from '@/components/charts/HBarChart'
import { DateChart } from '@/components/charts/DateChart'
import { ScrollReveal } from '@/components/ScrollReveal'

// Type colors matching DocumentRow TYPE_CONFIG
const TYPE_COLORS: Record<string, string> = {
  conversacion: '#3b82f6',
  audio: '#a855f7',
  imagen: '#ec4899',
  pdf: '#ef4444',
  llamadas: '#16a34a',
  documento: '#6b7280',
  rrss: '#06b6d4',
  transcripcion: '#d97706',
  planilla: '#10b981',
  forense: '#f97316',
  presentacion: '#6366f1',
  texto: '#9ca3af',
}

const TYPE_LABELS: Record<string, string> = {
  conversacion: 'Chats',
  audio: 'Audios',
  imagen: 'Imagenes',
  pdf: 'PDFs',
  llamadas: 'Llamadas',
  documento: 'Documentos',
  rrss: 'Redes sociales',
  transcripcion: 'Transcripciones',
  planilla: 'Planillas',
  forense: 'Forense',
  presentacion: 'Presentaciones',
  texto: 'Textos',
}

interface Stats {
  total: number
  by_type: Record<string, number>
  by_date: { date: string; count: number }[]
  persons_top: { name: string; doc_count: number; role: string }[]
}

export default function DatosPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authFetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <div className="bg-ink-950 text-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">Datos del <span className="text-gold-400">caso</span></h1>
          </div>
        </div>
        <p className="text-ink-400 font-mono text-sm mt-8 text-center">Cargando datos...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div>
        <div className="bg-ink-950 text-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">Datos del <span className="text-gold-400">caso</span></h1>
          </div>
        </div>
        <p className="text-red-500 text-sm mt-4 text-center">Error cargando datos.</p>
      </div>
    )
  }

  const typeData = Object.entries(stats.by_type)
    .map(function(entry) {
      return { label: TYPE_LABELS[entry[0]] || entry[0], value: entry[1], color: TYPE_COLORS[entry[0]] || '#d7d7e0' }
    })
    .sort(function(a, b) { return b.value - a.value })

  const personData = (stats.persons_top || [])
    .slice(0, 15)
    .map(function(p) {
      return { label: p.name, value: p.doc_count, color: p.role === 'investigado' ? '#d4a017' : '#b3b4c5' }
    })

  return (
    <div>
      <div className="bg-ink-950 text-white py-10 mb-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-gold-400 text-xs font-mono tracking-widest uppercase mb-3">Radiografia</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold">Datos del <span className="text-gold-400">caso</span></h1>
          <p className="text-ink-400 text-sm mt-2">
            {stats.total.toLocaleString('es-AR')} documentos analizados
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <ScrollReveal delay={0}><StatCard value={stats.total.toLocaleString('es-AR')} label="Documentos" context="en el archivo" /></ScrollReveal>
        <ScrollReveal delay={100}><StatCard value="75.000" label="Afectados" context="perdieron dinero" /></ScrollReveal>
        <ScrollReveal delay={200}><StatCard value="US$251M" label="Perdidas" context="estimadas" /></ScrollReveal>
        <ScrollReveal delay={300}><StatCard value="206" label="Llamadas" context="noche del 14/02" /></ScrollReveal>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DateChart data={stats.by_date || []} title="Documentos por fecha" />
        <HBarChart data={typeData} title="Documentos por tipo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HBarChart data={personData} title="Personas mas mencionadas" />
        <div className="bg-white rounded-xl border border-ink-200 p-5 flex flex-col items-center justify-center text-center">
          <p className="text-ink-400 text-sm mb-3">Explora las conexiones entre personas</p>
          <a href="/red" className="text-sm text-gold-700 hover:text-gold-900 border border-gold-300 rounded-full px-4 py-2 transition-colors">
            Ver mapa de conexiones
          </a>
        </div>
      </div>
      </div>
    </div>
  )
}
