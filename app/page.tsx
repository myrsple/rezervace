import React from 'react'
import ReservationSystem from '@/components/ReservationSystem'
import CompetitionSection from '@/components/CompetitionSection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rezervace | Ryby Semín',
  description: 'Rezervujte si své lovné místo na vodní nádrži Tomášek v Semíně – online kalendář a přehled dostupných termínů pro sportovní rybolov.',
  keywords: ['Ryby Semín', 'rezervace', 'sportovní rybolov', 'rybník Tomášek', 'Semín'],
}

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Sportovní rybolov na vodní nádrži Tomášek, zasazený do krásné přírody nedaleko Přelouče. 
            Nabízíme 15 lovných míst s flexibilní dobou rezervace a pořádáme pravidelné závody.
          </p>
          {/* Info Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-xl shadow-soft p-5 text-left">
              <div className="text-2xl mb-2">🎣</div>
              <h3 className="text-lg font-bold text-blue-700 mb-1.5">Kvalitní rybolov</h3>
              <p className="text-gray-600 text-sm">
                Průtočná vodní nádrž na písku s pravidelnou obměnou vody zajišťuje ideální podmínky pro rybolov.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-soft p-5 text-left">
              <div className="text-2xl mb-2">🌳</div>
              <h3 className="text-lg font-bold text-blue-700 mb-1.5">Krásné prostředí</h3>
              <p className="text-gray-600 text-sm">
                Okolní lesy a klidná příroda vytváří perfektní atmosféru pro váš rybářský zážitek.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-soft p-5 text-left">
              <div className="text-2xl mb-2">🎪</div>
              <h3 className="text-lg font-bold text-blue-700 mb-1.5">Kompletní vybavení</h3>
              <p className="text-gray-600 text-sm">
                Půjčovna rybářského vybavení a občerstvení přímo v areálu pro váš komfort.
              </p>
            </div>
          </div>
        </header>
        <CompetitionSection />
        <ReservationSystem />
      </div>
    </main>
  )
} 