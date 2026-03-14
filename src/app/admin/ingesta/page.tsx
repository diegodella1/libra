'use client'

import { useEffect, useState, useCallback } from 'react'

interface IngestionEntry {
  id: string
  file_path: string
  status: string
  error_message: string | null
  created_at: string
  updated_at: string
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  ocr: 'bg-blue-100 text-blue-800',
  indexed: 'bg-green-100 text-green-800',
  embedded: 'bg-emerald-100 text-emerald-800',
  error: 'bg-red-100 text-red-800',
}

export default function AdminIngestaPage() {
  const [entries, setEntries] = useState<IngestionEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(() => {
    fetch('/api/admin/ingestion')
      .then((r) => r.json())
      .then((data) => setEntries(data.entries || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchEntries()
    const interval = setInterval(fetchEntries, 10000) // auto-refresh 10s
    return () => clearInterval(interval)
  }, [fetchEntries])

  async function handleRetry(id: string) {
    const res = await fetch('/api/admin/ingestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'retry', id }),
    })
    if (res.ok) fetchEntries()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Ingesta</h1>
        <button
          onClick={fetchEntries}
          className="text-sm text-ink-500 hover:text-ink-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 border-b border-ink-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-ink-600">Archivo</th>
              <th className="text-left px-4 py-3 font-medium text-ink-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-ink-600">Error</th>
              <th className="text-left px-4 py-3 font-medium text-ink-600">Actualizado</th>
              <th className="text-right px-4 py-3 font-medium text-ink-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-400">Cargando...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-400">Sin entradas de ingesta</td></tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-ink-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-ink-700 max-w-xs truncate">
                    {entry.file_path}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_STYLES[entry.status] || 'bg-ink-100 text-ink-600'}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-red-500 max-w-xs truncate">
                    {entry.error_message || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-400 font-mono">
                    {new Date(entry.updated_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {entry.status === 'error' && (
                      <button
                        onClick={() => handleRetry(entry.id)}
                        className="text-xs text-blue-500 hover:text-blue-700 underline"
                      >
                        Reintentar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink-400 mt-3">Auto-refresh cada 10 segundos</p>
    </div>
  )
}
