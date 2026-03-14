import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/Header'
import { ChatWidget } from '@/components/ChatWidget'

export const metadata: Metadata = {
  title: 'Archivo Libra',
  description: 'Archivo periodístico de documentos judiciales públicos. Explorá, buscá y consultá transcripciones y documentos de la causa.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <ChatWidget />
        <footer className="border-t border-libra-200 py-8 text-center text-sm text-libra-500">
          <p>Archivo Libra — Documentos de acceso público</p>
        </footer>
      </body>
    </html>
  )
}
