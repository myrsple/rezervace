import React from 'react'
import ReservationSystem from '@/components/ReservationSystem'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-700 mb-4">
            Rezervační systém rybářství
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      Rezervujte si své ideální lovné místo online. Vyberte si z 15 prémiových
          lokalit s flexibilními možnostmi rezervace podle vašich loveckých plánů.
          </p>
        </header>

        <ReservationSystem />
      </div>
    </main>
  )
} 