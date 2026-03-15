import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datos del caso — Archivo Libra',
  description: 'Estadisticas y visualizaciones del archivo de documentos del caso $LIBRA',
}

export default function DatosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
