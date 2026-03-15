// Parser for Cellebrite UFED forensic extraction formats
// Handles two variants:
//   1. PDF-extracted text (garbled line breaks, concatenated fields)
//   2. Clean txt exports (separator lines, structured fields)

export type ForensicFormat = 'llamadas' | 'conversacion' | 'unknown'

export interface ParsedContact {
  phone: string
  name: string | null
}

export interface ParsedCall {
  from: ParsedContact
  to: ParsedContact | null
  direction: 'entrante' | 'saliente'
  timestamp: string | null
  duration: string | null
  status: 'respondido' | 'perdidas' | 'no respondido' | 'desconocido'
  source: string | null
  isVideo: boolean
}

export interface ParsedMessage {
  from: ParsedContact
  timestamp: string | null
  content: string
  type: 'message' | 'call' | 'system'
}

export interface ParsedConversation {
  participants: ParsedContact[]
  messages: ParsedMessage[]
  dateRange: { start: string | null; end: string | null }
}

export type ParseResult =
  | { format: 'llamadas'; calls: ParsedCall[] }
  | { format: 'conversacion'; conversation: ParsedConversation }
  | { format: 'unknown'; raw: string }

// --- Helpers ---

function cleanContactRaw(raw: string): string {
  return raw
    .replace(/\(owner\)/gi, '')
    .replace(/\(propietario\)/gi, '')
    .replace(/\*/g, '')
    .trim()
}

export function parseContact(raw: string): ParsedContact {
  const cleaned = cleanContactRaw(raw)

  const waMatch = cleaned.match(/(\d+)@s\.whatsapp\.net\s*(.*)/)
  if (waMatch) {
    return {
      phone: '+' + waMatch[1],
      name: waMatch[2].trim() || null,
    }
  }

  const phoneMatch = cleaned.match(/^(\+?\d[\d\s-]{7,})\s+(.+)$/)
  if (phoneMatch) {
    return {
      phone: phoneMatch[1].trim(),
      name: phoneMatch[2].trim() || null,
    }
  }

  const justPhone = cleaned.match(/^(\+?\d[\d\s-]{7,})$/)
  if (justPhone) {
    return { phone: justPhone[1].trim(), name: null }
  }

  // Clean up WhatsApp JIDs that weren't caught by the main regex
  if (cleaned.includes('@s.whatsapp.net')) {
    const parts = cleaned.split('@s.whatsapp.net')
    const phone = parts[0].replace(/\D/g, '')
    const name = (parts[1] || '').trim()
    return { phone: phone ? '+' + phone : 'desconocido', name: name || null }
  }

  return { phone: cleaned, name: null }
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '')
  // Argentine mobile: 5491141967152 → +54 9 11 4196-7152
  const arMatch = digits.match(/^54(9)(\d{2})(\d{4})(\d{4})$/)
  if (arMatch) {
    return `+54 9 ${arMatch[2]} ${arMatch[3]}-${arMatch[4]}`
  }
  // Argentine landline: 541141967152
  const arLand = digits.match(/^54(\d{2})(\d{4})(\d{4})$/)
  if (arLand) {
    return `+54 ${arLand[1]} ${arLand[2]}-${arLand[3]}`
  }
  // International: group in chunks
  if (digits.length >= 10) {
    return '+' + digits.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1 $2 $3 $4')
  }
  return phone
}

export function contactLabel(c: ParsedContact): string {
  if (c.name) return c.name
  if (c.phone === 'desconocido') return 'Contacto desconocido'
  return formatPhone(c.phone)
}

// --- Format detection ---

export function detectFormat(content: string, docType: string): ForensicFormat {
  if (docType === 'llamadas') return 'llamadas'
  if (docType === 'conversacion') return 'conversacion'
  if (/Reg\.\s*llamadas/i.test(content)) return 'llamadas'
  if (/-----------------------------/.test(content) && /Marca de hora:/i.test(content)) return 'conversacion'
  if (/Conversación\s*-\s*Mensajes instantáneos/i.test(content)) return 'conversacion'
  return 'unknown'
}

// --- Normalization for garbled PDF text ---

function normalizePdfText(raw: string): string {
  let text = raw
  text = text.replace(/@s\.wha\s*\n\s*tsapp\.net/g, '@s.whatsapp.net')
  text = text.replace(/Respondi\s*\n\s*do\b/gi, 'Respondido')
  text = text.replace(/Desconoc\s*\n\s*ido\b/gi, 'Desconocido')
  text = text.replace(/No\s*\n\s*respondid\s*\n?\s*o\b/gi, 'No respondido')
  text = text.replace(/(Saliente|Entrante)\s*(\d{1,2}\/)/gi, '$1 $2')
  text = text.replace(/(\(UTC[^)]*\))(\d{2}:\d{2}:\d{2})/g, '$1 $2')
  return text
}

// --- Llamadas parser ---

