import Link from 'next/link'
import { SearchHero } from '@/components/SearchHero'
import { PersonCard } from '@/components/PersonCard'
import type { PersonData } from '@/components/PersonCard'
import { ScrollReveal } from '@/components/ScrollReveal'
import { TimelineDot } from '@/components/TimelineDot'
import { PulseIndicator } from '@/components/PulseIndicator'
import { HeroStats } from '@/components/HeroStats'
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
      <section className="bg-ink-950 text-white relative overflow-hidden">
        {/* Radial spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.06)_0%,transparent_70%)]" />
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center relative">
          <h1 className="font-serif text-4xl sm:text-6xl font-bold mb-4 leading-[1.05] animate-fade-up">
            Archivo <span className="text-gold-400">Libra</span>
          </h1>
          <p className="text-lg text-ink-300 max-w-xl mx-auto mb-10 animate-fade-up delay-100">
            <span className="inline-flex items-center gap-2">
              <PulseIndicator color="gold" />
              {totalDocs.toLocaleString('es-AR')} documentos judiciales
            </span>{' '}
            del mayor criptoescándalo presidencial de la historia argentina.
            Llamadas, chats, contratos y peritajes.
          </p>
          <div className="animate-fade-up delay-200">
            <SearchHero />
            <p className="text-sm text-ink-500 mt-3">Buscá por nombre, fecha o palabra clave</p>
          </div>

          {/* Separator */}
          <div className="max-w-xl mx-auto border-t border-ink-800/30 my-4" />

          {/* Stats row — animated */}
          <HeroStats />
        </div>
      </section>

      {/* Cita editorial */}
      <section className="max-w-3xl mx-auto px-4 pt-14 pb-12">
        <div className="border-l-4 border-gold-400 pl-6 py-3">
          <p className="text-lg text-ink-600 italic font-serif leading-relaxed">
            &ldquo;De $0,000001 a $5,20 en 40 minutos.
            De $5,20 a $0,99 en las siguientes tres horas.
            75.000 víctimas. 251 millones de dólares en pérdidas.
            Un tuit presidencial borrado a medianoche.&rdquo;
          </p>
        </div>
      </section>

      {/* Por qué importa */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <ScrollReveal>
          <h2 className="font-serif text-2xl font-bold text-ink-950 mb-6 text-center">
            Por qué importa
          </h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: '🏛️', title: 'Presidencia involucrada', text: 'Es la primera vez que un presidente en ejercicio promociona un activo financiero que colapsa en horas.' },
            { icon: '💸', title: '75.000 víctimas', text: 'Decenas de miles de personas perdieron sus ahorros confiando en un posteo oficial que fue borrado a medianoche.' },
            { icon: '📱', title: '206 llamadas en una noche', text: 'Las pericias telefónicas revelan una coordinación frenética entre Olivos, Dallas y Singapur.' },
            { icon: '📋', title: 'Expediente público', text: 'Este archivo no edita ni interpreta. Reproduce textualmente los documentos del Juzgado Federal N°8.' },
          ].map((item) => (
            <ScrollReveal key={item.title}>
              <div className="flex gap-3 p-4 rounded-xl bg-white border border-ink-100 card-hover">
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-ink-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-ink-500 leading-relaxed">{item.text}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Personas clave */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <ScrollReveal>
          <h2 className="font-serif text-2xl font-bold text-ink-950 mb-1 text-center">
            Investigados y mencionados
          </h2>
          <p className="text-ink-400 text-sm mb-2 text-center">
            Los actores clave del caso, según el expediente judicial
          </p>
          <p className="text-ink-400 text-xs mb-5 text-center">Tocá un nombre para ver todos sus documentos</p>
        </ScrollReveal>
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
        <ScrollReveal>
          <h2 className="font-serif text-2xl font-bold text-ink-950 mb-1 text-center">
            Cronología de los hechos
          </h2>
          <p className="text-ink-400 text-sm mb-6 text-center">Tocá una fecha para ver los documentos de ese día</p>
        </ScrollReveal>
        <div className="space-y-4 ml-2">
          {TIMELINE.map((event, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <Link
                href={`/explorador?date_from=${event.from}&date_to=${event.to}`}
                className="flex items-start gap-3 group transition-transform hover:translate-x-1"
              >
                <TimelineDot />
                <div>
                  <p className="text-xs font-mono text-gold-700 group-hover:text-gold-900">
                    {event.date}
                  </p>
                  <p className="text-sm text-ink-700 group-hover:text-ink-950 transition-colors">
                    {event.text}
                  </p>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTAs */}
      <section className="bg-ink-950 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <ScrollReveal>
            <h2 className="font-serif text-2xl font-bold mb-2">Explorá la causa</h2>
            <p className="text-ink-400 text-sm mb-8">Todos los documentos del expediente, accesibles y navegables</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/explorador"
                className="bg-gold-400 text-ink-950 px-8 py-3.5 rounded-lg hover:bg-gold-300 transition-colors font-medium"
              >
                Explorar el archivo
              </Link>
              <Link
                href="/red"
                className="border border-gold-400 text-gold-400 px-8 py-3.5 rounded-lg hover:bg-gold-400/10 transition-colors font-medium"
              >
                Mapa de conexiones
              </Link>
              <Link
                href="/chat"
                className="border border-ink-600 text-ink-300 px-8 py-3.5 rounded-lg hover:border-ink-400 hover:text-white transition-colors"
              >
                Hacé preguntas sobre la causa
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
