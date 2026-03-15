import Link from 'next/link'

export default function About() {
  return (
    <div>
      <div className="bg-ink-950 text-white py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-gold-400 font-mono text-xs tracking-widest uppercase mb-4">
            Sobre el proyecto
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-tight">
            Por qué existe este <span className="text-gold-400">archivo</span>
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-ink-600 leading-relaxed">
        <p>
          El 14 de febrero de 2025, el presidente de Argentina publicó en sus
          redes sociales el código de contrato de un token en Solana llamado $LIBRA.
          En 40 minutos, 44.000 billeteras compraron el token y su capitalización
          llegó a 4.500 millones de dólares. En las tres horas siguientes, el
          precio se desplomó un 97%. Se estima que los creadores del token extrajeron
          al menos 100 millones de dólares. 75.000 personas perdieron su dinero.
        </p>

        <p>
          No es una historia de hackers sofisticados ni de genios del crimen
          financiero. Es una historia de avaricia ordinaria — de la clase que
          solo puede nacer cuando la ambición supera ampliamente a la competencia.
          Un lobista que se jactaba de &ldquo;controlar&rdquo; al presidente
          a través de su hermana. Un trader que hacía de nexo entre Olivos y
          Dallas. Un CEO prófugo que en una entrevista admitió que los insiders
          se llevaron 100 millones y lo describió como la forma en que
          &ldquo;los líderes de opinión hacen su dinero&rdquo;.
        </p>

        <p>
          La causa judicial está a cargo del Juzgado Federal N°8, bajo el juez
          Martínez de Giorgi y el fiscal Taiano. Los imputados incluyen a
          Hayden Davis (CEO de Kelsier Ventures, creador del token), Mauricio
          Novelli (lobista, nexo entre el gobierno y Davis), Manuel Terrones
          Godoy y Sergio Morales. Un peritaje del DATIP reveló 206 llamadas
          telefónicas la noche del lanzamiento, conectando la residencia
          presidencial de Olivos con Dallas y Singapur.
        </p>

        <p>
          A un año del escándalo, la causa no había citado a indagatoria a
          ninguno de los imputados. Los peritos encontraron borradores de un
          &ldquo;acuerdo confidencial&rdquo; entre el presidente y Hayden Davis,
          firmado dos semanas antes del lanzamiento. El presidente borró su tuit
          a medianoche y dijo que &ldquo;no conocía los detalles del proyecto&rdquo;.
        </p>

        <h2 className="font-serif text-2xl text-ink-900 pt-4">
          Qué es este sitio
        </h2>

        <p>
          Este archivo reúne los documentos públicos de la causa para que
          cualquiera pueda leerlos, buscarlos y citarlos. Transcripciones de
          llamadas telefónicas, peritajes, imágenes probatorias — todo organizado
          y navegable.
        </p>

        <ul className="list-disc pl-6 space-y-2 text-ink-600">
          <li>
            <strong className="text-ink-800">Explorador</strong> — Buscá documentos
            por fecha, participantes, tipo o contenido.
          </li>
          <li>
            <strong className="text-ink-800">Visor</strong> — Cada documento muestra
            el original (PDF o imagen) junto a la transcripción, lado a lado.
          </li>
          <li>
            <strong className="text-ink-800">Red de conexiones</strong> — Un mapa visual
            interactivo que muestra las relaciones entre las personas involucradas,
            basado en los documentos que comparten.
          </li>
          <li>
            <strong className="text-ink-800">Asistente</strong> — Un chatbot que
            responde preguntas citando exclusivamente los documentos. Cruza
            información entre documentos y busca por persona para encontrar conexiones.
            No opina, no especula, no interpreta.
          </li>
        </ul>

        <h2 className="font-serif text-2xl text-ink-900 pt-4">
          Qué no es este sitio
        </h2>

        <p>
          No es un medio de comunicación. No es un blog de opinión. No tiene
          línea editorial más allá de hacer accesible lo que ya es público.
          Los documentos están acá para que cualquiera pueda leerlos y sacar
          sus propias conclusiones.
        </p>

        <h2 className="font-serif text-2xl text-ink-900 pt-4">
          Fuentes
        </h2>

        <p>
          Los documentos provienen del expediente judicial público de la causa
          tramitada en el Juzgado Federal N°8. Todo el material es de acceso
          público y se presenta sin edición ni interpretación.
        </p>

        <div className="border-l-4 border-gold-400 pl-6 py-2 mt-8">
          <p className="text-ink-700 italic font-serif">
            &ldquo;Los hechos son sagrados, la opinión es libre.&rdquo;
          </p>
          <p className="text-xs text-ink-400 mt-1">— C. P. Scott, 1921</p>
        </div>

        <div className="pt-8 flex gap-4 flex-wrap">
          <Link
            href="/explorador"
            className="inline-block bg-ink-950 text-white px-6 py-3 rounded-lg hover:bg-ink-800 transition-colors font-medium"
          >
            Ir al explorador
          </Link>
          <Link
            href="/historia"
            className="inline-block border border-gold-400 text-gold-800 bg-gold-50 px-6 py-3 rounded-lg hover:bg-gold-100 transition-colors font-medium"
          >
            Leer la historia
          </Link>
        </div>
      </div>
    </div>
  )
}
