import Link from 'next/link'
import type { Metadata } from 'next'
import { DocumentViewer } from '@/components/DocumentViewer'
import { RelatedDocuments } from '@/components/RelatedDocuments'
import { createClient } from '@/lib/supabase'

// Map file paths to forensic source descriptions
function getSourceContext(filePath: string, docType: string): string | null {
  const path = filePath.toLowerCase()
  let device = ''
  if (path.includes('punto v/') || path.includes('punto v\\')) device = 'Celular de Mauricio Novelli (Samsung)'
  else if (path.includes('punto vi/') || path.includes('punto vi\\')) device = 'Celular de Mauricio Novelli (iPhone)'
  else if (path.includes('punto iii/') || path.includes('punto iii\\')) device = 'Celular de Manuel Terrones'
  else if (path.includes('punto ii/') || path.includes('punto ii\\')) device = 'Archivos digitales secuestrados'
  else if (path.includes('punto i/') || path.includes('punto i\\')) device = 'Redes sociales'
  else if (path.includes('punto x') || path.includes('punto xi')) device = 'Material adicional'
  else return null

  const typeDesc: Record<string, string> = {
    conversacion: 'Chat extraido de',
    llamadas: 'Registro de llamadas de',
    audio: 'Audio extraido de',
    imagen: 'Imagen extraida de',
    pdf: 'Documento extraido de',
    rrss: 'Publicacion extraida de',
  }

  return `${typeDesc[docType] || 'Extraido de'} ${device}`
}

const TYPE_LABELS: Record<string, string> = {
  conversacion: 'Conversacion',
  llamadas: 'Llamadas',
  audio: 'Audio',
  imagen: 'Imagen',
  pdf: 'PDF',
  documento: 'Documento',
  transcripcion: 'Transcripcion',
  rrss: 'Red social',
  forense: 'Forense',
  planilla: 'Planilla',
  presentacion: 'Presentacion',
  texto: 'Texto',
  otro: 'Otro',
}

function cleanParticipant(p: string): string {
  // Remove @s.whatsapp.net suffix
  return p.replace(/@s\.whatsapp\.net/g, '').trim()
}

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: doc } = await supabase
    .from('documents')
    .select('title, doc_type')
    .eq('id', params.id)
    .single()

  return {
    title: doc?.title ? `${doc.title} — Archivo Libra` : 'Documento — Archivo Libra',
    description: doc?.title ? `${doc.doc_type}: ${doc.title}` : 'Documento del Archivo Libra',
  }
}

export default async function DocumentoPage({ params }: Props) {
  const supabase = createClient()
  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !doc) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-serif text-ink-950">Documento no encontrado</h1>
        <p className="text-ink-400 mt-2 text-sm">No existe o fue removido.</p>
        <Link href="/explorador" className="text-gold-700 hover:text-gold-900 text-sm mt-4 inline-block">
          Volver al explorador
        </Link>
      </div>
    )
  }

  const formattedDate = doc.date
    ? new Date(doc.date).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  // Check if original file exists (HEAD request to nginx internal)
  let fileExists = false
  try {
    const res = await fetch(`http://docs:80/documents/${encodeURI(doc.file_path)}`, { method: 'HEAD' })
    fileExists = res.ok
  } catch {
    fileExists = false
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Link
        href="/explorador"
        className="inline-flex items-center gap-1 text-sm text-ink-400 hover:text-ink-700 transition-colors mb-6"
      >
        &larr; Volver al archivo
      </Link>

      {/* Header */}
      <div className="mb-8">
        {/* Source context banner */}
        {getSourceContext(doc.file_path, doc.doc_type) && (
          <div className="flex items-center gap-2 text-xs text-ink-500 bg-ink-50 border border-ink-100 rounded-lg px-3 py-2 mb-4">
            <svg className="w-3.5 h-3.5 text-ink-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            {getSourceContext(doc.file_path, doc.doc_type)}
          </div>
        )}

        {/* Original file path for journalists to locate in ZIP */}
        <div className="flex items-center gap-2 text-xs text-ink-400 bg-ink-50/50 border border-ink-100 rounded-lg px-3 py-2 mb-4 font-mono group">
          <svg className="w-3.5 h-3.5 text-ink-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
          <span className="truncate select-all" title={doc.file_path}>{doc.file_path}</span>
        </div>

        <div className="flex items-start gap-3 mb-3">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-ink-100 text-ink-600 shrink-0 mt-1">
            {TYPE_LABELS[doc.doc_type] || doc.doc_type}
          </span>
          {formattedDate && (
            <span className="text-xs text-ink-400 font-mono mt-1.5">
              {formattedDate}
            </span>
          )}
        </div>

        <h1 className="font-serif text-2xl font-bold text-ink-950 mb-3">
          {doc.title || 'Sin titulo'}
        </h1>

        {/* Participants + tags */}
        <div className="flex gap-2 flex-wrap">
          {doc.participants?.length > 0 &&
            doc.participants.map((p: string) => (
              <Link
                key={p}
                href={`/explorador?q=${encodeURIComponent(p)}`}
                className="inline-flex items-center gap-1 text-xs border border-gold-200 bg-gold-50 rounded-full px-2.5 py-1 text-gold-800 hover:bg-gold-100 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {cleanParticipant(p)}
              </Link>
            ))
          }
          {doc.tags?.length > 0 &&
            doc.tags.map((tag: string) => (
              <Link
                key={tag}
                href={`/explorador?q=${encodeURIComponent(tag)}`}
                className="text-xs bg-ink-50 border border-ink-100 rounded-full px-2.5 py-1 text-ink-500 hover:border-ink-300 transition-colors"
              >
                {tag}
              </Link>
            ))
          }
        </div>
      </div>

      <DocumentViewer
        filePath={doc.file_path}
        content={doc.content}
        docType={doc.doc_type}
        title={doc.title}
        durationSeconds={doc.duration_seconds}
        fileExists={fileExists}
      />

      <RelatedDocuments documentId={params.id} />

      {/* Navigation hints */}
      <div className="mt-12 pt-6 border-t border-ink-100 flex flex-wrap gap-4 justify-center text-sm">
        <Link href="/explorador" className="text-ink-400 hover:text-ink-700 transition-colors">
          Explorador
        </Link>
        <Link href="/evidencia" className="text-ink-400 hover:text-ink-700 transition-colors">
          Evidencia clave
        </Link>
        <Link href="/red" className="text-ink-400 hover:text-ink-700 transition-colors">
          Red de conexiones
        </Link>
        <Link href="/chat" className="text-ink-400 hover:text-ink-700 transition-colors">
          Asistente
        </Link>
      </div>
    </div>
  )
}
