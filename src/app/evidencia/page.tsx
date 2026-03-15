import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Document } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Evidencia clave — Archivo Libra',
  description: 'Los documentos mas relevantes del caso $LIBRA: contratos, comunicaciones, llamadas y audios del expediente judicial.',
}

const EVIDENCE = {
  acuerdos: [
    'cd0f9098-b592-4d10-bddd-3ac3625d496c',
    '582e2f26-9489-46f0-98cd-f16a2cc6911a',
    '9cb61600-6b44-4edf-a2e5-fe0d3ceed0f6',
    '4ce27c3c-c667-4ffd-ae11-3eddce1a541d',
  ],
  milei: [
    '6ffaa03d-fb43-47f7-a622-6cd65ce6a8bd',
    '97392ff3-e42d-4f44-b745-57f98a4490e9',
    '285d343d-1cc2-4849-ad59-958bc7d82a9c',
    'b95da43c-849e-4f0a-9e67-491d78191086',
  ],
  noche: [
    '76c13e9b-321e-4405-8db3-3daa2963d90c',
    '03593ae9-14a0-4bf6-a02e-5b285f3e173b',
  ],
  audios: [
    'f1679687-32fe-4bbe-846f-62f787ae2dbb',
    '424aab0a-a0d4-4029-91d8-638c1d734d6e',
    '59c1c807-c415-42ae-ad52-6df0f0b7c701',
    '7be91e14-4904-47ed-a606-87cd101838e9',
    '173d809b-b00c-4fac-be98-8bc13fbf7a30',
  ],
  proyecto: [
    '5aba3023-d68e-4d9d-b659-7a6917d2bb91',
    '099b6326-f243-461f-a3ed-815512c76660',
    '27aa86b9-5a7f-4769-be21-cba25a3b20ee',
    '9918ed9d-e94e-4868-a09e-31ad796636fa',
  ],
}

const ALL_IDS = Object.values(EVIDENCE).flat()
const AUDIO_IDS = new Set(EVIDENCE.audios)

const SECTIONS: {
  key: keyof typeof EVIDENCE
  title: string
  context: string
}[] = [
  {
    key: 'acuerdos',
    title: 'El acuerdo con el presidente',
    context:
      'El 29 de enero de 2025 \u2014 dos semanas antes del lanzamiento del token \u2014 Hayden Davis, CEO de Kelsier Ventures, envi\u00f3 una carta de intenci\u00f3n al presidente Javier Milei ofreciendo asesoramiento \u00abad honorem\u00bb en blockchain. En los dispositivos secuestrados tambi\u00e9n se encontr\u00f3 una presentaci\u00f3n de un proyecto de moneda de oro dirigida al presidente.',
  },
  {
    key: 'milei',
    title: 'Comunicaciones con los Milei',
    context:
      'Los chats extra\u00eddos de los celulares secuestrados muestran comunicaciones directas entre Mauricio Novelli y Javier Milei, as\u00ed como con Karina Milei a trav\u00e9s de su cuenta identificada como \u00abKARINA MILEI RRPP\u00bb. Las conversaciones son previas e inmediatamente posteriores al lanzamiento del token.',
  },
  {
    key: 'noche',
    title: 'La noche del 14 de febrero',
    context:
      'El peritaje del DATIP revel\u00f3 206 llamadas telef\u00f3nicas la noche del lanzamiento, conectando la residencia presidencial de Olivos (Buenos Aires) con Dallas (Texas, EEUU) y Singapur. Santiago Caputo, asesor presidencial, realiz\u00f3 9 llamadas.',
  },
  {
    key: 'audios',
    title: 'Los audios',
    context:
      'Los celulares secuestrados conten\u00edan notas de voz de WhatsApp que revelan la din\u00e1mica interna del grupo. En estos audios se discuten pagos, se menciona al presidente y se negocian acuerdos.',
  },
  {
    key: 'proyecto',
    title: 'La red y el proyecto',
    context:
      'La investigaci\u00f3n revel\u00f3 una red de empresas y personas que conectaba al entorno presidencial con operadores crypto internacionales. Se encontraron borradores de acuerdos comerciales, proyectos de monedas de oro, y negociaciones de montos millonarios en d\u00f3lares.',
  },
]

const TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  conversacion: { label: 'Chat', color: 'text-blue-500', bgColor: 'bg-blue-50' },
  llamadas: { label: 'Llamadas', color: 'text-green-600', bgColor: 'bg-green-50' },
  audio: { label: 'Audio', color: 'text-purple-500', bgColor: 'bg-purple-50' },
  transcripcion: { label: 'Transcripcion', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  imagen: { label: 'Imagen', color: 'text-pink-500', bgColor: 'bg-pink-50' },
  pdf: { label: 'PDF', color: 'text-red-500', bgColor: 'bg-red-50' },
  documento: { label: 'Documento', color: 'text-ink-500', bgColor: 'bg-ink-50' },
  rrss: { label: 'Red social', color: 'text-cyan-500', bgColor: 'bg-cyan-50' },
  forense: { label: 'Forense', color: 'text-orange-500', bgColor: 'bg-orange-50' },
  planilla: { label: 'Planilla', color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
  presentacion: { label: 'Presentacion', color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
  texto: { label: 'Texto', color: 'text-ink-400', bgColor: 'bg-ink-50' },
  otro: { label: 'Otro', color: 'text-ink-400', bgColor: 'bg-ink-50' },
}

function getTypeConfig(docType: string) {
  return TYPE_CONFIG[docType] || TYPE_CONFIG.otro
}

function TypeIcon({ docType }: { docType: string }) {
  const props = { className: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 }

  switch (docType) {
    case 'conversacion':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    case 'llamadas':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
      )
    case 'audio':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      )
    case 'presentacion':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
        </svg>
      )
    case 'pdf':
    case 'documento':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    case 'forense':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      )
    default:
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
  }
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function truncateTranscription(text: string, maxLength = 280): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...'
}

