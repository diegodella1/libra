'use client'

import { useState, useEffect } from 'react'
import { authFetch } from '@/lib/api'
import { DocumentRow } from '@/components/DocumentRow'
import type { SearchResult } from '@/lib/types'

interface RelatedDocumentsProps {
  documentId: string
}

export function RelatedDocuments({ documentId }: RelatedDocumentsProps) {
  const [docs, setDocs] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authFetch(`/api/documents/${documentId}/related`)
      .then((r) => r.json())
      .then((data) => setDocs(data.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [documentId])

  if (loading) return (
    <div className="mt-10">
      <h2 className="font-serif text-lg font-bold text-ink-950 mb-3">Documentos relacionados</h2>
      <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
        {[1,2,3].map(i => (
          <div key={i} className="flex items-center gap-3 py-3 px-4 border-b border-ink-100 animate-pulse">
            <div className="w-4 h-4 bg-ink-200 rounded" />
            <div className="flex-1"><div className="h-4 bg-ink-200 rounded w-2/3" /></div>
          </div>
        ))}
      </div>
    </div>
  )
  if (docs.length === 0) return null

  return (
    <div className="mt-10">
      <h2 className="font-serif text-lg font-bold text-ink-950 mb-3">
        Documentos relacionados
      </h2>
      <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
        {docs.map((doc) => (
          <DocumentRow key={doc.id} document={doc} />
        ))}
      </div>
    </div>
  )
}
