import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { SYSTEM_PROMPT } from '@/lib/prompts'
import { createHash } from 'crypto'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Known persons for direct lookup
const KNOWN_PERSONS = [
  'Javier Milei', 'Karina Milei', 'Manuel Terrones Godoy', 'Manu Terrones',
  'Sergio Daniel Morales', 'Sergio Morales', 'Hayden Mark Davis', 'Hayden Davis',
  'Mauricio Novelli', 'Novelli', 'Julian Peh', 'Charles Hoskinson',
  'Santiago Caputo', 'Milei', 'Terrones', 'Davis', 'Morales', 'Peh', 'Hoskinson',
]

// Simple in-memory rate limiting by IP
const rateLimiter = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimiter.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!OPENAI_API_KEY) return null

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.data?.[0]?.embedding || null
  } catch {
    return null
  }
}

function findMentionedPerson(message: string): string | null {
  const msgLower = message.toLowerCase()
  // Sort by length desc so "Manuel Terrones Godoy" matches before "Terrones"
  const sorted = [...KNOWN_PERSONS].sort((a, b) => b.length - a.length)
  for (const name of sorted) {
    if (msgLower.includes(name.toLowerCase())) return name
  }
  return null
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Demasiadas consultas. Esperá un minuto.' },
      { status: 429 }
    )
  }

  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: 'Chat no configurado' },
      { status: 503 }
    )
  }

  const { message, history = [] } = await request.json()

  if (!message || typeof message !== 'string' || message.length > 1000) {
    return NextResponse.json(
      { error: 'Mensaje inválido' },
      { status: 400 }
    )
  }

  const supabase = createClient()

  // 1. Check if query mentions a known person → direct lookup
  const mentionedPerson = findMentionedPerson(message)
  let personResults: any[] = []

  if (mentionedPerson) {
    const { data } = await supabase.rpc('person_documents', {
      person_query: mentionedPerson,
      max_results: 10,
    })
    personResults = data || []
  }

  // 2. Run both hybrid search AND FTS search in parallel for best coverage
  const embedding = await generateEmbedding(message)

  const [hybridRes, ftsRes] = await Promise.all([
    embedding
      ? supabase.rpc('hybrid_search', {
          query_text: message,
          query_embedding: JSON.stringify(embedding),
          max_results: 8,
        })
      : Promise.resolve({ data: [] }),
    supabase.rpc('search_documents', {
      query: message,
      max_results: 8,
    }),
  ])

  const searchResults: any[] = [...(hybridRes.data || []), ...(ftsRes.data || [])]

  // 3. Merge person results + search results, deduplicate by id
  const seenIds = new Set<string>()
  const allResults: any[] = []

  // Person docs first (most relevant for person queries)
  for (const doc of personResults) {
    if (!seenIds.has(doc.id)) {
      seenIds.add(doc.id)
      allResults.push(doc)
    }
  }
  for (const doc of searchResults) {
    if (!seenIds.has(doc.id)) {
      seenIds.add(doc.id)
      allResults.push(doc)
    }
  }

  // 4. Build context
  const context = allResults
    .slice(0, 15)
    .map((doc: any) => {
      const content = doc.chunk_content || doc.snippet || ''
      const parts = [`[${doc.title || 'Sin título'}, tipo: ${doc.doc_type}, ${doc.date || 'sin fecha'}, ID: ${doc.id}]`]
      if (doc.participants && doc.participants.length > 0) {
        parts.push(`Participantes: ${doc.participants.join(', ')}`)
      }
      parts.push(content)
      return parts.join('\n')
    })
    .join('\n\n---\n\n')

  // 5. Call LLM with context
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(context
      ? [{ role: 'system', content: `Documentos relevantes encontrados:\n\n${context}` }]
      : []),
    ...history.slice(-10),
    { role: 'user', content: message },
  ]

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages,
        max_tokens: 1500,
        temperature: 0.3,
      }),
    })

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'No pude generar una respuesta.'

    // Fire-and-forget query log
    Promise.resolve(supabase.from('query_log').insert({
      type: 'chat',
      query: message,
      results_count: allResults.length,
      ip_hash: createHash('sha256').update(ip).digest('hex').slice(0, 16),
      response_time_ms: Date.now() - startTime,
    })).catch(() => {})

    return NextResponse.json({
      reply,
      sources: allResults.slice(0, 10).map((r: any) => ({
        id: r.id,
        title: r.title,
        date: r.date,
      })),
    })
  } catch (err) {
    console.error('Chat LLM error:', err)
    return NextResponse.json(
      { error: 'Error al consultar el asistente' },
      { status: 500 }
    )
  }
}
