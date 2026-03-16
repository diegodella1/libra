import Link from 'next/link'
import type { ChatContext } from '@/app/documento/[id]/page'

interface MetadataCardProps {
  doc: {
    doc_type: string
    date: string | null
    file_path: string
    file_size: number | null
    page_count: number | null
    participants: string[]
    tags: string[]
    duration_seconds: number | null
    audio_format: string | null
    content: string | null
  }
  chatContext?: ChatContext | null
}

// --- Helpers ---

const TYPE_LABELS: Record<string, string> = {
  conversacion: 'Conversación',
  llamadas: 'Registro de llamadas',
  audio: 'Audio',
  imagen: 'Imagen',
  pdf: 'Documento PDF',
  documento: 'Documento',
  transcripcion: 'Transcripción',
  rrss: 'Red social',
  forense: 'Imagen forense',
  planilla: 'Planilla de cálculo',
  presentacion: 'Presentación',
  texto: 'Texto plano',
  otro: 'Otro',
}

const TYPE_ICONS: Record<string, string> = {
  conversacion: '💬',
  llamadas: '📞',
  audio: '🎙️',
  imagen: '🖼️',
  pdf: '📄',
  documento: '📄',
  transcripcion: '📝',
  rrss: '📱',
  forense: '🔍',
  planilla: '📊',
  presentacion: '📊',
  texto: '📝',
  otro: '📎',
}

interface DeviceInfo {
  device: string
  owner: string
  os: string | null
}

function getDeviceInfo(filePath: string): DeviceInfo | null {
  const path = filePath.toLowerCase()
  if (path.includes('punto v/') || path.includes('punto v\\'))
    return { device: 'Samsung Galaxy', owner: 'Mauricio Novelli', os: 'Android' }
  if (path.includes('punto vi/') || path.includes('punto vi\\'))
    return { device: 'iPhone', owner: 'Mauricio Novelli', os: 'iOS' }
  if (path.includes('punto iii/') || path.includes('punto iii\\'))
    return { device: 'Celular', owner: 'Manuel Terrones', os: null }
  if (path.includes('punto ii/') || path.includes('punto ii\\'))
    return { device: 'Archivos digitales secuestrados', owner: '', os: null }
  if (path.includes('punto i/') || path.includes('punto i\\'))
    return { device: 'Redes sociales', owner: '', os: null }
  if (path.includes('punto x') || path.includes('punto xi'))
    return { device: 'Material adicional', owner: '', os: null }
  return null
}

function getPlatform(filePath: string, tags: string[]): string | null {
  const path = filePath.toLowerCase()
  if (path.includes('whatsapp') || tags.includes('whatsapp')) return 'WhatsApp'
  if (path.includes('telegram') || tags.includes('telegram')) return 'Telegram'
  if (path.includes('instagram') || tags.includes('instagram')) return 'Instagram'
  return null
}

