import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import Navigation from '@/components/Navigation'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ryby Semín - Rezervace lovných míst',
  description: 'Sportovní rybolov s občerstvením - rezervujte si své lovné místo online na rybníku Tomášek',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-semin-light-blue to-semin-light-gray">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  )
} 