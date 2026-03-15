'use client'

const TYPE_COLORS: Record<string, string> = {
  conversacion: 'border-blue-300 text-blue-600 bg-blue-50',
  llamadas: 'border-green-300 text-green-600 bg-green-50',
  audio: 'border-purple-300 text-purple-600 bg-purple-50',
  imagen: 'border-pink-300 text-pink-600 bg-pink-50',
  pdf: 'border-red-300 text-red-600 bg-red-50',
  documento: 'border-ink-300 text-ink-600 bg-ink-50',
  rrss: 'border-cyan-300 text-cyan-600 bg-cyan-50',
  forense: 'border-orange-300 text-orange-600 bg-orange-50',
  planilla: 'border-emerald-300 text-emerald-600 bg-emerald-50',
  texto: 'border-ink-200 text-ink-500 bg-ink-50',
}

const TYPE_LABELS: Record<string, string> = {
  conversacion: 'Chat',
  llamadas: 'Llamadas',
  audio: 'Audio',
  imagen: 'Imagen',
  pdf: 'PDF',
  documento: 'Documento',
  rrss: 'Red social',
  forense: 'Forense',
  planilla: 'Planilla',
  presentacion: 'Presentacion',
  texto: 'Texto',
  otro: 'Otro',
}

export function DocumentTypeBadge({ type }: { type: string }) {
  const colors = TYPE_COLORS[type] || 'border-ink-200 text-ink-500 bg-ink-50'
  const label = TYPE_LABELS[type] || type

  return (
    <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${colors}`}>
      {label}
    </span>
  )
}
