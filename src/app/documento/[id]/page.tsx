import { DocumentViewer } from '@/components/DocumentViewer'
import { createClient } from '@/lib/supabase'

interface Props {
  params: { id: string }
}

export default async function DocumentoPage({ params }: Props) {
  const supabase = createClient()
  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !doc) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-serif text-libra-950">Documento no encontrado</h1>
        <p className="text-libra-500 mt-2">El documento solicitado no existe o fue removido.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header del documento */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-libra-950">
          {doc.title || 'Sin título'}
        </h1>
        <div className="flex gap-4 mt-2 text-sm text-libra-500">
          {doc.date && <span>{new Date(doc.date).toLocaleDateString('es-AR')}</span>}
          <span className="capitalize">{doc.doc_type}</span>
          {doc.participants?.length > 0 && (
            <span>{doc.participants.join(', ')}</span>
          )}
        </div>
      </div>

      {/* Visor: original + transcripción lado a lado */}
      <DocumentViewer
        filePath={doc.file_path}
        content={doc.content}
        docType={doc.doc_type}
      />
    </div>
  )
}
