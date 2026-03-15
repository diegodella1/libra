import Link from 'next/link'
import type { Metadata } from 'next'
import { ScrollReveal } from '@/components/ScrollReveal'
import { PriceChart } from '@/components/PriceChart'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { MoneyFlow } from '@/components/MoneyFlow'

export const metadata: Metadata = {
  title: 'La historia — Archivo Libra',
  description: 'Cronologia del escandalo cripto $LIBRA: como un tuit presidencial genero la estafa mas grande en la historia de un mandatario en ejercicio.',
}

export default function HistoriaPage() {
  return (
    <div>
      {/* ============================================================
          CHAPTER 0 — HERO
          ============================================================ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-ink-950">
        <ScrollReveal className="text-center max-w-4xl">
          <p className="text-gold-400 text-sm font-mono tracking-widest uppercase mb-6">
            Investigacion
          </p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.1] tracking-tight">
            La historia del<br />caso <span className="text-gold-400">$LIBRA</span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-ink-300 font-serif max-w-2xl mx-auto leading-relaxed">
            La estafa cripto mas grande protagonizada por un presidente en ejercicio
          </p>
          <p className="mt-4 text-sm text-ink-500 font-mono">
            14 de febrero de 2025
          </p>
        </ScrollReveal>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2 text-ink-500">
            <span className="text-xs font-mono tracking-wide">Scroll</span>
            <svg width="20" height="28" viewBox="0 0 20 28" fill="none" className="animate-bounce">
              <path d="M10 4 L10 20 M4 16 L10 22 L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </section>

      {/* ============================================================
          CHAPTER 1 — EL TUIT
          ============================================================ */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollReveal>
            <p className="text-gold-500 text-xs font-mono tracking-widest uppercase mb-3">Capitulo 1</p>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-ink-950 mb-16">El tuit</h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Simulated tweet card */}
            <ScrollReveal>
              <div className="bg-ink-950 rounded-2xl p-6 md:p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-ink-800 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">JM</span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Javier Milei</p>
                    <p className="text-ink-400 text-sm">@JMilei &middot; 14 feb 2025 &middot; 21:07</p>
                  </div>
                </div>
                <p className="text-white text-base leading-relaxed mb-4">
                  Mundo crypto - El mundo de las criptomonedas. Private project to encourage the growth of the Argentine economy by incentivizing the funding of small Argentine enterprises and startups...
                </p>
                <p className="text-blue-400 text-sm font-mono break-all mb-4">
                  https://t.me/KelsierAI
                </p>
                <div className="border-t border-ink-800 pt-4">
                  <p className="text-ink-400 text-xs font-mono break-all">
                    Contract: 0x...LibraMileiToken
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Context text */}
            <ScrollReveal delay={200}>
              <div className="lg:pt-8">
                <p className="text-ink-700 text-lg leading-relaxed mb-6 font-serif">
                  A las 21:07 del 14 de febrero de 2025, el presidente de la Republica Argentina publica simultaneamente en X, Instagram y Facebook el codigo de contrato de un token llamado <strong className="text-ink-950">$LIBRA</strong>.
                </p>
                <p className="text-ink-600 text-lg leading-relaxed mb-6 font-serif">
                  El posteo incluye un enlace a Telegram y la direccion del contrato inteligente. Millones de seguidores lo ven en minutos.
                </p>
                <p className="text-ink-600 text-lg leading-relaxed font-serif">
                  Lo que sigue son 40 minutos de euforia, y despues el colapso.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          CHAPTER 2 — 40 MINUTOS
          ============================================================ */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-gold-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollReveal>
            <p className="text-gold-500 text-xs font-mono tracking-widest uppercase mb-3">Capitulo 2</p>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-ink-950 mb-16">40 minutos</h2>
          </ScrollReveal>

          {/* Big numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <ScrollReveal>
              <div className="text-center md:text-left">
                <p className="font-mono text-5xl md:text-7xl font-bold text-gold-700 leading-none">
                  $<AnimatedNumber value={4500} className="font-mono" />M
                </p>
                <p className="text-ink-500 text-base mt-3">capitalizacion en el pico</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="text-center md:text-left">
                <p className="font-mono text-5xl md:text-7xl font-bold text-gold-700 leading-none">
                  <AnimatedNumber value={44000} className="font-mono" />
                </p>
                <p className="text-ink-500 text-base mt-3">billeteras compraron en minutos</p>
              </div>
            </ScrollReveal>
          </div>

          {/* Price chart */}
          <ScrollReveal>
            <div className="bg-white border border-ink-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <PriceChart />
            </div>
            <p className="text-xs text-ink-400 mt-4 text-center font-mono">
              Precio del token $LIBRA durante las primeras 3 horas &mdash; Fuente: datos on-chain
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          CHAPTER 3 — EL CRASH
          ============================================================ */}
      <section className="py-24 md:py-40 bg-ink-950 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollReveal>
            <p className="text-gold-400 text-xs font-mono tracking-widest uppercase mb-3">Capitulo 3</p>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-20">El crash</h2>
          </ScrollReveal>

          {/* Giant 97% */}
          <ScrollReveal>
            <div className="text-center mb-20">
              <p className="font-mono text-8xl md:text-[12rem] lg:text-[16rem] font-bold text-gold-400 leading-none tracking-tighter">
                <AnimatedNumber value={97} className="font-mono" duration={2000} />%
              </p>
              <p className="text-ink-400 text-lg md:text-xl mt-4 font-serif">de caida en horas</p>
            </div>
          </ScrollReveal>

          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <ScrollReveal>
              <div className="text-center border border-ink-800 rounded-2xl p-8">
                <p className="font-mono text-4xl md:text-5xl font-bold text-gold-400">
                  $<AnimatedNumber value={100} className="font-mono" />M+
                </p>
                <p className="text-ink-400 text-sm mt-3">extraidos por insiders</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <div className="text-center border border-ink-800 rounded-2xl p-8">
                <p className="font-mono text-4xl md:text-5xl font-bold text-gold-400">
                  <AnimatedNumber value={75000} className="font-mono" />
                </p>
                <p className="text-ink-400 text-sm mt-3">personas afectadas</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="text-center border border-ink-800 rounded-2xl p-8">
                <p className="font-mono text-4xl md:text-5xl font-bold text-gold-400">
                  $<AnimatedNumber value={251} className="font-mono" />M
                </p>
                <p className="text-ink-400 text-sm mt-3">en perdidas estimadas</p>
              </div>
            </ScrollReveal>
          </div>

          {/* Money flow visualization */}
          <ScrollReveal>
            <MoneyFlow />
          </ScrollReveal>

          {/* Pull quote */}
          <ScrollReveal>
            <blockquote className="max-w-3xl mx-auto text-center">
              <p className="font-serif text-2xl md:text-3xl text-gold-400 leading-relaxed italic">
                &ldquo;Los creadores del token controlaban el 70% del suministro. Vendieron masivamente durante la subida.&rdquo;
              </p>
            </blockquote>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          CHAPTER 4 — LAS 206 LLAMADAS
          ============================================================ */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollReveal>
            <p className="text-gold-500 text-xs font-mono tracking-widest uppercase mb-3">Capitulo 4</p>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-ink-950 mb-6">La noche de las 206 llamadas</h2>
            <p className="text-ink-600 text-lg leading-relaxed mb-16 max-w-3xl font-serif">
              El peritaje del DATIP revelo 206 llamadas telefonicas esa noche, conectando tres puntos del planeta.
            </p>
          </ScrollReveal>

          {/* Connection diagram */}
          <ScrollReveal>
            <div className="relative max-w-4xl mx-auto">
              {/* SVG connection lines - visible on md+ */}
              <svg
                className="absolute inset-0 w-full h-full hidden md:block pointer-events-none"
                viewBox="0 0 800 280"
                preserveAspectRatio="xMidYMid meet"
                fill="none"
              >
                {/* Olivos to Dallas */}
                <line x1="133" y1="140" x2="400" y2="140" stroke="#facc15" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.6" />
                {/* Dallas to Singapore */}
                <line x1="400" y1="140" x2="667" y2="140" stroke="#facc15" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.6" />
                {/* Olivos to Singapore */}
                <path d="M 133 140 Q 400 40 667 140" stroke="#facc15" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.4" />
              </svg>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <ScrollReveal>
                  <div className="bg-white border-2 border-ink-200 rounded-2xl p-8 text-center shadow-sm hover:border-gold-400 transition-colors">
                    <div className="text-4xl mb-3">&#127963;</div>
                    <p className="font-serif text-lg font-bold text-ink-950">Olivos, Buenos Aires</p>
                    <p className="text-ink-500 text-sm mt-1">Residencia presidencial</p>
                  </div>
                </ScrollReveal>
                <ScrollReveal delay={200}>
                  <div className="bg-white border-2 border-ink-200 rounded-2xl p-8 text-center shadow-sm hover:border-gold-400 transition-colors">
                    <div className="text-4xl mb-3">&#127970;</div>
                    <p className="font-serif text-lg font-bold text-ink-950">Dallas, Texas</p>
                    <p className="text-ink-500 text-sm mt-1">Kelsier Ventures HQ</p>
                  </div>
                </ScrollReveal>
                <ScrollReveal delay={400}>
                  <div className="bg-white border-2 border-ink-200 rounded-2xl p-8 text-center shadow-sm hover:border-gold-400 transition-colors">
                    <div className="text-4xl mb-3">&#127759;</div>
                    <p className="font-serif text-lg font-bold text-ink-950">Singapur</p>
                    <p className="text-ink-500 text-sm mt-1">KIP Protocol</p>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </ScrollReveal>

          {/* Call stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 max-w-3xl mx-auto">
            <ScrollReveal>
              <div className="text-center">
                <p className="font-mono text-5xl md:text-6xl font-bold text-ink-950">
                  <AnimatedNumber value={206} className="font-mono" />
                </p>
                <p className="text-ink-500 text-sm mt-2">llamadas telefonicas esa noche</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="text-center">
                <p className="font-mono text-5xl md:text-6xl font-bold text-ink-950">
                  <AnimatedNumber value={9} className="font-mono" duration={800} />
                </p>
                <p className="text-ink-500 text-sm mt-2">de Santiago Caputo, asesor presidencial</p>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal>
            <p className="text-ink-600 text-lg leading-relaxed mt-12 max-w-3xl mx-auto font-serif text-center">
              Mauricio Novelli fue el nexo entre todos los actores. El analisis forense del DATIP reconstruyo la red completa de comunicaciones.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          CHAPTER 5 — EL ACUERDO
          ============================================================ */}
      <section className="py-24 md:py-32 bg-gold-50">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollReveal>
            <p className="text-gold-600 text-xs font-mono tracking-widest uppercase mb-3">Capitulo 5</p>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-ink-950 mb-6">El acuerdo confidencial</h2>
            <p className="text-ink-600 text-lg leading-relaxed mb-16 max-w-3xl font-serif">
              En los dispositivos incautados se encontro un borrador de &ldquo;acuerdo confidencial&rdquo; entre Javier Milei y Hayden Davis, aparentemente firmado el 30 de enero de 2025.
            </p>
          </ScrollReveal>

          {/* Agreement document card */}
          <ScrollReveal>
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border-2 border-gold-400 shadow-lg overflow-hidden">
              <div className="bg-ink-950 px-8 py-4">
                <p className="text-gold-400 text-xs font-mono tracking-widest uppercase">Acuerdo confidencial &mdash; Borrador</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex items-start gap-4 pb-6 border-b border-ink-100">
                  <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center">
                    <span className="text-gold-700 font-bold font-mono">1</span>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-ink-950">$1.5M</p>
                    <p className="text-ink-500 text-sm mt-1">Upfront en tokens o cash</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 pb-6 border-b border-ink-100">
                  <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center">
                    <span className="text-gold-700 font-bold font-mono">2</span>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-ink-950">$1.5M</p>
                    <p className="text-ink-500 text-sm mt-1">Cuando Milei anuncia en Twitter</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center">
                    <span className="text-gold-700 font-bold font-mono">3</span>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-ink-950">$2M</p>
                    <p className="text-ink-500 text-sm mt-1">Contrato firmado en persona</p>
                  </div>
                </div>
              </div>
              <div className="bg-gold-50 px-8 py-4 border-t border-gold-200">
                <p className="text-ink-500 text-sm font-mono">
                  Firmado 2 semanas antes del lanzamiento &mdash; 30 de enero de 2025
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <p className="text-ink-600 text-lg leading-relaxed mt-12 max-w-3xl mx-auto font-serif text-center">
              El presidente borro su posteo a medianoche y declaro que &ldquo;no conocia los detalles del proyecto&rdquo;.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          CHAPTER 6 — LOS DOCUMENTOS
          ============================================================ */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollReveal className="text-center mb-16">
            <p className="text-gold-500 text-xs font-mono tracking-widest uppercase mb-3">Capitulo 6</p>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-ink-950 mb-6">Los documentos</h2>
            <p className="text-ink-600 text-xl font-serif max-w-2xl mx-auto">
              <span className="font-mono font-bold text-ink-950">42.610</span> documentos. Exploralos vos mismo.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <ScrollReveal>
              <Link
                href="/explorador"
                className="block bg-white border-2 border-ink-200 rounded-2xl p-8 text-center hover:border-gold-400 hover:shadow-lg transition-all group"
              >
                <div className="text-4xl mb-4">&#128194;</div>
                <p className="font-serif text-lg font-bold text-ink-950 group-hover:text-gold-800 transition-colors">
                  Explorar el archivo
                </p>
                <p className="text-ink-500 text-sm mt-2">
                  Navega todos los documentos del expediente
                </p>
              </Link>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <Link
                href="/evidencia"
                className="block bg-white border-2 border-ink-200 rounded-2xl p-8 text-center hover:border-gold-400 hover:shadow-lg transition-all group"
              >
                <div className="text-4xl mb-4">&#128269;</div>
                <p className="font-serif text-lg font-bold text-ink-950 group-hover:text-gold-800 transition-colors">
                  Evidencia clave
                </p>
                <p className="text-ink-500 text-sm mt-2">
                  Los documentos mas relevantes del caso
                </p>
              </Link>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <Link
                href="/chat"
                className="block bg-white border-2 border-ink-200 rounded-2xl p-8 text-center hover:border-gold-400 hover:shadow-lg transition-all group"
              >
                <div className="text-4xl mb-4">&#128172;</div>
                <p className="font-serif text-lg font-bold text-ink-950 group-hover:text-gold-800 transition-colors">
                  Hace preguntas
                </p>
                <p className="text-ink-500 text-sm mt-2">
                  Chatea con IA sobre el expediente
                </p>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  )
}
