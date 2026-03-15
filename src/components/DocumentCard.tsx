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
      className="block p-4 bg-white rounded-xl border border-ink-200 hover:border-gold-400 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-ink-950 truncate">
            {document.title || 'Sin título'}
          </h3>
          <div className="flex gap-3 mt-1 text-xs text-ink-400 font-mono">
            {document.date && (
              <span>{new Date(document.date).toLocaleDateString('es-AR')}</span>
            )}
            <span className="uppercase">{document.doc_type}</span>
          </div>
          {document.snippet && (
            <p
              className="mt-2 text-sm text-ink-600 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: document.snippet }}
            />
          )}
        </div>
        <span className="text-ink-300 text-sm shrink-0">&rarr;</span>
      </div>
    </Link>
  )
}