function parseLlamadas(content: string): ParsedCall[] {
  const normalized = normalizePdfText(content)
  const calls: ParsedCall[] = []

  const blocks = normalized.split(/(?=(?:^|\n)\s*\d+\s+(?:Para|De)\s*:)/m)

  for (const rawBlock of blocks) {
    if (!/\d+\s+(?:Para|De)\s*:/m.test(rawBlock)) continue

    const block = rawBlock.split(/Archivo de origen:/i)[0]

    const dirMatch = block.match(/Dirección:\s*(Entrante|Saliente)/i)
    const direction = dirMatch?.[1]?.toLowerCase() === 'saliente' ? 'saliente' : 'entrante'

    const jidMatches: RegExpExecArray[] = []
    const jidRe = /(\d{10,})@s\.whatsapp\.net\s*([\w\s]*)/g
    let jm: RegExpExecArray | null
    while ((jm = jidRe.exec(block)) !== null) jidMatches.push(jm)

    const phoneMatches: RegExpExecArray[] = []
    const phoneRe = /(\+\d{10,})\b\s*([\w\s]*)/g
    let pm: RegExpExecArray | null
    while ((pm = phoneRe.exec(block)) !== null) phoneMatches.push(pm)

    const cuentaMatch = block.match(/Cuenta:\s*(\d+)@s\.whatsapp\.net/i)
    const ownerJid = cuentaMatch?.[1]

    let otherContact: ParsedContact | null = null

    for (const m of jidMatches) {
      if (m[1] === ownerJid) continue
      const name = m[2]?.trim()
        .replace(/\s*(Dirección|Presidencia|Papelera).*$/i, '')
        .trim()
      otherContact = { phone: '+' + m[1], name: name || null }
      break
    }

    if (!otherContact) {
      for (const m of phoneMatches) {
        const name = m[2]?.trim().replace(/\s*\d{7,}.*$/, '').trim()
        otherContact = { phone: m[1], name: name || null }
        break
      }
    }

    if (otherContact && !otherContact.name) {
      const nameSection = block.match(/(?:Para|De):\s*[\s\S]*?(?=Dirección:)/i)
      if (nameSection) {
        const lines = nameSection[0].split('\n').map(l => l.trim()).filter(Boolean)
        for (const line of lines) {
          if (/^\d|^Para:|^De:|^Dirección/i.test(line)) continue
          if (/@|whatsapp/i.test(line)) continue
          if (line.length > 2 && line.length < 50) {
            otherContact.name = line
            break
          }
        }
      }
    }

    const from: ParsedContact = otherContact || { phone: 'desconocido', name: null }

    const tsMatch = block.match(/(?:Entrante|Saliente)\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*\n?\s*(\d{2}:\d{2}:\d{2})/)
    let timestamp: string | null = null
    if (tsMatch) {
      timestamp = `${tsMatch[1]} ${tsMatch[2].slice(0, 5)}`
    }

    const allTimes: RegExpExecArray[] = []
    const timeRe = /\b(\d{2}:\d{2}:\d{2})\b/g
    let tm: RegExpExecArray | null
    while ((tm = timeRe.exec(block)) !== null) allTimes.push(tm)

    let duration: string | null = null
    if (allTimes.length >= 2) {
      duration = allTimes[1][1]
    }

    let status: ParsedCall['status'] = 'desconocido'
    if (/\bRespondido\b/i.test(block)) status = 'respondido'
    else if (/\bPerdidas\b/i.test(block)) status = 'perdidas'
    else if (/\bNo\s*respondido?\b/i.test(block)) status = 'no respondido'

    let source: string | null = null
    if (/Origen:\s*WhatsApp/i.test(block)) source = 'WhatsApp'
    else if (/Origen:/i.test(block)) source = 'Teléfono'

    const isVideo = /Llamada de vídeo/i.test(block)

    calls.push({
      from,
      to: direction === 'saliente' ? from : null,
      direction,
      timestamp,
      duration,
      status,
      source,
      isVideo,
    })
  }

  return calls
}

// --- Conversacion parser ---

function isPdfConversation(content: string): boolean {
  return /Conversación\s*-\s*Mensajes instantáneos/i.test(content)
}

