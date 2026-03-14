'use client'

import { useEffect, useState } from 'react'

interface HealthCheck {
  ok: boolean
  latency?: number
  error?: string
}

export default function AdminConfigPage() {
  const [systemPrompt, setSystemPrompt] = useState('')
  const [suggestedPrompts, setSuggestedPrompts] = useState('')
  const [health, setHealth] = useState<Record<string, HealthCheck> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/config').then((r) => r.json()),
      fetch('/api/admin/health').then((r) => r.json()),
    ])
      .then(([config, healthData]) => {
        setSystemPrompt(config.system_prompt || '')
        setSuggestedPrompts(
          Array.isArray(config.suggested_prompts)
            ? config.suggested_prompts.join('\n')
            : ''
        )
        setHealth(healthData.checks || null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function saveConfig(key: string, value: unknown) {
    setSaving(true)
    setSuccess('')
    const res = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    if (res.ok) setSuccess(`"${key}" guardado`)
    setSaving(false)
  }

  if (loading) return <p className="text-ink-500 text-sm py-8">Cargando...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-6">Configuración</h1>

      {/* Health status */}
      <div className="bg-white rounded-xl border border-ink-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-ink-700 mb-3">Estado de servicios</h2>
        {health ? (
          <div className="space-y-2">
            {Object.entries(health).map(([name, check]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${check.ok ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-ink-700 capitalize">{name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {check.latency && (
                    <span className="text-xs text-ink-400 font-mono">{check.latency}ms</span>
                  )}
                  {check.error && (
                    <span className="text-xs text-red-500 truncate max-w-xs">{check.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-400">No disponible</p>
        )}
      </div>

      {/* System prompt */}
      <div className="bg-white rounded-xl border border-ink-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-ink-700 mb-3">System prompt (override)</h2>
        <p className="text-xs text-ink-400 mb-2">
          Si está vacío, se usa el prompt por defecto hardcodeado. Acá podés poner un override.
        </p>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-gold-400 resize-y"
          placeholder="Dejá vacío para usar el prompt por defecto..."
        />
        <button
          onClick={() => saveConfig('system_prompt', systemPrompt || null)}
          disabled={saving}
          className="mt-2 bg-ink-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
        >
          Guardar prompt
        </button>
      </div>

      {/* Suggested prompts */}
      <div className="bg-white rounded-xl border border-ink-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-ink-700 mb-3">Prompts sugeridos</h2>
        <p className="text-xs text-ink-400 mb-2">Uno por línea. Se muestran como chips en el chat.</p>
        <textarea
          value={suggestedPrompts}
          onChange={(e) => setSuggestedPrompts(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gold-400 resize-y"
          placeholder="¿Qué pasó el 14 de febrero?&#10;¿Quiénes participaron de las llamadas?"
        />
        <button
          onClick={() => saveConfig('suggested_prompts', suggestedPrompts.split('\n').filter(Boolean))}
          disabled={saving}
          className="mt-2 bg-ink-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
        >
          Guardar prompts
        </button>
      </div>

      {success && (
        <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg inline-block">{success}</p>
      )}
    </div>
  )
}
