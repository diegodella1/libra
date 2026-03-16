'use client'

import { useMemo } from 'react'
import {
  parseForensicContent,
  contactLabel,
  type ParseResult,
  type ParsedCall,
  type ParsedMessage,
  type ParsedConversation,
} from '@/lib/forensic-parser'
import { EntityHighlighter } from '@/components/EntityHighlighter'

interface EntityMatch {
  id: string
  entity_type: string
  value: string
}

interface ForensicContentProps {
  content: string
  docType: string
  entities?: EntityMatch[]
}

// --- Icons ---

function CallDirectionIcon({ call }: { call: ParsedCall }) {
  if (call.status === 'perdidas' || call.status === 'no respondido') {
    return (
      <svg className="w-4 h-4 text-red-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
      </svg>
    )
  }
  if (call.direction === 'saliente') {
    return (
      <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4 text-green-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M14.78 5.22a.75.75 0 00-1.06 0L6.5 12.44V6.75a.75.75 0 00-1.5 0v7.5c0 .414.336.75.75.75h7.5a.75.75 0 000-1.5H7.56l7.22-7.22a.75.75 0 000-1.06z" clipRule="evenodd" />
    </svg>
  )
}

function MessageTypeIcon({ type }: { type: ParsedMessage['type'] }) {
  if (type === 'call') {
    return (
      <svg className="w-3.5 h-3.5 text-ink-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
      </svg>
    )
  }
  return null
}

function shortTimestamp(ts: string | null): string {
  if (!ts) return ''
  // "19/10/2024 17:36" → "19/10 17:36"
  return ts.replace(/\/\d{4}\s/, ' ')
}

function statusLabel(status: string): string {
  switch (status) {
    case 'respondido': return 'Respondida'
    case 'perdidas': return 'Perdida'
    case 'no respondido': return 'No respondida'
    default: return ''
  }
}

// --- Llamadas view ---

function LlamadasView({ calls }: { calls: ParsedCall[] }) {
  const respondidas = calls.filter(c => c.status === 'respondido').length
  const perdidas = calls.filter(c => c.status === 'perdidas' || c.status === 'no respondido').length
  const salientes = calls.filter(c => c.direction === 'saliente').length
  const entrantes = calls.filter(c => c.direction === 'entrante').length

  // Unique contacts
  const contactNames = new Set<string>()
  for (const c of calls) {
    const contact = c.direction === 'entrante' ? c.from : (c.to || c.from)
    contactNames.add(contactLabel(contact))
  }
  const uniqueContacts = Array.from(contactNames).slice(0, 5)

  return (
    <div>
      {/* Context */}
      {uniqueContacts.length > 0 && (
        <p className="text-xs text-ink-600 mb-3">
          Llamadas con: <span className="font-semibold">{uniqueContacts.join(', ')}</span>
          {contactNames.size > 5 && ` y ${contactNames.size - 5} mas`}
        </p>
      )}

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs font-mono px-2 py-1 rounded-full bg-ink-100 text-ink-600">
          {calls.length} llamada{calls.length !== 1 ? 's' : ''}
        </span>
        {respondidas > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
            {respondidas} respondida{respondidas > 1 ? 's' : ''}
          </span>
        )}
        {perdidas > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
            {perdidas} perdida{perdidas > 1 ? 's' : ''}
          </span>
        )}
        {salientes > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {salientes} saliente{salientes > 1 ? 's' : ''}
          </span>
        )}
        {entrantes > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-ink-50 text-ink-600">
            {entrantes} entrante{entrantes > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Call list */}
      <div className="divide-y divide-ink-100">
        {calls.map((call, i) => {
          const contact = call.direction === 'entrante' ? call.from : (call.to || call.from)
          const lost = call.status === 'perdidas' || call.status === 'no respondido'
          return (
            <div key={i} className={`flex items-center gap-3 py-2.5 text-sm ${lost ? 'opacity-70' : ''}`}>
              <CallDirectionIcon call={call} />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-ink-800 truncate block">
                  {contactLabel(contact)}
                </span>
                <div className="flex items-center gap-2 text-[11px] text-ink-400 mt-0.5">
                  {call.timestamp && <span>{shortTimestamp(call.timestamp)}</span>}
                  {call.isVideo && <span>Video</span>}
                  {lost && <span className="text-red-500">{statusLabel(call.status)}</span>}
                </div>
              </div>
              {call.duration && call.duration !== '00:00:00' && (
                <span className="text-xs font-mono text-ink-500 shrink-0">
                  {call.duration}
                </span>
              )}
              {call.source && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-50 text-ink-400 shrink-0 border border-ink-100">
                  {call.source}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Conversacion view (chat bubbles) ---

const SENDER_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', name: 'text-blue-700' },
  { bg: 'bg-purple-50', border: 'border-purple-200', name: 'text-purple-700' },
  { bg: 'bg-teal-50', border: 'border-teal-200', name: 'text-teal-700' },
  { bg: 'bg-rose-50', border: 'border-rose-200', name: 'text-rose-700' },
  { bg: 'bg-orange-50', border: 'border-orange-200', name: 'text-orange-700' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', name: 'text-cyan-700' },
]

function extractDate(ts: string | null): string | null {
  if (!ts) return null
  const m = ts.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)
  return m ? m[1] : null
}

function ConversacionView({ conversation }: { conversation: ParseResult & { format: 'conversacion' } }) {
  const { participants, messages, dateRange, ownerPhone } = conversation.conversation

  // Build sender color map
  const senderColorMap = useMemo(() => {
    const map = new Map<string, typeof SENDER_COLORS[0]>()
    let colorIdx = 0
    for (const msg of messages) {
      const key = msg.from.phone
      if (!map.has(key) && key !== ownerPhone) {
        map.set(key, SENDER_COLORS[colorIdx % SENDER_COLORS.length])
        colorIdx++
      }
    }
    return map
  }, [messages, ownerPhone])

  // Determine unique senders for header
  const senderNames = useMemo(() => {
    const m = new Map<string, string>()
    for (const msg of messages) {
      if (!m.has(msg.from.phone)) m.set(msg.from.phone, contactLabel(msg.from))
    }
    return Array.from(m.values())
  }, [messages])

  let lastDate: string | null = null

  return (
    <div>
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-ink-100">
        {senderNames.length >= 2 && (
          <p className="text-xs text-ink-600 mb-2">
            <span className="font-semibold">{senderNames[0]}</span>
            {' con '}
            <span className="font-semibold">{senderNames.slice(1).join(', ')}</span>
          </p>
        )}
        {senderNames.length === 1 && participants.length > 0 && (
          <p className="text-xs text-ink-600 mb-2">
            <span className="font-semibold">{senderNames[0]}</span>
            {' con '}
            <span className="font-semibold">
              {participants.filter(p => contactLabel(p) !== senderNames[0]).map(p => contactLabel(p)).join(', ') || 'desconocido'}
            </span>
          </p>
        )}
        {participants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {participants.map((p, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gold-50 text-gold-800 border border-gold-200">
                {contactLabel(p)}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-3 text-[11px] text-ink-400 font-mono">
          {dateRange.start && <span>{dateRange.start}</span>}
          {dateRange.start && dateRange.end && <span>—</span>}
          {dateRange.end && <span>{dateRange.end}</span>}
          <span>{messages.length} mensaje{messages.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Chat bubbles */}
      <div className="space-y-1">
        {messages.map((msg, i) => {
          const msgDate = extractDate(msg.timestamp)
          let showDateSep = false
          if (msgDate && msgDate !== lastDate) {
            showDateSep = true
            lastDate = msgDate
          }

          // System / call events
          if (msg.type === 'call') {
            return (
              <div key={i}>
                {showDateSep && (
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-ink-100" />
                    <span className="text-[10px] font-mono text-ink-400">{msgDate}</span>
                    <div className="flex-1 h-px bg-ink-100" />
                  </div>
                )}
                <div className="flex justify-center my-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink-100 text-[11px] text-ink-500">
                    <MessageTypeIcon type="call" />
                    <span>{contactLabel(msg.from)}</span>
                    <span className="italic">{msg.content}</span>
                    {msg.timestamp && <span className="text-ink-400 ml-1">{shortTimestamp(msg.timestamp)}</span>}
                  </div>
                </div>
              </div>
            )
          }

          const isOwner = ownerPhone != null && msg.from.phone === ownerPhone
          const senderColor = senderColorMap.get(msg.from.phone)

          return (
            <div key={i}>
              {showDateSep && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-ink-100" />
                  <span className="text-[10px] font-mono text-ink-400">{msgDate}</span>
                  <div className="flex-1 h-px bg-ink-100" />
                </div>
              )}
              <div className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 border ${
                    isOwner
                      ? 'bg-gold-50 border-gold-200 rounded-xl rounded-tr-sm'
                      : `${senderColor?.bg || 'bg-ink-50'} ${senderColor?.border || 'border-ink-100'} rounded-xl rounded-tl-sm`
                  }`}
                >
                  {/* Sender name (only for non-owner) */}
                  {!isOwner && (
                    <p className={`text-[11px] font-semibold mb-0.5 ${senderColor?.name || 'text-ink-700'}`}>
                      {contactLabel(msg.from)}
                    </p>
                  )}
                  <p className="text-sm text-ink-700 whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </p>
                  {msg.timestamp && (
                    <p className={`text-[10px] mt-1 font-mono ${isOwner ? 'text-gold-600 text-right' : 'text-ink-400'}`}>
                      {shortTimestamp(msg.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Cleaned content for unknown/fallback formats ---

function CleanedContent({ content, entities }: { content: string; entities?: EntityMatch[] }) {
  // Strip common forensic metadata noise
  const cleaned = content
    .replace(/Informe de la extracción[^\n]*/gi, '')
    .replace(/Archivo de origen:[\s\S]*?(?=\n\d|\n[A-Z]|\n$)/gm, '')
    .replace(/EXTRACTION_FFS\.zip[^\n]*/g, '')
    .replace(/Información de origen:[\s\S]*?(?=\n\d|\n[A-Z]|\n$)/gm, '')
    .replace(/\(Tabla:\s*\w+;[^)]*\)/g, '')
    .replace(/\(Tamaño:\s*\d+\s*bytes\)/g, '')
    .replace(/0x[0-9A-Fa-f]+/g, '')
    .replace(/@s\.whatsapp\.net/g, '')
    .replace(/\(UTC[^)]*\)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!cleaned || cleaned.length < 10) {
    return <p className="text-ink-300 italic text-sm">Contenido no disponible en formato legible.</p>
  }

  if (entities && entities.length > 0) {
    return (
      <div className="whitespace-pre-wrap">
        <EntityHighlighter text={cleaned} entities={entities} />
      </div>
    )
  }

  return <div className="whitespace-pre-wrap">{cleaned}</div>
}

// --- Main component ---

export function ForensicContent({ content, docType, entities }: ForensicContentProps) {
  const parsed = useMemo(() => parseForensicContent(content, docType), [content, docType])

  if (parsed.format === 'llamadas') {
    if (parsed.calls.length === 0) {
      return <CleanedContent content={content} entities={entities} />
    }
    return <LlamadasView calls={parsed.calls} />
  }

  if (parsed.format === 'conversacion') {
    if (parsed.conversation.messages.length === 0) {
      return <CleanedContent content={content} entities={entities} />
    }
    return <ConversacionView conversation={parsed} />
  }

  // Unknown format: clean and show
  return (
    <div className="prose prose-sm max-w-none text-ink-700 leading-relaxed">
      <CleanedContent content={content} entities={entities} />
    </div>
  )
}
