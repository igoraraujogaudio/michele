import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthWrapper from '@/components/AuthWrapper'
import ClientHeader from '@/components/ClientHeader'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Controle de Veículos',
  description: 'Sistema de gerenciamento de veículos e manutenções em oficina',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthWrapper>
          <ClientHeader />
          {children}
        </AuthWrapper>
      </body>
    </html>
  )
}
