'use client'

import { useState, useRef, useEffect } from 'react'
import type { ChatMessage, ChatResponse } from '@/lib/types'

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10),
        }),
      })

      const data: ChatResponse = await res.json()

      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-libra-950 text-libra-50 w-14 h-14 rounded-full shadow-lg hover:bg-libra-800 transition-colors flex items-center justify-center text-xl"
        aria-label="Abrir asistente"
      >
        ?
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-libra-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-libra-950 text-libra-50 flex items-center justify-between">
        <span className="font-medium text-sm">Asistente Libra</span>
        <button
          onClick={() => setOpen(false)}
          className="text-libra-300 hover:text-white text-lg"
        >
          x
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-libra-400 text-center mt-8">
            Preguntame sobre los documentos del archivo.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm rounded-lg px-3 py-2 max-w-[85%] ${
              msg.role === 'user'
                ? 'bg-libra-100 text-libra-900 ml-auto'
                : 'bg-libra-50 text-libra-800 border border-libra-200'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="text-sm text-libra-400 animate-pulse">Buscando...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="p-3 border-t border-libra-200 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hacé tu consulta..."
          className="flex-1 text-sm border border-libra-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-libra-400"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-libra-950 text-libra-50 px-4 py-2 rounded-lg text-sm hover:bg-libra-800 disabled:opacity-50 transition-colors"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
