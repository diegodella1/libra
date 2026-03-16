'use client'

import { ForensicContent } from '@/components/ForensicContent'

interface EntityMatch {
  id: string
  entity_type: string
  value: string
}

interface DocumentViewerProps {
  filePath: string
  content: string | null
  docType: string
  title?: string
  durationSeconds?: number | null
  fileExists?: boolean
  entities?: EntityMatch[]
}

const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL || '/documents'

// Types where showing the original file is not useful (parsed content replaces it)
const CONTENT_ONLY_TYPES = ['conversacion', 'llamadas', 'texto']

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function getAudioContext(filePath: string): { device: string; chatWith: string | null } | null {
  const path = filePath.toLowerCase()
  let device = ''
  if (path.includes('punto v/') || path.includes('punto v\\')) device = 'Celular de Novelli (Samsung)'
  else if (path.includes('punto vi/') || path.includes('punto vi\\')) device = 'Celular de Novelli (iPhone)'
  else if (path.includes('punto iii/') || path.includes('punto iii\\')) device = 'Celular de Terrones'
  else if (path.includes('punto ii/')) device = 'Archivos digitales'
  else return null

  // Extract chat partner from path: .../PersonName/attachments/ or .../chats/.../
  let chatWith: string | null = null
  const personMatch = filePath.match(/\/([^/]+)\/(?:attachments|chats)/)
  if (personMatch) {
    chatWith = personMatch[1]
      .replace(/WhatsApp_\d+@s\.whatsapp\.net/, '')
      .replace(/\(\d+\)/, '')
      .trim()
  }
  // Try PDF folder: /PDF/PersonName/
  if (!chatWith) {
    const pdfMatch = filePath.match(/\/PDF\/([^/]+)\//)
    if (pdfMatch) chatWith = pdfMatch[1]
  }

  return { device, chatWith: chatWith || null }
}

export function DocumentViewer({ filePath, content, docType, title, durationSeconds, fileExists, entities }: DocumentViewerProps) {
  const fileUrl = `${DOCS_URL}/${filePath}`
  const altText = title ? `Documento: ${title}` : 'Documento original'
  const showOriginal = !CONTENT_ONLY_TYPES.includes(docType) && fileExists !== false
  const audioCtx = docType === 'audio' ? getAudioContext(filePath) : null

  // Audio: always show player + transcription (audio files exist on disk)
  if (docType === 'audio') {
    return (
      <div className="space-y-6">
        {/* Player */}
        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
          <div className="px-4 py-2 bg-ink-50 text-xs font-mono text-ink-500 border-b border-ink-200 uppercase tracking-wide">
            Audio
          </div>
          <div className="p-4">
            <div className="flex flex-col items-center gap-3 py-6">
              <svg className="w-10 h-10 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              {audioCtx && (
                <div className="flex flex-col items-center gap-0.5 text-xs text-ink-500">
                  <span>Encontrado en: {audioCtx.device}</span>
                  {audioCtx.chatWith && (
                    <span>Conversacion con: <span className="font-medium text-ink-700">{audioCtx.chatWith}</span></span>
                  )}
                </div>
              )}
              {durationSeconds != null && (
                <span className="text-sm font-mono text-ink-500">
                  {formatDuration(durationSeconds)}
                </span>
              )}
              <audio controls preload="metadata" className="w-full max-w-md">
                <source src={fileUrl} />
                Tu navegador no soporta audio.
              </audio>
            </div>
          </div>
        </div>
        {/* Transcripcion */}
        {content && (
          <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
            <div className="px-4 py-2 bg-ink-50 text-xs font-mono text-ink-500 border-b border-ink-200 uppercase tracking-wide">
              Transcripcion
            </div>
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <ForensicContent content={content} docType={docType} entities={entities} />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Image without file: show message about missing file
  if (docType === 'imagen' && !showOriginal) {
    return (
      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
        <div className="px-4 py-2 bg-ink-50 text-xs font-mono text-ink-500 border-b border-ink-200 uppercase tracking-wide">
          Imagen
        </div>
        <div className="p-8 text-center">
          <svg className="w-16 h-16 text-ink-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-ink-400 text-sm">
            Imagen registrada en el expediente.
          </p>
          <p className="text-ink-300 text-xs mt-1">
            El archivo original no esta disponible para visualizacion.
          </p>
        </div>
      </div>
    )
  }

  // Full-width layout when only showing content (no original file)
  if (!showOriginal) {
    return (
      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
        <div className="px-4 py-2 bg-ink-50 text-xs font-mono text-ink-500 border-b border-ink-200 uppercase tracking-wide">
          Contenido
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {content ? (
            <ForensicContent content={content} docType={docType} entities={entities} />
          ) : (
            <p className="text-ink-300 italic text-sm">
              Este documento no tiene contenido de texto disponible.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Original */}
      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
        <div className="px-4 py-2 bg-ink-50 text-xs font-mono text-ink-500 border-b border-ink-200 uppercase tracking-wide">
          Original
        </div>
        <div className="p-4">
          {docType === 'audio' ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <svg className="w-12 h-12 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              {title && (
                <p className="text-sm text-ink-700 text-center font-medium max-w-md">
                  {title}
                </p>
              )}
              {audioCtx && (
                <div className="flex flex-col items-center gap-0.5 text-xs text-ink-500">
                  <span>Encontrado en: {audioCtx.device}</span>
                  {audioCtx.chatWith && (
                    <span>Conversacion con: <span className="font-medium text-ink-700">{audioCtx.chatWith}</span></span>
                  )}
                </div>
              )}
              {durationSeconds != null && (
                <span className="text-sm font-mono text-ink-500">
                  {formatDuration(durationSeconds)}
                </span>
              )}
              <audio controls preload="metadata" className="w-full max-w-md">
                <source src={fileUrl} />
                Tu navegador no soporta audio.
              </audio>
            </div>
          ) : docType === 'imagen' ? (
            <img
              src={fileUrl}
              alt={altText}
              loading="lazy"
              className="w-full rounded"
            />
          ) : (
            <iframe
              src={fileUrl}
              className="w-full h-[80vh] rounded"
              title={altText}
            />
          )}
        </div>
      </div>

      {/* Transcripcion */}
      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
        <div className="px-4 py-2 bg-ink-50 text-xs font-mono text-ink-500 border-b border-ink-200 uppercase tracking-wide">
          Transcripcion
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {content ? (
            <ForensicContent content={content} docType={docType} entities={entities} />
          ) : (
            <p className="text-ink-300 italic text-sm">
              Transcripcion no disponible.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
