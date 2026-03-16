'use client'

import { useState, useCallback } from 'react'
import { authFetch } from '@/lib/api'

interface Transaction {
  hash: string
  timestamp: number | null
  date: string | null
  success: boolean
  chain: string
  explorerUrl: string
}

interface TxResult {
  transactions: Transaction[]
  total: number
  chain: string
  address: string
  explorerUrl: string
  error?: string
}

function formatDate(ts: number | null): string {
  if (!ts) return '—'
  const d = new Date(ts * 1000)
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function shortenHash(hash: string): string {
  if (hash.length <= 16) return hash
  return hash.slice(0, 8) + '...' + hash.slice(-8)
}

export function WalletTransactions({ entityId, address }: { entityId: string; address: string }) {
  // Quick client-side chain detection to show/hide UI
  const isBtc = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || /^bc1[a-z0-9]{25,90}$/.test(address)
  const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) && /[A-Z]/.test(address) && !isBtc
  const isSupported = isBtc || isSolana
  const chainLabel = isBtc ? 'Bitcoin' : isSolana ? 'Solana' : null
  const [fromDate, setFromDate] = useState('2025-02-01')
  const [toDate, setToDate] = useState('2025-03-01')
  const [result, setResult] = useState<TxResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    params.set('limit', '100')

    authFetch(`/api/entities/${entityId}/transactions?${params}`)
      .then(async r => {
        const text = await r.text()
        let data: TxResult
        try {
          data = JSON.parse(text)
        } catch {
          throw new Error('Respuesta inesperada del servidor')
        }
        if (!r.ok) throw new Error(data.error || 'Error consultando blockchain')
        setResult(data)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Error desconocido'))
      .finally(() => setLoading(false))
  }, [entityId, fromDate, toDate])

  if (!isSupported) {
    return (
      <div className="mt-6 border-t border-ink-100 pt-4">
        <p className="text-xs text-ink-400 italic">
          Esta direccion no corresponde a una wallet valida de Solana o Bitcoin.
          Puede ser un hash parcial extraido del expediente.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 border-t border-ink-100 pt-4">
      <h3 className="text-sm font-semibold text-ink-800 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Transacciones en blockchain
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ink-100 text-ink-500">{chainLabel}</span>
      </h3>

      {/* Date range + fetch */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="text-[10px] text-ink-400 uppercase tracking-widest block mb-1">Desde</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="text-xs px-2 py-1.5 rounded border border-ink-200 bg-white text-ink-800 focus:outline-none focus:border-gold-400"
          />
        </div>
        <div>
          <label className="text-[10px] text-ink-400 uppercase tracking-widest block mb-1">Hasta</label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="text-xs px-2 py-1.5 rounded border border-ink-200 bg-white text-ink-800 focus:outline-none focus:border-gold-400"
          />
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="text-xs px-4 py-1.5 rounded-lg bg-ink-950 text-white hover:bg-ink-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Consultando...' : 'Buscar'}
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 mb-3">
          {error}
        </div>
      )}

      {result && !error && (
        <div>
          {/* Summary */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                {result.chain}
              </span>
              <span className="text-xs text-ink-500">
                {result.total} transacci{result.total === 1 ? 'on' : 'ones'}
                {result.total > result.transactions.length && ` (mostrando ${result.transactions.length})`}
              </span>
            </div>
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-gold-700 hover:text-gold-900 flex items-center gap-1"
            >
              Ver en explorer
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {result.transactions.length === 0 ? (
            <p className="text-xs text-ink-400 italic">No se encontraron transacciones en este rango de fechas.</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto border border-ink-100 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-ink-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-mono text-ink-500 font-medium">TX Hash</th>
                    <th className="text-left px-3 py-2 font-mono text-ink-500 font-medium">Fecha</th>
                    <th className="text-center px-3 py-2 font-mono text-ink-500 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {result.transactions.map((tx) => (
                    <tr key={tx.hash} className="hover:bg-gold-50/30 transition-colors">
                      <td className="px-3 py-2">
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-gold-700 hover:text-gold-900 hover:underline"
                          title={tx.hash}
                        >
                          {shortenHash(tx.hash)}
                        </a>
                      </td>
                      <td className="px-3 py-2 font-mono text-ink-600 whitespace-nowrap">
                        {formatDate(tx.timestamp)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {tx.success ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500" title="Exitosa" />
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-red-500" title="Fallida" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <p className="text-xs text-ink-400 italic">
          Selecciona un rango de fechas y hace click en Buscar para consultar la blockchain.
        </p>
      )}
    </div>
  )
}
