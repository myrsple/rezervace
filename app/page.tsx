import React from 'react'
import ReservationSystem from '@/components/ReservationSystem'
import CompetitionSection from '@/components/CompetitionSection'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-700 mb-4">
            Rezervační systém rybářství
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Rezervujte si své ideální lovné místo online. Vyberte si z 15 prémiových lokalit s flexibilními možnostmi rezervace podle vašich loveckých plánů.
          </p>
          {/* Info Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-2xl shadow-soft p-6 text-left">
              <div className="text-3xl mb-3">🎣</div>
              <h3 className="text-xl font-bold text-blue-700 mb-2">Snadná rezervace</h3>
              <p className="text-gray-600">
                Vyberte si lovné místo, datum a délku pobytu. Systém vám ukáže dostupnost v reálném čase.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-soft p-6 text-left">
              <div className="text-3xl mb-3">🌤️</div>
              <h3 className="text-xl font-bold text-blue-700 mb-2">Předpověď počasí</h3>
              <p className="text-gray-600">
                U každého termínu vidíte předpověď počasí a doporučení pro rybolov.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-soft p-6 text-left">
              <div className="text-3xl mb-3">🎪</div>
              <h3 className="text-xl font-bold text-blue-700 mb-2">Půjčovna vybavení</h3>
              <p className="text-gray-600">
                Nemáte vlastní vybavení? Půjčte si vše potřebné přímo při rezervaci.
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