function parsePdfConversation(content: string): ParsedConversation {
  const normalized = normalizePdfText(content)
  const participants: ParsedContact[] = []

  // Extract participants from header
  const partSection = normalized.match(/Participantes\s*\n([\s\S]*?)(?=Conversación\s*-)/i)
  if (partSection) {
    const jids = partSection[1].match(/\d+@s\.whatsapp\.net\s*[^\n]*/g)
    if (jids) {
      for (const j of jids) {
        const c = parseContact(j.trim())
        if (!/propietario|owner/i.test(j)) participants.push(c)
      }
    }
  }

  // Split by "From:" blocks
  const msgBlocks = normalized.split(/(?=^From:\s)/m)
  const messages: ParsedMessage[] = []

  let dateRange = { start: null as string | null, end: null as string | null }

  // Extract date range from header
  const startMatch = normalized.match(/Hora de inicio:\s*(.+?)(?:\n|$)/i)
  const endMatch = normalized.match(/Actividad más reciente:\s*(.+?)(?:\n|$)/i)
  if (startMatch) dateRange.start = startMatch[1].replace(/\(UTC[^)]*\)/i, '').trim()
  if (endMatch) dateRange.end = endMatch[1].replace(/\(UTC[^)]*\)/i, '').trim()

  for (const block of msgBlocks) {
    const fromMatch = block.match(/^From:\s*(.+?)(?:\n|$)/im)
    if (!fromMatch) continue

    const from = parseContact(fromMatch[1])

    // Skip system messages
    if (/System Message/i.test(from.phone) || /System Message/i.test(from.name || '')) continue

    // Timestamp
    const tsMatch = block.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{2}:\d{2})/m)
    let timestamp: string | null = null
    if (tsMatch) timestamp = `${tsMatch[1]} ${tsMatch[2]}`

    // Detect call entries
    const isCall = /(?:Outgoing|Incoming)\s+call/i.test(block) || /(?:audio|video)\s+call/i.test(block)

    if (isCall) {
      const callStatus = /NotAnswered|Cancelado/i.test(block) ? 'perdida' : 'contestada'
      const callType = /video/i.test(block) ? 'videollamada' : 'llamada'
      messages.push({
        from,
        timestamp,
        content: `${callType} ${callStatus}`,
        type: 'call',
      })
      continue
    }

    // Extract message content - look for the actual text after metadata
    // In PDF format, the message text appears after delivery status lines
    let msgContent = ''
    const lines = block.split('\n')
    let foundContent = false
    const skipPatterns = /^(From:|To:|Estado:|Plataforma:|Información de origen:|EXTRAC|Participante|sapp\.net|\d+@s\.|Entregado|Leído|Reproducid)/i

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      if (skipPatterns.test(line)) continue
      if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line)) continue
      if (/^\(UTC/.test(line)) continue
      if (line.length < 2) continue

      // Likely actual content
      if (!foundContent) {
        foundContent = true
        msgContent = line
      } else {
        msgContent += '\n' + line
      }
    }

    if (!msgContent.trim()) continue

    messages.push({
      from,
      timestamp,
      content: msgContent.trim(),
      type: 'message',
    })
  }

  return { participants, messages, dateRange }
}

function parseTxtConversation(content: string): ParsedConversation {
  const participants: ParsedContact[] = []

  const participantsMatch = content.match(/Participantes?:\s*(.+?)(?:\n|$)/i)
  if (participantsMatch) {
    const raw = participantsMatch[1]
    const entries = raw.match(/\d+@s\.whatsapp\.net\s*[^,@]*/g)
    if (entries) {
      for (const entry of entries) {
        participants.push(parseContact(entry.trim()))
      }
    } else {
      for (const part of raw.split(',')) {
        if (part.trim()) participants.push(parseContact(part.trim()))
      }
    }
  }

  let dateRange = { start: null as string | null, end: null as string | null }
  const startMatch = content.match(/Hora de inicio:\s*(.+?)(?:\n|$)/i)
  const endMatch = content.match(/Actividad más reciente:\s*(.+?)(?:\n|$)/i)
  if (startMatch) dateRange.start = startMatch[1].replace(/\(UTC[^)]*\)/i, '').trim()
  if (endMatch) dateRange.end = endMatch[1].replace(/\(UTC[^)]*\)/i, '').trim()

  const blocks = content.split(/-----------------------------/)
  const messages: ParsedMessage[] = []

  for (const block of blocks) {
    const fromMatch = block.match(/From:\s*(.+?)(?:\n|$)/i)
    const timeMatch = block.match(/Marca de hora:\s*(.+?)(?:\n|$)/i)
    const contentMatch = block.match(/Contenido:\s*([\s\S]*?)$/i)

    if (!fromMatch && !contentMatch) continue

    const from = fromMatch ? parseContact(fromMatch[1]) : { phone: 'desconocido', name: null }

    // Skip system messages
    if (/System Message/i.test(from.phone) || /System Message/i.test(from.name || '')) continue

    let timestamp: string | null = null
    if (timeMatch) {
      const ts = timeMatch[1].replace(/\(UTC[^)]*\)/i, '').trim()
      const tsShort = ts.replace(/(\d{2}:\d{2}):\d{2}/, '$1')
      timestamp = tsShort
    }

    const msgContent = contentMatch ? contentMatch[1].trim() : ''
    if (!msgContent) continue

    // Detect inline call entries
    const isCall = /(?:Outgoing|Incoming)\s+call/i.test(msgContent)

    messages.push({
      from,
      timestamp,
      content: msgContent,
      type: isCall ? 'call' : 'message',
    })
  }

  return { participants, messages, dateRange }
}

function parseConversacion(content: string): ParsedConversation {
  if (isPdfConversation(content)) {
    return parsePdfConversation(content)
  }
  return parseTxtConversation(content)
}

// --- Main entry ---

export function parseForensicContent(content: string, docType: string): ParseResult {
  try {
    const format = detectFormat(content, docType)

    switch (format) {
      case 'llamadas':
        return { format: 'llamadas', calls: parseLlamadas(content) }
      case 'conversacion':
        return { format: 'conversacion', conversation: parseConversacion(content) }
      default:
        return { format: 'unknown', raw: content }
    }
  } catch {
    return { format: 'unknown', raw: content }
  }
}
