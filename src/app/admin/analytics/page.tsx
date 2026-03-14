'use client'

import { useEffect, useState } from 'react'

interface Analytics {
  period: string
  totalSearch: number
  totalChat: number
  zeroResults: number
  avgResponseTime: number
  topQueries: { query: string; count: number }[]
  zeroResultQueries: { query: string; type: string; created_at: string }[]
  perDay: Record<string, number>
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/analytics?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [period])

  if (loading) return <p className="text-ink-500 text-sm py-8">Cargando...</p>
  if (!data) return <p className="text-red-600 text-sm py-8">Error al cargar analytics</p>

  const maxPerDay = Math.max(...Object.values(data.perDay), 1)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Analytics</h1>
        <div className="flex gap-1 bg-ink-100 rounded-lg p-0.5">
          {['7d', '30d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                period === p ? 'bg-white text-ink-900 shadow-sm font-medium' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {p === '7d' ? '7 días' : '30 días'}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Búsquedas" value={data.totalSearch} />
        <MetricCard label="Chats" value={data.totalChat} />
        <MetricCard label="Sin resultados" value={data.zeroResults} />
        <MetricCard label="Resp. promedio" value={`${data.avgResponseTime}ms`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per-day chart (CSS bars) */}
        <div className="bg-white rounded-xl border border-ink-200 p-5">
          <h2 className="text-sm font-semibold text-ink-700 mb-3">Consultas por día</h2>
          {Object.keys(data.perDay).length === 0 ? (
            <p className="text-sm text-ink-400">Sin datos</p>
          ) : (
            <div className="space-y-1.5">
              {Object.entries(data.perDay)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([day, count]) => (
                  <div key={day} className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-ink-500 font-mono shrink-0">
                      {day.slice(5)}
                    </span>
                    <div className="flex-1 bg-ink-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gold-400 h-full rounded-full transition-all"
                        style={{ width: `${(count / maxPerDay) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-ink-600">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Top queries */}
        <div className="bg-white rounded-xl border border-ink-200 p-5">
          <h2 className="text-sm font-semibold text-ink-700 mb-3">Top consultas</h2>
          {data.topQueries.length === 0 ? (
            <p className="text-sm text-ink-400">Sin consultas</p>
          ) : (
            <div className="space-y-2">
              {data.topQueries.map((q, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-ink-700 truncate mr-2">{q.query}</span>
                  <span className="font-mono text-ink-500 shrink-0">{q.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zero-result queries */}
        <div className="bg-white rounded-xl border border-ink-200 p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink-700 mb-3">Consultas sin resultados</h2>
          {data.zeroResultQueries.length === 0 ? (
            <p className="text-sm text-ink-400">Ninguna</p>
          ) : (
            <div className="space-y-1.5">
              {data.zeroResultQueries.map((q, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    q.type === 'search' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {q.type}
                  </span>
                  <span className="text-ink-700 truncate">{q.query}</span>
                  <span className="text-xs text-ink-400 font-mono shrink-0 ml-auto">
                    {new Date(q.created_at).toLocaleDateString('es-AR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-ink-200 p-4">
      <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-bold text-ink-900 font-mono">{value}</p>
    </div>
  )
}
