'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DocRow {
  id: string
  title: string | null
  doc_type: string
  date: string | null
  file_size: number | null
  ocr_status: string
  created_at: string
}

export default function AdminDocumentosPage() {
  const [docs, setDocs] = useState<DocRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('q', search)
    if (typeFilter) params.set('type', typeFilter)

    fetch(`/api/admin/documents?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setDocs(data.documents || [])
        setTotal(data.total || 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, search, typeFilter])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este documento?')) return
    const res = await fetch(`/api/admin/documents/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDocs((prev) => prev.filter((d) => d.id !== id))
      setTotal((prev) => prev - 1)
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Documentos</h1>
        <Link
          href="/admin/documentos/subir"
          className="bg-ink-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ink-800 transition-colors"
        >
          Subir documento
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por título..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 px-3 py-2 border border-ink-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gold-400"
        />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-ink-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gold-400 bg-white"
        >
          <option value="">Todos los tipos</option>
          <option value="conversacion">Conversaciones</option>
          <option value="documento">Documentos</option>
          <option value="texto">Textos</option>
          <option value="pdf">PDFs</option>
          <option value="presentacion">Presentaciones</option>
          <option value="planilla">Planillas</option>
          <option value="forense">Forense</option>
          <option value="rrss">Redes sociales</option>
          <option value="llamadas">Llamadas</option>
          <option value="transcripcion">Transcripciones</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 border-b border-ink-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-ink-600">Título</th>
              <th className="text-left px-4 py-3 font-medium text-ink-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-ink-600">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-ink-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-ink-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-400">Cargando...</td></tr>
            ) : docs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-400">Sin documentos</td></tr>
            ) : (
              docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-ink-50 transition-colors">
                  <td className="px-4 py-3 text-ink-900 font-medium max-w-xs truncate">
                    {doc.title || 'Sin título'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-ink-100 text-ink-600 capitalize">
                      {doc.doc_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500 font-mono text-xs">{doc.date || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      doc.ocr_status === 'indexed' || doc.ocr_status === 'embedded'
                        ? 'bg-green-100 text-green-700'
                        : doc.ocr_status === 'error'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {doc.ocr_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link
                      href={`/admin/documentos/${doc.id}`}
                      className="text-ink-500 hover:text-ink-900 text-xs underline"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-400 hover:text-red-600 text-xs underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-ink-500">{total} documentos</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border border-ink-300 disabled:opacity-30 hover:bg-ink-100 transition-colors"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-ink-600">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border border-ink-300 disabled:opacity-30 hover:bg-ink-100 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
