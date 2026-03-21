import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Para medios — Archivo Libra',
  description: 'Convertimos expedientes judiciales en plataformas de investigación periodística navegables, buscables e inteligentes.',
}

const FEATURES = [
  {
    icon: '🔍',
    title: 'Búsqueda full-text',
    text: 'Tus periodistas buscan por nombre, fecha, palabra clave o frase exacta sobre miles de documentos en milisegundos.',
  },
  {
    icon: '🧠',
    title: 'Asistente de investigación con IA',
    text: 'Un chatbot que responde preguntas citando exclusivamente los documentos del expediente. No inventa, no especula — cita.',
  },
  {
    icon: '🕸️',
    title: 'Red de conexiones',
    text: 'Mapa visual interactivo de relaciones entre personas, organizaciones y eventos. Detecta patrones que a simple vista no se ven.',
  },
  {
    icon: '📋',
    title: 'Extracción automática de entidades',
    text: 'Nombres, organizaciones, montos, fechas y teléfonos extraídos automáticamente de cada documento con NLP.',
  },
  {
    icon: '📄',
    title: 'Transcripción y OCR',
    text: 'PDFs escaneados, fotos de contratos, audios de llamadas — todo transcripto y convertido en texto buscable.',
  },
  {
    icon: '📊',
    title: 'Estadísticas y visualizaciones',
    text: 'Dashboards con métricas del expediente: volumen de comunicaciones, líneas de tiempo, frecuencia de menciones.',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Nos pasás los documentos',
    text: 'PDFs, imágenes, audios, lo que tengas. Nosotros nos encargamos de la ingesta, OCR y transcripción.',
  },
  {
    number: '02',
    title: 'Procesamos e indexamos',
    text: 'Extracción de entidades, clasificación por tipo, construcción de la red de relaciones. Todo automático.',
  },
  {
    number: '03',
    title: 'Tu redacción investiga',
    text: 'Acceso interno con búsqueda, asistente IA y visualizaciones. Tu equipo encuentra lo que necesita en segundos.',
  },
  {
    number: '04',
    title: 'Tu público accede',
    text: 'Landing pública con la historia, evidencia clave y explorador. Tu medio ofrece un producto periodístico de primer nivel.',
  },
]

const PAIN_POINTS = [
  {
    before: 'Miles de PDFs en una carpeta de Drive',
    after: 'Archivo navegable con búsqueda full-text',
  },
  {
    before: '"¿En qué documento mencionaban a X?"',
    after: 'Respuesta instantánea del asistente IA',
  },
  {
    before: 'Leer 200 páginas para encontrar una conexión',
    after: 'Red visual que cruza menciones automáticamente',
  },
  {
    before: 'Fotos de documentos ilegibles',
    after: 'OCR + transcripción buscable',
  },
]