function getEfectoPunto(tags: string[]): { efecto: string | null; punto: string | null } {
  let efecto: string | null = null
  let punto: string | null = null
  for (const tag of tags) {
    if (/^efecto\s/i.test(tag)) efecto = tag
    if (/^punto\s/i.test(tag)) punto = tag
  }
  return { efecto, punto }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function cleanParticipant(p: string): string {
  return p.replace(/@s\.whatsapp\.net/g, '').trim()
}

function formatJidPhone(jid: string): string {
  const digits = jid.replace(/[^\d]/g, '')
  const arMatch = digits.match(/^54(9)(\d{2})(\d{4})(\d{4})$/)
  if (arMatch) return `+54 9 ${arMatch[2]} ${arMatch[3]}-${arMatch[4]}`
  return `+${digits}`
}

function extractParticipantNumbers(participants: string[]): { name: string; phone: string | null }[] {
  return participants.map(p => {
    const cleaned = p.replace(/@s\.whatsapp\.net/g, '').trim()
    // Check if it's a phone number (starts with + or is all digits)
    const phoneMatch = cleaned.match(/^(\+?\d[\d\s-]{7,})$/)
    if (phoneMatch) {
      // Format Argentine numbers
      const digits = cleaned.replace(/[^\d]/g, '')
      const arMatch = digits.match(/^54(9)(\d{2})(\d{4})(\d{4})$/)
      if (arMatch) {
        return { name: '', phone: `+54 9 ${arMatch[2]} ${arMatch[3]}-${arMatch[4]}` }
      }
      return { name: '', phone: cleaned.startsWith('+') ? cleaned : `+${cleaned}` }
    }
    // Has both name and number embedded
    const namePhoneMatch = cleaned.match(/^(.+?)\s*(\+?\d[\d\s-]{7,})$/)
    if (namePhoneMatch) {
      return { name: namePhoneMatch[1].trim(), phone: namePhoneMatch[2].trim() }
    }
    return { name: cleaned, phone: null }
  })
}

function extractConversationMeta(content: string | null): {
  messageCount: number | null
  dateRange: { start: string | null; end: string | null }
  ownerAccount: string | null
} {
  if (!content) return { messageCount: null, dateRange: { start: null, end: null }, ownerAccount: null }

  // Count messages (From: blocks)
  const fromMatches = content.match(/^From:/gim)
  const messageCount = fromMatches ? fromMatches.length : null

  // Date range
  let start: string | null = null
  let end: string | null = null
  const startMatch = content.match(/Hora de inicio:\s*(.+?)(?:\n|$)/i)
  const endMatch = content.match(/Actividad más reciente:\s*(.+?)(?:\n|$)/i)
  if (startMatch) start = startMatch[1].replace(/\(UTC[^)]*\)/i, '').trim()
  if (endMatch) end = endMatch[1].replace(/\(UTC[^)]*\)/i, '').trim()

  // Owner account (Cuenta)
  let ownerAccount: string | null = null
  const cuentaMatch = content.match(/Cuenta:\s*(\d+)@s\.whatsapp\.net/i)
  if (cuentaMatch) {
    const digits = cuentaMatch[1]
    const arMatch = digits.match(/^54(9)(\d{2})(\d{4})(\d{4})$/)
    ownerAccount = arMatch
      ? `+54 9 ${arMatch[2]} ${arMatch[3]}-${arMatch[4]}`
      : `+${digits}`
  }

  return { messageCount, dateRange: { start, end }, ownerAccount }
}

function extractCallMeta(content: string | null): {
  callCount: number | null
  answered: number
  missed: number
} {
  if (!content) return { callCount: null, answered: 0, missed: 0 }
  const blocks = content.split(/(?=(?:^|\n)\s*\d+\s+(?:Para|De)\s*:)/m)
  let total = 0
  let answered = 0
  let missed = 0
  for (const block of blocks) {
    if (!/\d+\s+(?:Para|De)\s*:/m.test(block)) continue
    total++
    if (/\bRespondido\b/i.test(block)) answered++
    if (/\bPerdidas\b/i.test(block) || /\bNo\s*respondido?\b/i.test(block)) missed++
  }
  return { callCount: total || null, answered, missed }
}

// --- Row component ---

