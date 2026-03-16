'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { authFetch } from '@/lib/api'
import { WalletTransactions } from '@/components/WalletTransactions'
import type { Entity, DocumentEntity } from '@/lib/types'

const ENTITY_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  phone: { label: 'Telefonos', icon: '📞', color: 'text-blue-600' },
  email: { label: 'Emails', icon: '✉️', color: 'text-green-600' },
  crypto_wallet: { label: 'Wallets', icon: '₿', color: 'text-amber-600' },
  url: { label: 'URLs', icon: '🔗', color: 'text-purple-600' },
  organization: { label: 'Organizaciones', icon: '🏢', color: 'text-red-600' },
}

function EntityIcon({ type }: { type: string }) {
  const config = ENTITY_TYPE_CONFIG[type]
  return <span className="text-lg" title={config?.label}>{config?.icon || '?'}</span>
}

function EntityRow({ entity, isSelected, onClick }: { entity: Entity; isSelected: boolean; onClick: () => void }) {
  const config = ENTITY_TYPE_CONFIG[entity.entity_type]
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-ink-100 transition-colors ${
        isSelected ? 'bg-gold-50 border-l-2 border-l-gold-400' : 'hover:bg-ink-50'
      }`}
    >
      <EntityIcon type={entity.entity_type} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${config?.color || 'text-ink-800'}`}>
          {entity.display_name || entity.value}
        </p>
        {entity.display_name && entity.display_name !== entity.value && (
          <p className="text-[11px] text-ink-400 font-mono truncate">{entity.value}</p>
        )}
      </div>
      <span className="text-xs font-mono text-ink-400 bg-ink-100 px-2 py-0.5 rounded-full shrink-0">
        {entity.doc_count}
      </span>
    </button>
  )
}

function EntityDetail({ entityId }: { entityId: string }) {
  const [data, setData] = useState<{ entity: Entity; documents: DocumentEntity[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    authFetch(`/api/entities/${entityId}/documents`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [entityId])

  if (loading) return <p className="text-ink-400 text-sm p-6">Cargando...</p>
  if (!data) return <p className="text-red-500 text-sm p-6">Error cargando entidad.</p>

  const { entity, documents } = data
  const config = ENTITY_TYPE_CONFIG[entity.entity_type]

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <EntityIcon type={entity.entity_type} />
          <span className="text-xs uppercase tracking-widest text-ink-400 font-mono">{config?.label || entity.entity_type}</span>
        </div>
        <h2 className={`text-lg font-semibold ${config?.color || 'text-ink-800'}`}>
          {entity.display_name || entity.value}
        </h2>
        {entity.display_name && (
          <p className="text-sm font-mono text-ink-500 mt-0.5">{entity.value}</p>
        )}
        <p className="text-xs text-ink-400 mt-2">
          Aparece en {documents.length} documento{documents.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-2">
        {documents.map((doc) => (
          <Link
            key={doc.id}
            href={`/documento/${doc.id}`}
            className="block p-3 rounded-lg border border-ink-100 hover:border-gold-300 hover:bg-gold-50/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-ink-100 text-ink-500">
                {doc.doc_type}
              </span>
              {doc.date && (
                <span className="text-[10px] font-mono text-ink-400">{doc.date}</span>
              )}
            </div>
            <p className="text-sm text-ink-800 font-medium line-clamp-1">
              {doc.title || 'Sin titulo'}
            </p>
            {doc.context && (
              <p className="text-xs text-ink-500 mt-1 line-clamp-2 italic">
                &ldquo;...{doc.context}...&rdquo;
              </p>
            )}
          </Link>
        ))}
      </div>

      {/* Wallet transaction explorer */}
      {entity.entity_type === 'crypto_wallet' && (
        <WalletTransactions entityId={entity.id} address={entity.value} />
      )}
    </div>
  )
}

export default function EntidadesPage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchEntities = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    if (search) params.set('q', search)
    params.set('page', String(page))
    params.set('limit', '30')

    authFetch(`/api/entities?${params}`)
      .then(r => r.json())
      .then(data => {
        setEntities(data.entities || [])
        setTotal(data.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [typeFilter, search, page])

  useEffect(() => { fetchEntities() }, [fetchEntities])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [typeFilter, search])

  const totalPages = Math.ceil(total / 30)

  return (
    <div>
      <div className="bg-ink-950 text-white py-10 mb-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-gold-400 text-xs font-mono tracking-widest uppercase mb-3">Investigacion</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold">
            <span className="text-gold-400">Entidades</span> extraidas
          </h1>
          <p className="text-ink-400 text-sm mt-2">
            Telefonos, emails, wallets y URLs encontrados en el archivo
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setTypeFilter(null)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                !typeFilter ? 'bg-ink-950 text-white border-ink-950' : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400'
              }`}
            >
              Todos
            </button>
            {Object.entries(ENTITY_TYPE_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  typeFilter === key ? 'bg-ink-950 text-white border-ink-950' : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400'
                }`}
              >
                {cfg.icon} {cfg.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border border-ink-200 bg-white text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-gold-400 w-48"
          />
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* Entity list */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-ink-200 overflow-hidden">
            <div className="px-4 py-2 bg-ink-50 border-b border-ink-200 flex items-center justify-between">
              <span className="text-xs font-mono text-ink-500 uppercase tracking-wide">
                {total.toLocaleString('es-AR')} entidades
              </span>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {loading ? (
                <p className="text-ink-400 text-sm p-4">Cargando...</p>
              ) : entities.length === 0 ? (
                <p className="text-ink-400 text-sm p-4">No se encontraron entidades.</p>
              ) : (
                entities.map(e => (
                  <EntityRow
                    key={e.id}
                    entity={e}
                    isSelected={selectedId === e.id}
                    onClick={() => setSelectedId(e.id)}
                  />
                ))
              )}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-2 border-t border-ink-100 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="text-xs text-ink-500 hover:text-ink-800 disabled:opacity-30"
                >
                  &larr; Anterior
                </button>
                <span className="text-xs font-mono text-ink-400">{page}/{totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="text-xs text-ink-500 hover:text-ink-800 disabled:opacity-30"
                >
                  Siguiente &rarr;
                </button>
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-ink-200 overflow-hidden min-h-[300px]">
            {selectedId ? (
              <EntityDetail entityId={selectedId} />
            ) : (
              <div className="flex items-center justify-center h-full text-ink-400 text-sm p-8">
                Selecciona una entidad para ver sus documentos
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
