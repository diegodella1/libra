'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminSubirDocPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // Metadata
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('otro')
  const [date, setDate] = useState('')
  const [participants, setParticipants] = useState('')
  const [tags, setTags] = useState('')

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Seleccioná un archivo'); return }
    if (!title.trim()) { setError('El título es requerido'); return }

    setError('')
    setUploading(true)

    try {
      // 1. Upload file
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) {
        const data = await uploadRes.json()
        setError(data.error || 'Error al subir archivo')
        return
      }

      const { file_path, file_size } = await uploadRes.json()

      // 2. Create document record
      const docRes = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          doc_type: docType,
          date: date || null,
          participants: participants ? participants.split(',').map((s) => s.trim()).filter(Boolean) : [],
          tags: tags ? tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
          file_path,
        }),
      })

      if (!docRes.ok) {
        const data = await docRes.json()
        setError(data.error || 'Error al crear documento')
        return
      }

      router.push('/admin/documentos')
    } catch {
      setError('Error de conexión')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/admin/documentos')} className="text-ink-400 hover:text-ink-700 text-sm">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-ink-900">Subir documento</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-ink-200 p-6 max-w-2xl space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragging ? 'border-gold-400 bg-gold-50' : file ? 'border-green-300 bg-green-50' : 'border-ink-300 hover:border-ink-400'
          }`}
        >
          {file ? (
            <p className="text-sm text-green-700 font-medium">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>
          ) : (
            <p className="text-sm text-ink-400">Arrastrá un archivo o hacé click para seleccionar</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.tiff,.txt"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Título *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gold-400"
            required
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

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button
          type="submit"
          disabled={uploading}
          className="bg-ink-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Subiendo...' : 'Subir documento'}
        </button>
      </form>
    </div>
  )
}
