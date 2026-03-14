'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface DocDetail {
  id: string
  title: string | null
  doc_type: string
  date: string | null
  participants: string[]
  tags: string[]
  content: string | null
  file_path: string
}

export default function AdminEditDocPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [doc, setDoc] = useState<DocDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('otro')
  const [date, setDate] = useState('')
  const [participants, setParticipants] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    fetch(`/api/admin/documents/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setDoc(data)
        setTitle(data.title || '')
        setDocType(data.doc_type || 'otro')
        setDate(data.date || '')
        setParticipants((data.participants || []).join(', '))
        setTags((data.tags || []).join(', '))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const res = await fetch(`/api/admin/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title || null,
        doc_type: docType,
        date: date || null,
        participants: participants ? participants.split(',').map((s) => s.trim()).filter(Boolean) : [],
        tags: tags ? tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Error al guardar')
    } else {
      setSuccess(true)
    }
    setSaving(false)
  }

  if (loading) return <p className="text-ink-500 text-sm py-8">Cargando...</p>
  if (!doc) return <p className="text-red-600 text-sm py-8">Documento no encontrado</p>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/admin/documentos')} className="text-ink-400 hover:text-ink-700 text-sm">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-ink-900">Editar documento</h1>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-ink-200 p-6 max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gold-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Tipo</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gold-400 bg-white"
            >
              <option value="transcripcion">Transcripción</option>
              <option value="imagen">Imagen</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Participantes (separados por coma)</label>
          <input
            type="text"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            placeholder="Nombre 1, Nombre 2"
            className="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gold-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Tags (separados por coma)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tag1, tag2"
            className="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gold-400"
          />
        </div>

        <div className="text-xs text-ink-400">
          Archivo: <span className="font-mono">{doc.file_path}</span>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        {success && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">Guardado correctamente</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-ink-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
