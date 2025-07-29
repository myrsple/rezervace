import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import Navigation from '@/components/Navigation'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ryby Semín - Rezervace lovných míst',
  description: 'Sportovní rybolov s občerstvením - rezervujte si své lovné místo online na rybníku Tomášek',
  icons: {
    icon: '/icon.jpg',
  },
  manifest: '/manifest.json',
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
          <header className="bg-white">
            <div className="max-w-7xl mx-auto px-4 pt-3 pb-2.5 flex justify-center">
              <img
                src="/logo-ryby.jpg"
                alt="Ryby Semín – logo"
                className="h-auto max-h-28 w-auto"
              />
            </div>
          </header>
          <Navigation />
          {children}
        </div>
        {/* Umami Analytics */}
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="8a304a41-92f1-4b6e-9b4d-f53c7efc2a84"
        />
      </body>
    </html>
  )
} 