function MetaRow({ label, value, mono, icon }: { label: string; value: React.ReactNode; mono?: boolean; icon?: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2 border-b border-ink-50 last:border-0">
      <div className="flex items-center gap-1.5 w-32 shrink-0">
        {icon && <span className="text-ink-300 w-4 h-4 flex items-center justify-center">{icon}</span>}
        <span className="text-[11px] uppercase tracking-wider text-ink-400 font-medium">{label}</span>
      </div>
      <div className={`text-sm text-ink-700 flex-1 min-w-0 ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </div>
    </div>
  )
}

// --- SVG Icons ---

function DeviceIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// --- Main component ---

export function MetadataCard({ doc, chatContext }: MetadataCardProps) {
  const deviceInfo = getDeviceInfo(doc.file_path)
  const platform = getPlatform(doc.file_path, doc.tags)
  const { efecto, punto } = getEfectoPunto(doc.tags)
  const participantDetails = extractParticipantNumbers(doc.participants || [])
  const fileExt = doc.file_path.split('.').pop()?.toLowerCase()

  // Type-specific metadata
  const isConversation = doc.doc_type === 'conversacion'
  const isCalls = doc.doc_type === 'llamadas'
  const isAudio = doc.doc_type === 'audio'

  const convMeta = isConversation ? extractConversationMeta(doc.content) : null
  const callMeta = isCalls ? extractCallMeta(doc.content) : null

  return (
    <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 bg-ink-50 border-b border-ink-200 flex items-center gap-2">
        <svg className="w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <span className="text-xs font-mono text-ink-500 uppercase tracking-wide">Metadata</span>
      </div>

      <div className="px-4 py-2">
        {/* Type */}
        <MetaRow
          label="Tipo"
          value={
            <span className="inline-flex items-center gap-1.5">
              <span>{TYPE_ICONS[doc.doc_type] || '📎'}</span>
              <span className="font-medium">{TYPE_LABELS[doc.doc_type] || doc.doc_type}</span>
            </span>
          }
        />

        {/* Platform */}
        {platform && (
          <MetaRow
            label="Plataforma"
            value={
              <span className="inline-flex items-center gap-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                  {platform}
                </span>
              </span>
            }
          />
        )}

        {/* Device + OS */}
        {deviceInfo && (
          <MetaRow
            label="Dispositivo"
            icon={<DeviceIcon />}
            value={
              <div className="flex flex-col gap-0.5">
                <span>{deviceInfo.device}{deviceInfo.owner ? ` — ${deviceInfo.owner}` : ''}</span>
                {deviceInfo.os && (
                  <span className="text-xs text-ink-400">
                    {deviceInfo.os === 'Android' ? '🤖' : '🍎'} {deviceInfo.os}
                  </span>
                )}
              </div>
            }
          />
        )}

        {/* Owner account (who the phone belongs to) */}
        {convMeta?.ownerAccount && (
          <MetaRow
            label="Cuenta"
            icon={<DeviceIcon />}
            value={<span className="font-mono text-xs">{convMeta.ownerAccount}</span>}
          />
        )}

        {/* Forensic chat context for audio/image attachments */}
        {chatContext?.sender && (
          <MetaRow
            label="Enviado por"
            icon={<PersonIcon />}
            value={
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/explorador?q=${encodeURIComponent(chatContext.sender.name || chatContext.sender.jid)}`}
                  className="font-medium text-ink-700 hover:text-gold-700 transition-colors"
                >
                  {chatContext.sender.name || 'Contacto'}
                </Link>
                <span className="text-[11px] font-mono text-ink-400 bg-ink-50 rounded px-1.5 py-0.5">
                  {formatJidPhone(chatContext.sender.jid)}
                </span>
              </div>
            }
          />
        )}

        {chatContext && chatContext.participants.length > 0 && (
          <MetaRow
            label="Conversacion"
            icon={<PersonIcon />}
            value={
              <div className="flex flex-col gap-1.5">
                {chatContext.participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/explorador?q=${encodeURIComponent(p.name || p.jid)}`}
                      className="text-sm text-ink-700 hover:text-gold-700 transition-colors"
                    >
                      {p.name || 'Contacto'}
                    </Link>
                    <span className="text-[11px] font-mono text-ink-400 bg-ink-50 rounded px-1.5 py-0.5">
                      {formatJidPhone(p.jid)}
                    </span>
                    {p.isOwner && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        dueño
                      </span>
                    )}
                  </div>
                ))}
                {chatContext.chatDocId && (
                  <Link
                    href={`/documento/${chatContext.chatDocId}`}
                    className="text-[11px] text-gold-700 hover:text-gold-900 transition-colors inline-flex items-center gap-1 mt-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    Ver conversacion completa
                  </Link>
                )}
              </div>
            }
          />
        )}

        {chatContext?.timestamp && (
          <MetaRow
            label="Enviado"
            icon={<CalendarIcon />}
            value={<span className="font-mono text-xs">{chatContext.timestamp}</span>}
          />
        )}

        {chatContext?.app && !platform && (
          <MetaRow
            label="Plataforma"
            value={
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                {chatContext.app}
              </span>
            }
          />
        )}

        {chatContext?.chatStart && (
          <MetaRow
            label="Periodo chat"
            icon={<CalendarIcon />}
            value={
              <span className="text-xs font-mono">
                {chatContext.chatStart}
                {chatContext.chatEnd && ` — ${chatContext.chatEnd}`}
              </span>
            }
          />
        )}

        {/* Participants with phone numbers */}
        {participantDetails.length > 0 && (
          <MetaRow
            label="Participantes"
            icon={<PersonIcon />}
            value={
              <div className="flex flex-col gap-1">
                {participantDetails.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/explorador?q=${encodeURIComponent(p.name || p.phone || '')}`}
                      className="text-sm font-medium text-ink-700 hover:text-gold-700 transition-colors"
                    >
                      {p.name || p.phone || 'Desconocido'}
                    </Link>
                    {p.phone && p.name && (
                      <span className="text-[11px] font-mono text-ink-400 bg-ink-50 rounded px-1.5 py-0.5">
                        {p.phone}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            }
          />
        )}

        {/* Date */}
        {doc.date && (
          <MetaRow
            label="Fecha"
            icon={<CalendarIcon />}
            value={new Date(doc.date).toLocaleDateString('es-AR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          />
        )}

        {/* Conversation date range */}
        {convMeta?.dateRange.start && (
          <MetaRow
            label="Periodo"
            icon={<CalendarIcon />}
            value={
              <span className="text-xs font-mono">
                {convMeta.dateRange.start}
                {convMeta.dateRange.end && ` — ${convMeta.dateRange.end}`}
              </span>
            }
          />
        )}

        {/* Message count for conversations */}
        {convMeta?.messageCount && (
          <MetaRow
            label="Mensajes"
            value={
              <span className="text-xs px-2 py-0.5 rounded-full bg-ink-100 text-ink-600 font-mono">
                {convMeta.messageCount.toLocaleString('es-AR')}
              </span>
            }
          />
        )}

        {/* Call stats */}
        {callMeta?.callCount && (
          <MetaRow
            label="Llamadas"
            value={
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full bg-ink-100 text-ink-600 font-mono">
                  {callMeta.callCount} total
                </span>
                {callMeta.answered > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                    {callMeta.answered} respondida{callMeta.answered > 1 ? 's' : ''}
                  </span>
                )}
                {callMeta.missed > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                    {callMeta.missed} perdida{callMeta.missed > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            }
          />
        )}

        {/* Audio format + duration */}
        {isAudio && (
          <>
            {doc.duration_seconds != null && (
              <MetaRow
                label="Duración"
                icon={<ClockIcon />}
                value={<span className="font-mono">{formatDuration(doc.duration_seconds)}</span>}
              />
            )}
            {(doc.audio_format || fileExt) && (
              <MetaRow
                label="Formato"
                value={
                  <span className="text-xs px-2 py-0.5 rounded bg-ink-50 border border-ink-100 font-mono uppercase">
                    {doc.audio_format || fileExt}
                  </span>
                }
              />
            )}
          </>
        )}

        {/* File size */}
        {doc.file_size != null && doc.file_size > 0 && (
          <MetaRow
            label="Tamaño"
            value={<span className="font-mono text-xs">{formatFileSize(doc.file_size)}</span>}
          />
        )}

        {/* Page count */}
        {doc.page_count != null && doc.page_count > 0 && (
          <MetaRow
            label="Páginas"
            value={<span className="font-mono">{doc.page_count}</span>}
          />
        )}

        {/* Efecto / Punto (source in the investigation) */}
        {(efecto || punto) && (
          <MetaRow
            label="Origen"
            value={
              <div className="flex gap-1.5 flex-wrap">
                {efecto && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    {efecto}
                  </span>
                )}
                {punto && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    {punto}
                  </span>
                )}
              </div>
            }
          />
        )}
      </div>
    </div>
  )
}