function EvidenceCard({ doc, showTranscription }: { doc: Document; showTranscription?: boolean }) {
  const config = getTypeConfig(doc.doc_type)
  const date = formatDate(doc.date)

  return (
    <Link
      href={`/documento/${doc.id}`}
      className="block bg-white rounded-xl border border-ink-200 p-4 hover:border-gold-400 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 mt-0.5 ${config.color}`}>
          <TypeIcon docType={doc.doc_type} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-ink-900 group-hover:text-ink-950 leading-snug">
            {doc.title || 'Sin titulo'}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {date && (
              <span className="text-[11px] text-ink-400 font-mono">{date}</span>
            )}
            <span className={`text-[10px] font-medium ${config.color} ${config.bgColor} border border-current/20 rounded px-1.5 py-0.5`}>
              {config.label}
            </span>
          </div>
        </div>
        <svg className="w-4 h-4 text-ink-300 group-hover:text-gold-500 shrink-0 mt-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
      {showTranscription && doc.content && (
        <blockquote className="mt-3 pl-4 border-l-2 border-ink-200 text-xs text-ink-500 italic leading-relaxed">
          {truncateTranscription(doc.content)}
        </blockquote>
      )}
    </Link>
  )
}

export default async function EvidenciaPage() {
  const supabase = createClient()

  const { data: docs } = await supabase
    .from('documents')
    .select('id, title, doc_type, date, participants, tags, content, file_path, file_size, page_count, ocr_status, duration_seconds, audio_format, created_at')
    .in('id', ALL_IDS)

  const docsMap = new Map<string, Document>()
  if (docs) {
    for (const doc of docs) {
      docsMap.set(doc.id, doc as Document)
    }
  }

  function getDocsForSection(ids: string[]): Document[] {
    return ids.map((id) => docsMap.get(id)).filter(Boolean) as Document[]
  }

  return (
    <div>
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-24 pb-14 text-center">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink-950 mb-4 leading-[1.1]">
          Evidencia clave
        </h1>
        <p className="text-lg text-ink-500 max-w-xl mx-auto leading-relaxed">
          Los documentos mas relevantes del expediente, organizados por linea de investigacion.
          Cada pieza de evidencia enlaza al documento original completo.
        </p>
      </section>

      {/* Sections */}
      {SECTIONS.map((section, i) => {
        const sectionDocs = getDocsForSection(EVIDENCE[section.key])
        const isAudios = section.key === 'audios'

        return (
          <section key={section.key} className="max-w-3xl mx-auto px-4 pb-14">
            {/* Section number + title */}
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-xs font-mono text-gold-600 bg-gold-50 border border-gold-200 rounded px-2 py-0.5 shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2 className="font-serif text-2xl font-bold text-ink-950">
                {section.title}
              </h2>
            </div>

            {/* Context paragraph */}
            <p className="text-sm text-ink-600 leading-relaxed mb-5 border-l-4 border-gold-400 pl-4">
              {section.context}
            </p>

            {/* Document cards */}
            <div className="grid gap-3">
              {sectionDocs.map((doc) => (
                <EvidenceCard
                  key={doc.id}
                  doc={doc}
                  showTranscription={isAudios}
                />
              ))}
              {sectionDocs.length === 0 && (
                <p className="text-sm text-ink-400 italic">Documentos no disponibles.</p>
              )}
            </div>
          </section>
        )
      })}

      {/* CTAs */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <div className="border-t border-ink-200 pt-10 flex gap-4 justify-center flex-wrap">
          <Link
            href="/explorador"
            className="bg-ink-950 text-white px-8 py-3.5 rounded-lg hover:bg-ink-800 transition-colors font-medium"
          >
            Explora todos los documentos
          </Link>
          <Link
            href="/chat"
            className="border border-ink-300 text-ink-700 px-8 py-3.5 rounded-lg hover:border-ink-500 hover:text-ink-950 transition-colors"
          >
            Preguntale al asistente
          </Link>
          <Link
            href="/red"
            className="border border-ink-300 text-ink-700 px-8 py-3.5 rounded-lg hover:border-ink-500 hover:text-ink-950 transition-colors"
          >
            Red de conexiones
          </Link>
          <Link
            href="/historia"
            className="border border-ink-300 text-ink-700 px-8 py-3.5 rounded-lg hover:border-ink-500 hover:text-ink-950 transition-colors"
          >
            Historia del caso
          </Link>
        </div>
      </section>
    </div>
  )
}
