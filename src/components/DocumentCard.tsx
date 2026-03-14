import Link from 'next/link'
import type { SearchResult } from '@/lib/types'

interface DocumentCardProps {
  document: SearchResult
  query?: string
}

export function DocumentCard({ document }: DocumentCardProps) {
  return (
    <Link
      href={`/documento/${document.id}`}
      className="block p-4 bg-white rounded-xl border border-libra-200 hover:border-libra-400 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-libra-950">
            {document.title || 'Sin título'}
          </h3>
          <div className="flex gap-3 mt-1 text-xs text-libra-500">
            {document.date && (
              <span>{new Date(document.date).toLocaleDateString('es-AR')}</span>
            )}
            <span className="capitalize">{document.doc_type}</span>
          </div>
          {document.snippet && (
            <p
              className="mt-2 text-sm text-libra-700 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: document.snippet }}
            />
          )}
        </div>
      </div>
    </Link>
  )
}
