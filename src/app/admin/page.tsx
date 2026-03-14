'use client'

import { useEffect, useState } from 'react'

interface PersonStat {
  id: string
  name: string
  role: string | null
  docCount: number
}

interface Stats {
  documents: number
  chunks: number
  totalSizeBytes: number
  typeBreakdown: Record<string, number>
  ingestionByStatus: Record<string, number>
  persons: PersonStat[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  ocr: 'bg-blue-100 text-blue-800',
  indexed: 'bg-green-100 text-green-800',
  embedded: 'bg-emerald-100 text-emerald-800',
  error: 'bg-red-100 text-red-800',
}

const ROLE_COLORS: Record<string, string> = {
  investigado: 'bg-red-100 text-red-700',
  mencionado: 'bg-amber-100 text-amber-700',
  testigo: 'bg-blue-100 text-blue-700',
}

const TYPE_LABELS: Record<string, string> = {
  conversacion: 'Conversaciones',
  documento: 'Documentos',
  texto: 'Textos',
  presentacion: 'Presentaciones',
  forense: 'Forense',
  planilla: 'Planillas',
  rrss: 'Redes sociales',
  pdf: 'PDFs',
  llamadas: 'Llamadas',
  transcripcion: 'Transcripciones',
  otro: 'Otros',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = () => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 15000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <p className="text-ink-500 text-sm py-8">Cargando...</p>
  }

  if (!stats) {
    return <p className="text-red-600 text-sm py-8">Error al cargar estadísticas</p>
  }

  const totalIngestion = Object.values(stats.ingestionByStatus).reduce((a, b) => a + b, 0)
  const indexedCount = (stats.ingestionByStatus['indexed'] || 0) + (stats.ingestionByStatus['embedded'] || 0)
  const isIngesting = totalIngestion > 0 && indexedCount < totalIngestion

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>
        {isIngesting && (
          <span className="text-xs px-3 py-1 rounded-full bg-gold-100 text-gold-800 font-medium animate-pulse">
            Ingesta en curso: {indexedCount}/{totalIngestion}
          </span>
        )}
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Documentos" value={stats.documents} />
        <StatCard label="Chunks" value={stats.chunks} />
        <StatCard label="Personas" value={stats.persons.length} />
        <StatCard label="Almacenamiento" value={formatBytes(stats.totalSizeBytes)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Type breakdown */}
        <div className="bg-white rounded-xl border border-ink-200 p-5">
          <h2 className="text-sm font-semibold text-ink-700 mb-3">Por tipo</h2>
          {Object.keys(stats.typeBreakdown).length === 0 ? (
            <p className="text-sm text-ink-400">Sin documentos</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.typeBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-ink-600">{TYPE_LABELS[type] || type}</span>
                    <span className="font-mono text-ink-900">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Ingestion status */}
        <div className="bg-white rounded-xl border border-ink-200 p-5">
          <h2 className="text-sm font-semibold text-ink-700 mb-3">Ingesta</h2>
          {Object.keys(stats.ingestionByStatus).length === 0 ? (
            <p className="text-sm text-ink-400">Sin registros</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.ingestionByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status] || 'bg-ink-100 text-ink-600'}`}>
                    {status}
                  </span>
                  <span className="font-mono text-ink-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Persons */}
        <div className="bg-white rounded-xl border border-ink-200 p-5">
          <h2 className="text-sm font-semibold text-ink-700 mb-3">Personas vinculadas</h2>
          {stats.persons.length === 0 ? (
            <p className="text-sm text-ink-400">Sin personas</p>
          ) : (
            <div className="space-y-2">
              {stats.persons.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-ink-800 truncate">{p.name}</span>
                    {p.role && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${ROLE_COLORS[p.role] || 'bg-ink-100 text-ink-600'}`}>
                        {p.role}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-ink-900 shrink-0 ml-2">{p.docCount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-ink-200 p-5">
      <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-ink-900 font-mono">{value}</p>
    </div>
  )
}
