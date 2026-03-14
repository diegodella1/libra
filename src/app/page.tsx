import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="font-serif text-5xl font-bold text-libra-950 mb-6">
          Archivo Libra
        </h1>
        <p className="text-xl text-libra-700 max-w-2xl mx-auto leading-relaxed">
          Archivo periodístico de documentos judiciales públicos.
          Explorá transcripciones, imágenes y documentos de la causa.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/explorador"
            className="bg-libra-950 text-libra-50 px-6 py-3 rounded-lg hover:bg-libra-800 transition-colors"
          >
            Explorar documentos
          </Link>
        </div>
      </section>

      {/* Contexto editorial */}
      <section className="prose prose-lg max-w-none">
        <h2 className="font-serif text-2xl text-libra-900">Sobre este archivo</h2>
        <p className="text-libra-700">
          {/* TODO: completar con contexto editorial cuando tengamos los documentos */}
          Este archivo reúne documentos públicos de una causa judicial, incluyendo
          transcripciones de llamadas telefónicas e imágenes. Todo el material es
          de acceso público y se presenta sin edición ni interpretación.
        </p>
        <p className="text-libra-700">
          Podés explorar los documentos por fecha, participantes o tema,
          buscar por contenido, o usar el asistente de búsqueda para hacer consultas
          en lenguaje natural.
        </p>
      </section>

      {/* Stats placeholder */}
      <section className="mt-16 grid grid-cols-3 gap-8 text-center">
        <div className="p-6 bg-white rounded-xl border border-libra-200">
          <p className="text-3xl font-bold text-libra-950">—</p>
          <p className="text-sm text-libra-500 mt-1">Documentos</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-libra-200">
          <p className="text-3xl font-bold text-libra-950">—</p>
          <p className="text-sm text-libra-500 mt-1">Transcripciones</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-libra-200">
          <p className="text-3xl font-bold text-libra-950">—</p>
          <p className="text-sm text-libra-500 mt-1">Páginas</p>
        </div>
      </section>
    </div>
  )
}
