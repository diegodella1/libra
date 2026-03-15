import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { PublicShell } from '@/components/PublicShell'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Archivo Libra',
  description: 'Archivo periodístico de documentos judiciales públicos. Transcripciones, pruebas y documentos de la causa del token.',
  openGraph: {
    title: 'Archivo Libra',
    description: 'Todos los documentos públicos de la causa por el token $LIBRA. Transcripciones, peritajes, llamadas, pruebas.',
    locale: 'es_AR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans text-ink-950">
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  )
}
