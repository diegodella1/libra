import Link from 'next/link'
import type { Metadata } from 'next'
import { DocumentViewer } from '@/components/DocumentViewer'
import { MetadataCard } from '@/components/MetadataCard'
import { RelatedDocuments } from '@/components/RelatedDocuments'
import { createClient } from '@/lib/supabase'

// Structured chat context extracted from forensic chat exports
export interface ChatContext {
  // Who sent this specific message
  sender: { jid: string; name: string | null } | null
  // All participants in the conversation
  participants: { jid: string; name: string | null; isOwner: boolean }[]
  // When this specific attachment was sent
  timestamp: string | null
  // App used
  app: string | null
  // Chat date range
  chatStart: string | null
  chatEnd: string | null
  // Link to the full conversation document
  chatDocId: string | null
}

function parseParticipantsFromHeader(content: string): ChatContext['participants'] {
  const participants: ChatContext['participants'] = []
  const headerMatch = content.match(/Participantes?:\s*(.+?)(?:\n|$)/i)
  if (!headerMatch) return participants

  const raw = headerMatch[1]
  const entries = raw.match(/(\d+)@s\.whatsapp\.net\s*([^,\n]*)/g)
  if (!entries) return participants

  for (const entry of entries) {
    const m = entry.match(/(\d+)@s\.whatsapp\.net\s*(.*)/)
    if (!m) continue
    const jid = m[1]
    let name = m[2].replace(/\(owner\)/gi, '').replace(/\*/g, '').trim() || null
    const isOwner = /\(owner\)/i.test(m[2]) || /\*/i.test(entry)
    participants.push({ jid, name, isOwner })
  }
  return participants
}

function findAttachmentBlock(content: string, fileUuid: string): {
  sender: { jid: string; name: string | null } | null
  timestamp: string | null
  app: string | null
} {
  // Split into message blocks and find the one with our attachment
  const blocks = content.split(/-----------------------------/)
  for (const block of blocks) {
    if (!block.includes(fileUuid)) continue

    let sender: { jid: string; name: string | null } | null = null
    const fromMatch = block.match(/From:\s*(\d+)@s\.whatsapp\.net\s*(.*)$/im)
    if (fromMatch) {
      sender = {
        jid: fromMatch[1],
        name: fromMatch[2].replace(/\(owner\)/gi, '').replace(/\*/g, '').trim() || null,
      }
    }

    let timestamp: string | null = null
    const tsMatch = block.match(/Marca de hora:\s*(.+?)(?:\n|$)/i)
    if (tsMatch) {
      timestamp = tsMatch[1].replace(/\(UTC[^)]*\)/i, '').trim()
    }

    let app: string | null = null
    const appMatch = block.match(/Aplicación de origen:\s*(.+?)(?:\n|$)/i)
    if (appMatch) app = appMatch[1].trim()

    return { sender, timestamp, app }
  }
  return { sender: null, timestamp: null, app: null }
}

async function resolveAttachmentContext(
  supabase: ReturnType<typeof createClient>,
  filePath: string,
): Promise<ChatContext | null> {
  // Extract file UUID from path
  const fileUuid = filePath.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  if (!fileUuid) return null

  // Step 1: Find the chat folder path (either from file path directly or by cross-referencing)
  let chatBasePath: string | null = null
  const directJid = filePath.match(/chats\/WhatsApp_(\d+)@s\.whatsapp\.net/)
  if (directJid) {
    chatBasePath = filePath.replace(/\/attachments\d+\/.*$/, '')
  } else {
    // Cross-reference: find same UUID in a /chats/ folder
    const { data: chatAttachment } = await supabase
      .from('documents')
      .select('file_path')
      .like('file_path', `%/chats/%${fileUuid[1]}%`)
      .neq('file_path', filePath)
      .limit(1)
      .single()
    if (chatAttachment) {
      chatBasePath = chatAttachment.file_path.replace(/\/attachments\d+\/.*$/, '')
    }
  }
  if (!chatBasePath) return null

  // Step 2: Find the chat txt file that references this UUID (has the message context)
  const { data: chatDocs } = await supabase
    .from('documents')
    .select('id, content, file_path')
    .like('file_path', `${chatBasePath}/chat%`)
    .order('file_path')

  if (!chatDocs || chatDocs.length === 0) return null

  // Step 3: Search through chat docs for the block referencing our UUID
  let sender: ChatContext['sender'] = null
  let timestamp: string | null = null
  let app: string | null = null
  let participants: ChatContext['participants'] = []
  let chatStart: string | null = null
  let chatEnd: string | null = null
  let chatDocId: string | null = chatDocs[0].id

  for (const chatDoc of chatDocs) {
    if (!chatDoc.content) continue

    // Extract participants from first chat doc that has them
    if (participants.length === 0) {
      participants = parseParticipantsFromHeader(chatDoc.content)
    }

    // Extract date range
    if (!chatStart) {
      const startMatch = chatDoc.content.match(/Hora de inicio:\s*(.+?)(?:\n|$)/i)
      if (startMatch) chatStart = startMatch[1].replace(/\(UTC[^)]*\)/i, '').trim()
    }
    if (!chatEnd) {
      const endMatch = chatDoc.content.match(/Actividad más reciente:\s*(.+?)(?:\n|$)/i)
      if (endMatch) chatEnd = endMatch[1].replace(/\(UTC[^)]*\)/i, '').trim()
    }

    // Find the specific message block that sent this attachment
    if (chatDoc.content.includes(fileUuid[1])) {
      const block = findAttachmentBlock(chatDoc.content, fileUuid[1])
      sender = block.sender
      timestamp = block.timestamp
      app = block.app
      chatDocId = chatDoc.id
    }
  }

  if (participants.length === 0 && !sender) return null

  return { sender, participants, timestamp, app, chatStart, chatEnd, chatDocId }
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

  // Check if original file exists (HEAD request to nginx internal)
  let fileExists = false
  try {
    const res = await fetch(`http://docs:80/documents/${encodeURI(doc.file_path)}`, { method: 'HEAD' })
    fileExists = res.ok
  } catch {
    fileExists = false
  }

  // For audio/image files, find the full chat context by cross-referencing the file UUID
  let chatContext: ChatContext | null = null
  if (['audio', 'imagen'].includes(doc.doc_type)) {
    chatContext = await resolveAttachmentContext(supabase, doc.file_path)
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