export default function Pitch() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-ink-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.06)_0%,transparent_70%)]" />
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-20 text-center relative">
          <p className="text-gold-400 font-mono text-xs tracking-widest uppercase mb-6 animate-fade-up">
            Para medios y redacciones
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-[1.08] animate-fade-up delay-100">
            Danos tus documentos.{' '}
            <span className="text-gold-400">Te devolvemos una plataforma.</span>
          </h1>
          <p className="text-lg text-ink-300 max-w-2xl mx-auto mb-10 animate-fade-up delay-200 leading-relaxed">
            Convertimos expedientes judiciales en un producto periodístico llave en mano:
            herramienta de investigación para tu redacción + landing pública para tu audiencia.
          </p>
          <div className="flex gap-4 justify-center flex-wrap animate-fade-up delay-300">
            <a
              href="mailto:diego@diegodella.ar?subject=Archivo Libra — consulta para medio"
              className="bg-gold-400 text-ink-950 px-8 py-3.5 rounded-lg hover:bg-gold-300 transition-colors font-medium"
            >
              Hablemos
            </a>
            <Link
              href="/"
              className="border border-ink-600 text-ink-300 px-8 py-3.5 rounded-lg hover:border-ink-400 hover:text-white transition-colors"
            >
              Ver el demo en vivo
            </Link>
          </div>
        </div>
      </section>

      {/* El problema */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950 mb-3 text-center">
          El problema que resolvemos
        </h2>
        <p className="text-ink-400 text-sm mb-10 text-center max-w-xl mx-auto">
          Todo medio que cubre una causa judicial enfrenta lo mismo
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PAIN_POINTS.map((p) => (
            <div
              key={p.before}
              className="border border-ink-100 rounded-xl p-5 bg-white card-hover"
            >
              <p className="text-sm text-ink-400 line-through decoration-ink-200 mb-3">
                {p.before}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-gold-500 text-lg">→</span>
                <p className="text-sm text-ink-900 font-medium">{p.after}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Qué incluye */}
      <section className="bg-ink-50 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950 mb-3 text-center">
            Qué incluye la plataforma
          </h2>
          <p className="text-ink-400 text-sm mb-10 text-center max-w-xl mx-auto">
            Todo lo que tu redacción necesita para trabajar un expediente a fondo
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-ink-100 rounded-xl p-6 card-hover"
              >
                <span className="text-3xl mb-3 block">{f.icon}</span>
                <h3 className="text-sm font-bold text-ink-900 mb-2">{f.title}</h3>
                <p className="text-xs text-ink-500 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950 mb-3 text-center">
          Cómo funciona
        </h2>
        <p className="text-ink-400 text-sm mb-10 text-center">
          De la carpeta de PDFs a la plataforma lista en días, no meses
        </p>
        <div className="space-y-6">
          {STEPS.map((s) => (
            <div key={s.number} className="flex gap-5 items-start">
              <span className="font-mono text-2xl font-bold text-gold-400 shrink-0 w-10">
                {s.number}
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink-900 mb-1">{s.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dos productos en uno */}
      <section className="bg-ink-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950 mb-3 text-center">
            Dos productos en uno
          </h2>
          <p className="text-ink-400 text-sm mb-10 text-center max-w-xl mx-auto">
            Un mismo archivo, dos experiencias distintas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="border border-ink-200 rounded-xl p-6 bg-white">
              <p className="text-gold-500 font-mono text-xs tracking-widest uppercase mb-3">Para tu redacción</p>
              <h3 className="text-lg font-bold text-ink-900 mb-3">Herramienta de investigación interna</h3>
              <ul className="space-y-2 text-sm text-ink-600">
                <li className="flex items-start gap-2"><span className="text-gold-500 mt-0.5">+</span>Búsqueda full-text sobre todo el expediente</li>
                <li className="flex items-start gap-2"><span className="text-gold-500 mt-0.5">+</span>Asistente IA que responde citando documentos</li>
                <li className="flex items-start gap-2"><span className="text-gold-500 mt-0.5">+</span>Red de conexiones entre personas y entidades</li>
                <li className="flex items-start gap-2"><span className="text-gold-500 mt-0.5">+</span>Dashboards y líneas de tiempo</li>
                <li className="flex items-start gap-2"><span className="text-gold-500 mt-0.5">+</span>Acceso restringido a tu equipo</li>
              </ul>
            </div>
            <div className="border border-gold-300 rounded-xl p-6 bg-white">
              <p className="text-gold-500 font-mono text-xs tracking-widest uppercase mb-3">Para tu audiencia</p>
              <h3 className="text-lg font-bold text-ink-900 mb-3">Landing pública de cara al público</h3>
              <ul className="space-y-2 text-sm text-ink-600">
                <li className="flex items-start gap-2"><span className="text-gold-500 mt-0.5">+</span>Explorador de documentos navegable</li>
                <li className="flex items-start gap-2"><span className="text-gold-500 mt-0.5">+</span>Cronología interactiva de los hechos</li>
                <li className="flex items-start gap-2"><span className="text-gold-500 mt-0.5">+</span>Personas clave y evidencia destacada</li>
                <li className="flex items-start gap-2"><span className="text-gold-500 mt-0.5">+</span>Con tu marca, tu dominio, tu historia</li>
                <li className="flex items-start gap-2"><span className="text-gold-500 mt-0.5">+</span>Un producto periodístico que genera tráfico</li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link
              href="/"
              className="text-sm text-gold-600 hover:text-gold-700 underline underline-offset-4 transition-colors"
            >
              Mirá el demo en vivo — así queda
            </Link>
          </div>
        </div>
      </section>

      {/* Para quién */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950 mb-3 text-center">
          Para quién es esto
        </h2>
        <p className="text-ink-400 text-sm mb-10 text-center max-w-xl mx-auto">
          Si tu medio cubre investigaciones con documentos, esto es para vos
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              title: 'Diarios y portales',
              text: 'Ofrecé a tu audiencia un explorador interactivo del expediente. Generá tráfico con un producto que nadie más tiene.',
            },
            {
              title: 'Equipos de investigación',
              text: 'Tu equipo deja de scrollear PDFs y empieza a hacer preguntas. El asistente IA cruza información entre documentos al instante.',
            },
            {
              title: 'ONGs y observatorios',
              text: 'Transparencia real: documentos accesibles, buscables y citables. Sin intermediarios editoriales.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="border border-ink-100 rounded-xl p-6 bg-white card-hover"
            >
              <h3 className="text-sm font-bold text-ink-900 mb-2">{item.title}</h3>
              <p className="text-xs text-ink-500 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-ink-950 text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-3">
            Tu próxima investigación merece más que una carpeta de Drive
          </h2>
          <p className="text-ink-400 text-sm mb-8 max-w-lg mx-auto">
            Mandanos el expediente. En días te devolvemos una plataforma
            que tu redacción va a usar todos los días y tu público va a explorar.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="mailto:diego@diegodella.ar?subject=Archivo Libra — consulta para medio"
              className="bg-gold-400 text-ink-950 px-8 py-3.5 rounded-lg hover:bg-gold-300 transition-colors font-medium"
            >
              Escribinos
            </a>
            <Link
              href="/"
              className="border border-gold-400 text-gold-400 px-8 py-3.5 rounded-lg hover:bg-gold-400/10 transition-colors font-medium"
            >
              Explorar el demo
            </Link>
          </div>
          <p className="text-ink-600 text-xs mt-6 font-mono">
            diego@diegodella.ar
          </p>
        </div>
      </section>
    </div>
  )
}
