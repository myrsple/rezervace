'use client'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-semin-light-blue to-semin-light-gray pt-24 pb-16 px-8 text-center">
      <h1 className="text-6xl font-extrabold text-semin-blue mb-4">404 🐟</h1>
      <p className="text-lg text-gray-700 mb-6 max-w-md">Tato stránka se nám bohužel vyvlékla z háčku. Zkuste to prosím znovu nebo se vraťte na úvodní stránku.</p>
      <Link href="/" className="px-6 py-3 bg-semin-blue text-white rounded-xl text-base font-medium hover:bg-semin-blue/90">Zpět na hlavní stránku</Link>
    </main>
  )
} 