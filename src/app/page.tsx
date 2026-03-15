import Link from 'next/link'
import { SearchHero } from '@/components/SearchHero'
import { PersonCard } from '@/components/PersonCard'
import type { PersonData } from '@/components/PersonCard'
import { createClient } from '@/lib/supabase'

const PERSONS: Omit<PersonData, 'docCount'>[] = [
  { name: 'Javier Milei', role: 'Presidente. Publicó el contrato del token en redes', searchTerm: 'Milei' },
  { name: 'Karina Milei', role: 'Secretaria General. Comunicaciones con involucrados', searchTerm: 'Karina' },
  { name: 'Mauricio Novelli', role: 'Trader y lobista. Nexo entre Milei y Davis', searchTerm: 'Novelli' },
  { name: 'Manuel Terrones', role: 'Empresario. Co-responsable investigado', searchTerm: 'Terrones' },
  { name: 'Hayden Davis', role: 'CEO Kelsier Ventures. Creador del token. Prófugo', searchTerm: 'Davis' },
  { name: 'Sergio Morales', role: 'Ex asesor CNV. Presuntamente al tanto', searchTerm: 'Morales' },
  { name: 'Julian Peh', role: 'CEO KIP Protocol. 41 contactos con Novelli', searchTerm: 'Peh' },
  { name: 'Charles Hoskinson', role: 'Fundador Cardano. Mencionado en comunicaciones', searchTerm: 'Hoskinson' },
]

const TIMELINE = [
  { date: '30/01/2025', text: 'Se firma un "acuerdo confidencial" entre Milei y Hayden Davis', from: '2025-01-30', to: '2025-01-30' },
  { date: '13/02/2025', text: 'La víspera: 206 llamadas entre Olivos, Dallas y Singapur', from: '2025-02-13', to: '2025-02-13' },
  { date: '14/02/2025', text: 'Milei publica el token $LIBRA. Sube a $5,20 en 40 minutos', from: '2025-02-14', to: '2025-02-14' },
  { date: '14/02/2025', text: 'Crash del 97%. Los insiders extraen más de US$100 millones', from: '2025-02-14', to: '2025-02-14' },
  { date: '15/02/2025', text: 'Milei borra el posteo a medianoche', from: '2025-02-15', to: '2025-02-15' },
  { date: 'Mar 2025', text: 'El Juzgado Federal N°8 abre la investigación penal', from: '2025-03-01', to: '2025-03-31' },
]

async function getPersonCounts(): Promise<Record<string, number>> {
  const supabase = createClient()
  const counts: Record<string, number> = {}

  const results = await Promise.all(
    PERSONS.map(async (p) => {
      const { count } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .ilike('title', `%${p.searchTerm}%`)
      return { searchTerm: p.searchTerm, count: count || 0 }
    })
  )

  for (const r of results) {
    counts[r.searchTerm] = r.count
  }
  return counts
}

async function getTotalDocs(): Promise<number> {
  const supabase = createClient()
  const { count } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
  return count || 0
}

export default async function Home() {
  const [personCounts, totalDocs] = await Promise.all([
    getPersonCounts(),
    getTotalDocs(),
  ])

  return (
    <div>
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-24 pb-12 text-center">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink-950 mb-3 leading-[1.1]">
          Archivo Libra
        </h1>
        <p className="text-lg text-ink-500 max-w-xl mx-auto mb-10">
          Todos los documentos judiciales de la causa por el criptoescándalo presidencial.
          Llamadas, chats, contratos y peritajes.
        </p>
        <SearchHero />
        <p className="text-sm text-ink-400 mt-3">Buscá por nombre, fecha o palabra clave</p>
      </section>

      {/* Stats row */}
      <section className="max-w-3xl mx-auto px-4 pb-10">
        <div className="flex justify-center gap-8 sm:gap-12 text-center">
          {[
            { value: '$4.5B', label: 'Capitalización pico' },
            { value: '$251M', label: 'Pérdidas estimadas' },
            { value: '75K', label: 'Afectados' },
            { value: '206', label: 'Llamadas la noche del 14/02' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-xl sm:text-2xl font-bold text-ink-950 font-mono">{value}</p>
              <p className="text-[10px] text-ink-400 uppercase tracking-wide font-mono mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cita editorial */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <div className="border-l-4 border-gold-400 pl-6 py-3">
          <p className="text-lg text-ink-600 italic font-serif leading-relaxed">
            &ldquo;De $0,000001 a $5,20 en 40 minutos.
            De $5,20 a $0,99 en las siguientes tres horas.
            75.000 víctimas. 251 millones de dólares en pérdidas.
            Un tuit presidencial borrado a medianoche.&rdquo;
          </p>
        </div>
      </section>

      {/* Personas clave */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="font-serif text-xl font-bold text-ink-950 mb-1 text-center">
          Investigados y mencionados
        </h2>
        <p className="text-ink-400 text-sm mb-4 text-center">Tocá un nombre para ver todos sus documentos</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PERSONS.map((p) => (
            <PersonCard
              key={p.name}
              {...p}
              docCount={personCounts[p.searchTerm] || 0}
            />
          ))}
        </div>
      </section>

      {/* Cronología */}
      <section className="max-w-3xl mx-auto px-4 pb-14">
        <h2 className="font-serif text-xl font-bold text-ink-950 mb-1 text-center">
          Cronología de los hechos
        </h2>
        <p className="text-ink-400 text-sm mb-4 text-center">Tocá una fecha para ver los documentos de ese día</p>
        <div className="border-l-4 border-gold-400 ml-4 pl-6 space-y-4">
          {TIMELINE.map((event, i) => (
            <Link
              key={i}
              href={`/explorador?date_from=${event.from}&date_to=${event.to}`}
              className="block group"
            >
              <p className="text-xs font-mono text-gold-700 group-hover:text-gold-900">
                {event.date}
              </p>
              <p className="text-sm text-ink-700 group-hover:text-ink-950 transition-colors">
                {event.text}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTAs */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/explorador"
            className="bg-ink-950 text-white px-8 py-3.5 rounded-lg hover:bg-ink-800 transition-colors font-medium"
          >
            Explorar el archivo
          </Link>
          <Link
            href="/red"
            className="border border-gold-400 text-gold-800 bg-gold-50 px-8 py-3.5 rounded-lg hover:bg-gold-100 transition-colors font-medium"
          >
            Mapa de conexiones
          </Link>
          <Link
            href="/chat"
            className="border border-ink-300 text-ink-700 px-8 py-3.5 rounded-lg hover:border-ink-500 hover:text-ink-950 transition-colors"
          >
            Hacé preguntas sobre la causa
          </Link>
        </div>
      </section>
    </div>
  )
}
