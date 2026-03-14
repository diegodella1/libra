'use client'

interface DocumentViewerProps {
  filePath: string
  content: string | null
  docType: string
}

const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL || 'http://192.168.1.14:8080/documents'

export function DocumentViewer({ filePath, content, docType }: DocumentViewerProps) {
  const fileUrl = `${DOCS_URL}/${filePath}`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Original */}
      <div className="bg-white rounded-xl border border-libra-200 overflow-hidden">
        <div className="px-4 py-2 bg-libra-100 text-sm font-medium text-libra-700 border-b border-libra-200">
          Documento original
        </div>
        <div className="p-4">
          {docType === 'imagen' ? (
            <img
              src={fileUrl}
              alt="Documento original"
              className="w-full rounded"
            />
          ) : (
            <iframe
              src={fileUrl}
              className="w-full h-[80vh] rounded"
              title="Documento original"
            />
          )}
        </div>
      </div>

      {/* Transcripción */}
      <div className="bg-white rounded-xl border border-libra-200 overflow-hidden">
        <div className="px-4 py-2 bg-libra-100 text-sm font-medium text-libra-700 border-b border-libra-200">
          Transcripción
        </div>
        <div className="p-4 overflow-y-auto max-h-[80vh]">
          {content ? (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-libra-800">
              {content}
            </div>
          ) : (
            <p className="text-libra-400 italic">
              Transcripción no disponible para este documento.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
