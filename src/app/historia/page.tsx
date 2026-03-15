import Link from 'next/link'
import type { Metadata } from 'next'
import { ScrollReveal } from '@/components/ScrollReveal'
import { PriceChart } from '@/components/PriceChart'
import { createClient } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'La historia — Archivo Libra',
  description: 'Cronologia del escandalo cripto $LIBRA: como un tuit presidencial genero la estafa mas grande en la historia de un mandatario en ejercicio.',
}

const KEY_DOC_IDS = [
  '5aba3023-d68e-4d9d-b659-7a6917d2bb91',
  '285d343d-1cc2-4849-ad59-958bc7d82a9c',
  '76c13e9b-321e-4405-8db3-3daa2963d90c',
  '6ffaa03d-fb43-47f7-a622-6cd65ce6a8bd',
]

const TYPE_LABELS: Record<string, string> = {
  conversacion: 'Conversacion',
  llamadas: 'Llamadas',
  audio: 'Audio',
  imagen: 'Imagen',
  pdf: 'PDF',
  documento: 'Documento',
  transcripcion: 'Transcripcion',
  rrss: 'Red social',
  forense: 'Forense',
  planilla: 'Planilla',
  presentacion: 'Presentacion',
  texto: 'Texto',
  otro: 'Otro',
}

