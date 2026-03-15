'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { authFetch } from '@/lib/api'
import { SearchBar } from '@/components/SearchBar'
import { DocumentRow } from '@/components/DocumentRow'
import type { SearchResult } from '@/lib/types'

const DOC_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'conversacion', label: 'Conversaciones' },
  { value: 'documento', label: 'Documentos' },
  { value: 'pdf', label: 'PDF' },
  { value: 'llamadas', label: 'Llamadas' },
  { value: 'planilla', label: 'Planillas' },
  { value: 'transcripcion', label: 'Transcripciones' },
  { value: 'audio', label: 'Audio' },
  { value: 'imagen', label: 'Imágenes' },
  { value: 'otro', label: 'Otros' },
]

const FEATURED_IDS = [
  '5aba3023-d68e-4d9d-b659-7a6917d2bb91', // Acuerdo borrador NW
  '285d343d-1cc2-4849-ad59-958bc7d82a9c', // Karina Milei RRPP
  '76c13e9b-321e-4405-8db3-3daa2963d90c', // Llamadas Novelli
  '6ffaa03d-fb43-47f7-a622-6cd65ce6a8bd', // Javier Milei conversación
  '0ba7ae5c-8ee7-4faa-95a1-7c70029d92b9', // Manu Terrones
  '9918ed9d-e94e-4868-a09e-31ad796636fa', // Mauricio Novelli
]

const PERSON_CHIPS = [
  { name: 'Milei', searchTerm: 'Milei' },
  { name: 'Karina', searchTerm: 'Karina' },
  { name: 'Novelli', searchTerm: 'Novelli' },
  { name: 'Terrones', searchTerm: 'Terrones' },
  { name: 'Davis', searchTerm: 'Davis' },
  { name: 'Morales', searchTerm: 'Morales' },
  { name: 'Peh', searchTerm: 'Peh' },
  { name: 'Hoskinson', searchTerm: 'Hoskinson' },
]

interface Stats {
  total: number
  by_type: Record<string, number>
  date_range: { min: string | null; max: string | null }
  persons: { id: string; name: string }[]
}

function ExploradorContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialDateFrom = searchParams.get('date_from') || ''
  const initialDateTo = searchParams.get('date_to') || ''
  const initialPerson = searchParams.get('person') || ''

  const [documents, setDocuments] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState(initialQuery)
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState(initialDateFrom)
  const [dateTo, setDateTo] = useState(initialDateTo)
  const [person, setPerson] = useState(initialPerson)
  const [searched, setSearched] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [featured, setFeatured] = useState<SearchResult[]>([])

  const hasFilters = query.trim() || typeFilter || dateFrom || dateTo || person

  useEffect(() => {
    authFetch('/api/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  // Load featured docs
  useEffect(() => {
    authFetch(`/api/documents?ids=${FEATURED_IDS.join(',')}`)
      .then((r) => r.json())
      .then((data) => setFeatured(data.documents || []))
      .catch(() => {})
  }, [])

  const buildFilterParams = useCallback(() => {
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (person) params.set('person', person)
    return params
  }, [typeFilter, dateFrom, dateTo, person])

  const fetchBrowse = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true)
    else setLoading(true)

    try {
      setError(null)
      const params = buildFilterParams()
      params.set('page', String(pageNum))
      params.set('limit', '20')
      const res = await authFetch(`/api/documents?${params.toString()}`)
      const data = await res.json()
      const docs = (data.documents || []) as SearchResult[]
      setDocuments((prev) => append ? [...prev, ...docs] : docs)
      setTotal(data.total || 0)
      setPage(pageNum)
    } catch (err) {
      console.error('Error cargando documentos:', err)
      setError('Error cargando documentos. Intentá de nuevo.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [buildFilterParams])

  const fetchSearch = useCallback(async (searchQuery: string) => {
    setLoading(true)
    try {
      setError(null)
      const params = buildFilterParams()
      params.set('q', searchQuery)
      const res = await authFetch(`/api/search?${params.toString()}`)
      const data = await res.json()
      setDocuments(data.results || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Error buscando:', err)
      setError('Error cargando documentos. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [buildFilterParams])

  async function handleSearch(searchQuery: string) {
    setQuery(searchQuery)
    setSearched(true)
    setPage(1)
    if (searchQuery.trim() && !typeFilter) {
      await fetchSearch(searchQuery)
    } else {
      await fetchBrowse(1, false)
    }
  }

  function handlePersonChip(searchTerm: string) {
    setQuery(searchTerm)
    setSearched(true)
    setPage(1)
    fetchSearch(searchTerm)
  }

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery)
    } else if (initialDateFrom || initialDateTo || initialPerson) {
      setSearched(true)
      fetchBrowse(1, false)
    } else {
      fetchBrowse(1, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setPage(1)
    setSearched(true)
    // Always use browse when there's a type filter (server-side filtering)
    // Only use search when there's a text query WITHOUT type filter
    if (query.trim() && !typeFilter) {
      fetchSearch(query)
    } else {
      fetchBrowse(1, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, dateFrom, dateTo, person])

  const hasMore = documents.length < total

  function typeLabel(value: string) {
    return DOC_TYPES.find((t) => t.value === value)?.label || value
  }

  function typeCount(value: string): number {
    if (!stats) return 0
    if (!value) return stats.total
    return stats.by_type[value] || 0
  }

  function formatDateRange() {
    if (!stats?.date_range.min || !stats?.date_range.max) return ''
    const min = new Date(stats.date_range.min).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })
    const max = new Date(stats.date_range.max).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })
    return ` | ${min} — ${max}`
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-3xl font-bold text-ink-950">
          Explorador de documentos
        </h1>
        <p className="text-ink-400 text-sm mt-1">
          {stats
            ? `${stats.total.toLocaleString('es-AR')} documentos en el archivo — ${stats.persons.length} personas identificadas`
            : 'Cargando archivo...'}
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <SearchBar onSearch={handleSearch} initialValue={query} />
      </div>

      <p className="text-[10px] text-ink-400 uppercase tracking-wide text-center mb-1.5 mt-6">Filtrar por tipo</p>
      <div className="flex gap-2 mb-3 flex-wrap justify-center">
        {DOC_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTypeFilter(value)}
            className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
              typeFilter === value
                ? 'border-gold-400 bg-gold-50 text-gold-800'
                : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
            }`}
          >
            {label}
            {stats && <span className="ml-1 text-ink-400">({typeCount(value)})</span>}
          </button>
        ))}
      </div>

      {/* Personas como chips */}
      <p className="text-[10px] text-ink-400 uppercase tracking-wide text-center mb-1.5">Buscar por persona</p>
      <div className="flex gap-2 mb-3 flex-wrap justify-center">
        {PERSON_CHIPS.map((p) => (
          <button
            key={p.name}
            onClick={() => handlePersonChip(p.searchTerm)}
            className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
              query === p.searchTerm
                ? 'border-gold-400 bg-gold-50 text-gold-800'
                : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <p className="text-[10px] text-ink-400 uppercase tracking-wide text-center mb-1.5">Filtrar por fecha</p>
      <div className="flex gap-3 mb-4 flex-wrap justify-center items-end">
        <div className="flex flex-col">
          <label className="text-[10px] text-ink-400 mb-0.5">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-xs border border-ink-200 rounded px-2 py-1.5 text-ink-700 bg-white"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] text-ink-400 mb-0.5">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-xs border border-ink-200 rounded px-2 py-1.5 text-ink-700 bg-white"
          />
        </div>
        {(dateFrom || dateTo || person || typeFilter || query) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setPerson(''); setTypeFilter(''); setQuery(''); setSearched(false); fetchBrowse(1, false) }}
            className="text-xs text-red-400 hover:text-red-600 underline pb-1.5"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* Documentos destacados - solo en estado inicial */}
      {!hasFilters && !searched && featured.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-lg font-bold text-ink-950 mb-3">
            Documentos clave del caso
          </h2>
          <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
            {featured.map((doc) => (
              <DocumentRow key={doc.id} document={doc} />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={() => { setError(null); fetchBrowse(1, false) }} className="text-sm text-gold-700 hover:text-gold-900 mt-2 underline">
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-3 py-3 px-4 border-b border-ink-100 animate-pulse">
              <div className="w-4 h-4 bg-ink-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-ink-200 rounded w-3/4" />
                <div className="h-3 bg-ink-100 rounded w-1/2" />
              </div>
              <div className="h-3 bg-ink-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : documents.length > 0 ? (
        <div>
          <p className="text-xs text-ink-400 mb-2 px-4">
            {query.trim()
              ? `${total.toLocaleString('es-AR')} resultado${total !== 1 ? 's' : ''} para \u00ab${query}\u00bb`
              : `${total.toLocaleString('es-AR')} documento${total !== 1 ? 's' : ''}${typeFilter ? ` (filtro: ${typeLabel(typeFilter)})` : ''}`
            }
          </p>
          <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
            {documents.map((doc) => (
              <DocumentRow key={doc.id} document={doc} query={query} />
            ))}
          </div>
          {hasMore && (
            <div className="text-center mt-4">
              <button
                onClick={() => fetchBrowse(page + 1, true)}
                disabled={loadingMore}
                className="text-sm text-gold-700 hover:text-gold-900 border border-gold-300 rounded-full px-4 py-2 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Cargando...' : 'Ver más documentos'}
              </button>
            </div>
          )}
        </div>
      ) : searched || typeFilter || dateFrom || dateTo || person ? (
        <div className="text-center py-12">
          <p className="text-ink-400">
            {query
              ? `No se encontraron documentos con \u00ab${query}\u00bb`
              : `No hay documentos con estos filtros${typeFilter ? ` (${typeLabel(typeFilter)})` : ''}`
            }
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-ink-400">No hay documentos en el archivo.</p>
        </div>
      )}
    </div>
  )
}

export default function Explorador() {
  return (
    <Suspense fallback={<div className="text-center py-12"><p className="text-ink-400 font-mono text-sm">Cargando...</p></div>}>
      <ExploradorContent />
    </Suspense>
  )
}
