'use client'

import { useState } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { DocumentCard } from '@/components/DocumentCard'
import type { Document } from '@/lib/types'

export default function Explorador() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')

  async function handleSearch(searchQuery: string) {
    setQuery(searchQuery)
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setDocuments(data.results || [])
    } catch (err) {
      console.error('Error buscando:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl font-bold text-libra-950 mb-8">
        Explorador de documentos
      </h1>

      <SearchBar onSearch={handleSearch} />

      {/* Filtros */}
      <div className="flex gap-4 mt-6 mb-8">
        <select className="border border-libra-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">Todos los tipos</option>
          <option value="transcripcion">Transcripciones</option>
          <option value="imagen">Imágenes</option>
          <option value="otro">Otros</option>
        </select>
        <input
          type="date"
          className="border border-libra-300 rounded-lg px-3 py-2 text-sm bg-white"
          placeholder="Desde"
        />
        <input
          type="date"
          className="border border-libra-300 rounded-lg px-3 py-2 text-sm bg-white"
          placeholder="Hasta"
        />
      </div>

      {/* Resultados */}
      {loading ? (
        <p className="text-libra-500">Buscando...</p>
      ) : documents.length > 0 ? (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} query={query} />
          ))}
        </div>
      ) : query ? (
        <p className="text-libra-500">No se encontraron resultados para "{query}"</p>
      ) : (
        <p className="text-libra-500">Usá el buscador para encontrar documentos.</p>
      )}
    </div>
  )
}
