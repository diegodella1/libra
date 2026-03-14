import Link from 'next/link'
import type { SearchResult } from '@/lib/types'

const TYPE_ICONS: Record<string, JSX.Element> = {
  transcripcion: (
    <svg className="w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  imagen: (
    <svg className="w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  otro: (
    <svg className="w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
}

const TYPE_LABELS: Record<string, string> = {
  transcripcion: 'Transcripción',
  imagen: 'Imagen',
  otro: 'Otro',
}

interface DocumentRowProps {
  document: SearchResult
  query?: string
}

export function DocumentRow({ document, query }: DocumentRowProps) {
  const icon = TYPE_ICONS[document.doc_type] || TYPE_ICONS.otro

  function highlightSnippet(text: string) {
    if (!query || !text) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  return (
    <Link
      href={`/documento/${document.id}`}
      className="flex items-center gap-3 py-3 px-4 border-b border-ink-100 hover:bg-ink-50 transition-colors cursor-pointer group"
    >
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink-900 truncate group-hover:text-ink-950">
            {document.title || 'Sin título'}
          </span>
        </div>
        {document.snippet && (
          <p
            className="text-xs text-ink-500 line-clamp-1 mt-0.5"
            dangerouslySetInnerHTML={{ __html: highlightSnippet(document.snippet) }}
          />
        )}
      </div>
      {document.participants && document.participants.length > 0 && (
        <span className="hidden sm:block text-xs text-ink-400 shrink-0 max-w-[150px] truncate">
          {document.participants.join(', ')}
        </span>
      )}
      {document.date && (
        <span className="text-xs text-ink-400 font-mono shrink-0">
          {document.date}
        </span>
      )}
      <span className="text-[10px] text-ink-400 border border-ink-200 rounded px-1.5 py-0.5 uppercase font-mono shrink-0">
        {TYPE_LABELS[document.doc_type] || document.doc_type}
      </span>
    </Link>
  )
}