export default async function HistoriaPage() {
  const supabase = createClient()
  const { data: docs } = await supabase
    .from('documents')
    .select('id, title, doc_type')
    .in('id', KEY_DOC_IDS)

  const keyDocs = docs || []

  return (
    <div className="py-16 space-y-24">
      {/* Section 1 — Hero */}
      <ScrollReveal className="max-w-3xl mx-auto px-4 text-center">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink-950 leading-tight">
          La historia del caso $LIBRA
        </h1>
        <p className="mt-4 text-lg text-ink-500 font-serif">
          14 de febrero de 2025 — Buenos Aires, Argentina
        </p>
        <p className="mt-2 text-sm text-ink-400">
          La estafa cripto mas grande en la historia de un presidente en ejercicio
        </p>
      </ScrollReveal>

      {/* Section 2 — El tuit */}
      <ScrollReveal className="max-w-3xl mx-auto px-4">
        <h2 className="font-serif text-2xl font-bold text-ink-950 mb-4">El tuit</h2>
        <blockquote className="border-l-4 border-gold-400 pl-4 py-2 bg-gold-50/40 rounded-r-lg">
          <p className="text-ink-700 text-sm leading-relaxed font-mono">
            &ldquo;Mundo crypto - El mundo de las criptomonedas. Private project to encourage the growth of the Argentine economy by incentivizing the funding of small Argentine enterprises and startups...&rdquo;
          </p>
          <p className="text-ink-500 text-sm font-mono mt-2">
            https://t.me/KelsierAI...
          </p>
        </blockquote>
        <p className="mt-4 text-ink-600 leading-relaxed">
          A las 21:07 del 14 de febrero, el presidente publica en X, Instagram y Facebook el codigo de contrato de un token llamado $LIBRA.
        </p>
      </ScrollReveal>

      {/* Section 3 — 40 minutos */}
      <ScrollReveal className="max-w-3xl mx-auto px-4">
        <h2 className="font-serif text-2xl font-bold text-ink-950 mb-4">40 minutos</h2>
        <p className="text-ink-600 leading-relaxed mb-6">
          En los siguientes 40 minutos, 44.000 billeteras compran el token. La capitalizacion llega a 4.500 millones de dolares.
        </p>
        <div className="bg-white border border-ink-200 rounded-xl p-4">
          <PriceChart />
        </div>
        <p className="text-xs text-ink-400 mt-2 text-center">
          El grafico muestra el precio del token $LIBRA durante las primeras 3 horas.
        </p>
      </ScrollReveal>

      {/* Section 4 — El crash */}
      <ScrollReveal className="max-w-3xl mx-auto px-4">
        <h2 className="font-serif text-2xl font-bold text-ink-950 mb-6">El crash</h2>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="text-center">
            <p className="font-mono text-3xl md:text-4xl font-bold text-gold-700">$100M+</p>
            <p className="text-sm text-ink-500 mt-1">extraidos por insiders</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-3xl md:text-4xl font-bold text-red-700">97%</p>
            <p className="text-sm text-ink-500 mt-1">de caida</p>
          </div>
        </div>
        <p className="text-ink-600 leading-relaxed">
          Los creadores del token controlaban el 70% del suministro. Vendieron masivamente durante la subida. 75.000 personas perdieron su inversion. Las perdidas estimadas alcanzan los 251 millones de dolares.
        </p>
      </ScrollReveal>

      {/* Section 5 — Las llamadas */}
      <ScrollReveal className="max-w-3xl mx-auto px-4">
        <h2 className="font-serif text-2xl font-bold text-ink-950 mb-4">La noche de las 206 llamadas</h2>
        <p className="text-ink-600 leading-relaxed mb-6">
          El peritaje del DATIP revelo 206 llamadas telefonicas esa noche, conectando tres puntos del planeta:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { city: 'Olivos, Buenos Aires', flag: 'AR' },
            { city: 'Dallas, Texas', flag: 'US' },
            { city: 'Singapur', flag: 'SG' },
          ].map(loc => (
            <div key={loc.city} className="text-center border border-ink-200 rounded-lg py-4 px-3 bg-white">
              <p className="font-serif font-bold text-ink-950">{loc.city}</p>
            </div>
          ))}
        </div>
        <p className="text-ink-600 leading-relaxed">
          Santiago Caputo, asesor presidencial, realizo 9 llamadas. Mauricio Novelli fue el nexo entre todos.
        </p>
      </ScrollReveal>

      {/* Section 6 — El acuerdo */}
      <ScrollReveal className="max-w-3xl mx-auto px-4">
        <h2 className="font-serif text-2xl font-bold text-ink-950 mb-4">El acuerdo confidencial</h2>
        <blockquote className="border-l-4 border-gold-400 pl-4 py-2 bg-gold-50/40 rounded-r-lg mb-4">
          <p className="text-ink-700 text-sm leading-relaxed">
            En los dispositivos se encontro un borrador de &ldquo;acuerdo confidencial&rdquo; entre Javier Milei y Hayden Davis, aparentemente firmado el 30 de enero de 2025 — dos semanas antes del lanzamiento.
          </p>
        </blockquote>
        <p className="text-ink-600 leading-relaxed">
          El presidente borro su posteo a medianoche y declaro que &ldquo;no conocia los detalles del proyecto&rdquo;.
        </p>
      </ScrollReveal>

      {/* Section 7 — Los documentos */}
      <ScrollReveal className="max-w-3xl mx-auto px-4">
        <h2 className="font-serif text-2xl font-bold text-ink-950 mb-2">Los documentos</h2>
        <p className="text-ink-600 leading-relaxed mb-6">
          Estos son algunos de los documentos clave del expediente. Todos son de acceso publico.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {keyDocs.map(doc => (
            <Link
              key={doc.id}
              href={`/documento/${doc.id}`}
              className="border border-ink-200 rounded-lg p-4 bg-white hover:border-gold-400 transition-colors group"
            >
              <span className="text-[10px] font-medium uppercase tracking-wide text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full">
                {TYPE_LABELS[doc.doc_type] || doc.doc_type}
              </span>
              <p className="mt-2 text-sm font-medium text-ink-950 group-hover:text-gold-800 transition-colors leading-snug">
                {doc.title || 'Sin titulo'}
              </p>
            </Link>
          ))}
        </div>
      </ScrollReveal>

      {/* Section 8 — CTA */}
      <ScrollReveal className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-serif text-2xl font-bold text-ink-950 mb-6">
          Explora los documentos vos mismo
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/explorador"
            className="inline-block px-5 py-2.5 text-sm font-medium rounded-full border border-gold-400 bg-gold-50 text-gold-800 hover:bg-gold-100 transition-colors"
          >
            Explorar el archivo
          </Link>
          <Link
            href="/red"
            className="inline-block px-5 py-2.5 text-sm font-medium rounded-full border border-ink-200 text-ink-600 hover:border-ink-400 transition-colors"
          >
            Mapa de conexiones
          </Link>
          <Link
            href="/chat"
            className="inline-block px-5 py-2.5 text-sm font-medium rounded-full border border-ink-200 text-ink-600 hover:border-ink-400 transition-colors"
          >
            Hace preguntas
          </Link>
        </div>
      </ScrollReveal>
    </div>
  )
}
