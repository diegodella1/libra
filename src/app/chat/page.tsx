'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { ChatEntry, ChatResponse } from '@/lib/types'

const SUGGESTED_PROMPTS = [
  '¿Qué llamadas hubo la noche del 14 de febrero?',
  '¿Cuál es la conexión entre Milei y Hayden Davis?',
  '¿Qué dice el peritaje de DATIP sobre las llamadas?',
  '¿Quién es Diógenes Casares y qué reveló sobre las coimas?',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatEntry[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function autoResize() {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = '48px'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg = text.trim()

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = '48px'

    const newMessages: ChatEntry[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: newMessages.slice(-10).map(({ role, content }) => ({ role, content })),
        }),
      })

      const data: ChatResponse = await res.json()

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply, sources: data.sources },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error al consultar el asistente.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Conversation area */}
      <div className="flex-1 overflow-y-auto chat-messages">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <h1 className="font-serif text-3xl sm:text-4xl text-ink-950 mb-2">
              Asistente Libra
            </h1>
            <p className="text-ink-400 text-sm mb-10">
              Preguntame sobre los documentos de la causa
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-sm text-ink-600 border border-ink-200 rounded-xl px-4 py-3 hover:border-gold-400 hover:bg-gold-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gold-50 border border-gold-200 rounded-br-sm ml-auto max-w-[80%]'
                      : 'bg-white border border-ink-200 rounded-bl-sm mr-auto max-w-[80%]'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 mr-auto max-w-[80%]">
                    {msg.sources.map((src) => (
                      <Link
                        key={src.id}
                        href={`/documento/${src.id}`}
                        className="inline-flex items-center gap-1 rounded-full text-xs bg-ink-50 border border-ink-200 px-2.5 py-1 text-ink-600 hover:border-gold-400 hover:text-gold-800 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {src.title || 'Documento'}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="mr-auto max-w-[80%] flex items-center gap-1 px-4 py-3 text-ink-400">
                <span className="w-1.5 h-1.5 bg-ink-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-ink-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-ink-400 rounded-full animate-bounce" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-ink-200 bg-white/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              autoResize()
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tu consulta..."
            disabled={loading}
            rows={1}
            className="chat-input flex-1 border border-ink-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-white placeholder:text-ink-300 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="self-end bg-ink-950 text-white px-4 py-3 rounded-xl hover:bg-ink-800 disabled:opacity-50 transition-colors"
            aria-label="Enviar mensaje"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
