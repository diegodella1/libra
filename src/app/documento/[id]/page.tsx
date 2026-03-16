import Link from 'next/link'
import type { Metadata } from 'next'
import { DocumentViewer } from '@/components/DocumentViewer'
import { MetadataCard } from '@/components/MetadataCard'
import { RelatedDocuments } from '@/components/RelatedDocuments'
import { createClient } from '@/lib/supabase'

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

  // Check if original file exists (HEAD request to nginx internal)
  let fileExists = false
  try {
    const res = await fetch(`http://docs:80/documents/${encodeURI(doc.file_path)}`, { method: 'HEAD' })
    fileExists = res.ok
  } catch {
    fileExists = false
  }

  // For audio/image files in /files/ folders, try to find the chat context by UUID cross-reference
  let chatContext: { jid: string; contactName: string | null; chatDocId: string | null } | null = null
  if (['audio', 'imagen'].includes(doc.doc_type)) {
    // Try to extract JID directly from path (files already in /chats/WhatsApp_XXX/)
    const jidInPath = doc.file_path.match(/chats\/WhatsApp_(\d+)@s\.whatsapp\.net/)
    if (jidInPath) {
      // Get contact name from sibling chat.txt
      const chatBasePath = doc.file_path.replace(/\/attachments\d+\/.*$/, '')
      const { data: chatDoc } = await supabase
        .from('documents')
        .select('id, content')
        .like('file_path', `${chatBasePath}/chat%`)
        .limit(1)
        .single()
      let contactName: string | null = null
      if (chatDoc?.content) {
        // Extract participant name from chat header: "Participantes: ...JID Name, ..."
        const participantMatch = chatDoc.content.match(
          new RegExp(`${jidInPath[1]}@s\\.whatsapp\\.net\\s+([^,\\n]+)`)
        )
        if (participantMatch) {
          contactName = participantMatch[1]
            .replace(/\(owner\)/gi, '').replace(/\*/g, '').trim() || null
        }
      }
      chatContext = { jid: jidInPath[1], contactName, chatDocId: chatDoc?.id || null }
    } else {
      // Loose file in /files/Audio/ — cross-reference UUID with chat attachments
      const fileUuid = doc.file_path.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
      if (fileUuid) {
        const { data: chatAttachment } = await supabase
          .from('documents')
          .select('file_path')
          .like('file_path', `%/chats/%${fileUuid[1]}%`)
          .neq('file_path', doc.file_path)
          .limit(1)
          .single()
        if (chatAttachment) {
          const jidMatch = chatAttachment.file_path.match(/chats\/WhatsApp_(\d+)@s\.whatsapp\.net/)
          if (jidMatch) {
            // Get contact name from the chat txt
            const chatBase = chatAttachment.file_path.replace(/\/attachments\d+\/.*$/, '')
            const { data: chatDoc } = await supabase
              .from('documents')
              .select('id, content')
              .like('file_path', `${chatBase}/chat%`)
              .limit(1)
              .single()
            let contactName: string | null = null
            if (chatDoc?.content) {
              const participantMatch = chatDoc.content.match(
                new RegExp(`${jidMatch[1]}@s\\.whatsapp\\.net\\s+([^,\\n]+)`)
              )
              if (participantMatch) {
                contactName = participantMatch[1]
                  .replace(/\(owner\)/gi, '').replace(/\*/g, '').trim() || null
              }
            }
            chatContext = { jid: jidMatch[1], contactName, chatDocId: chatDoc?.id || null }
          }
        }
      }
    }
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
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-ink-950 mb-2">
          {doc.title || 'Sin titulo'}
        </h1>

        {/* Original file path for journalists to locate in ZIP */}
        <div className="flex items-center gap-2 text-xs text-ink-400 bg-ink-50/50 border border-ink-100 rounded-lg px-3 py-2 font-mono">
          <svg className="w-3.5 h-3.5 text-ink-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
          <span className="truncate select-all" title={doc.file_path}>{doc.file_path}</span>
        </div>
      </div>

      {/* Metadata card */}
      <div className="mb-8">
        <MetadataCard doc={doc} chatContext={chatContext} />
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
