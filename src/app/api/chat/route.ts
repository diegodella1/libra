import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { SYSTEM_PROMPT } from '@/lib/prompts'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Simple in-memory rate limiting by IP
const rateLimiter = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10 // requests per window
const RATE_WINDOW = 60_000 // 1 minute

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

export async function POST(request: NextRequest) {
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

  // 1. Generate embedding for user query (for semantic search)
  // TODO: implement embedding generation
  // For now, fall back to FTS
  const { data: searchResults } = await supabase.rpc('search_documents', {
    query: message,
    max_results: 5,
  })

  // 2. Build context from search results
  const context = (searchResults || [])
    .map((doc: any) => `[${doc.title}, ${doc.date}]\n${doc.snippet}`)
    .join('\n\n---\n\n')

  // 3. Call LLM with context
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(context
      ? [{ role: 'system', content: `Documentos relevantes encontrados:\n\n${context}` }]
      : []),
    ...history.slice(-10), // last 10 messages
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
        max_tokens: 1000,
        temperature: 0.3,
      }),
    })

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'No pude generar una respuesta.'

    return NextResponse.json({
      reply,
      sources: searchResults?.map((r: any) => ({
        id: r.id,
        title: r.title,
        date: r.date,
      })) || [],
    })
  } catch (err) {
    console.error('Chat LLM error:', err)
    return NextResponse.json(
      { error: 'Error al consultar el asistente' },
      { status: 500 }
    )
  }
}
