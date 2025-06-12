'use client'

import React from 'react'
import useSWR from 'swr'
import { Competition } from '@/types'
import { format, startOfDay, addHours } from 'date-fns'
import { cs } from 'date-fns/locale'
import CompetitionRegistration from './CompetitionRegistration'

const fetcher = (url: string) => fetch(url).then(async r => {
  if (!r.ok) throw new Error('http ' + r.status)
  return r.json()
})

export default function CompetitionSection() {
  const { data, error } = useSWR<Competition[]>('/api/competitions', fetcher, {
    shouldRetryOnError: true,
    errorRetryInterval: 3000,
  })

  const competitions = React.useMemo(() => {
    if (!data) return []
    const today = startOfDay(new Date())
    return data.filter((comp: Competition) => {
      if (!comp.isActive) return false
      const end = comp.endDate ? new Date(comp.endDate) : addHours(new Date(comp.date),24)
      return startOfDay(end) >= today
    })
  }, [data])

  const loading = !data && !error
  const [selectedCompetition, setSelectedCompetition] = React.useState<Competition | null>(null)

  const handleRegistrationComplete = () => {
    setSelectedCompetition(null)
    // SWR will revalidate automatically when we mutate
  }

  const isCompetitionFull = (competition: Competition) => {
    return (competition.registrations?.length || 0) >= competition.capacity
  }

  // Common section wrapper with title and description
  const SectionWrapper = ({ children }: { children: React.ReactNode }) => (
    <div id="competitions" className="bg-white rounded-2xl shadow-soft p-8 mb-8">
      <h2 className="text-3xl font-bold text-semin-blue mb-6">
        Rybářské závody
      </h2>
      <p className="text-semin-gray mb-6">
        Přihlaste se na nadcházející rybářské závody na našem rybníku.
      </p>
      {children}
    </div>
  )

  if (loading) {
    return (
      <SectionWrapper>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-semin-blue"></div>
        </div>
      </SectionWrapper>
    )
  }

  if (error) {
    return (
      <SectionWrapper>
        <div className="text-center py-12 text-semin-gray">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-lg font-medium text-red-600">Nepodařilo se načíst závody</p>
          <button 
            onClick={() => {
              // trigger revalidation
              window.location.reload()
            }}
            className="mt-4 px-4 py-2 bg-semin-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Zkusit znovu
          </button>
        </div>
      </SectionWrapper>
    )
  }

  if (!loading && competitions.length === 0) {
    return (
      <SectionWrapper>
        <div className="text-center py-12 text-semin-gray">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <p className="text-lg font-medium">V současné době nejsou vypsány žádné nadcházející závody</p>
          <p className="mt-2">Sledujte tuto stránku pro informace o budoucích závodech</p>
        </div>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {competitions.map((competition: Competition) => {
          const isFull = isCompetitionFull(competition)
          const registrationCount = competition.registrations?.length || 0
          
          return (
            <div 
              key={competition.id} 
              className={`border-2 rounded-2xl p-6 transition-all duration-200 ${
                selectedCompetition?.id === competition.id
                  ? 'border-semin-blue bg-semin-light-blue'
                  : isFull
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-gray-200 hover:border-semin-blue hover:shadow-card cursor-pointer'
              }`}
              onClick={() => !isFull && setSelectedCompetition(competition)}
            >
              <h3 className="text-xl font-bold text-semin-blue mb-3">{competition.name}</h3>
              
              <div className="space-y-2 text-sm text-semin-gray mb-4">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {format(new Date(competition.date), 'dd.MM.yyyy HH:mm', { locale: cs })}
                  {competition.endDate && (
                    <> – {format(new Date(competition.endDate), 'dd.MM.yyyy HH:mm', { locale: cs })}</>
                  )}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a6 6 0 01-6 0m6 0a6 6 0 006 6v1H9zm1.677-45A8.97 8.97 0 0118 12a8.97 8.97 0 01-3.323 7H21V3h-3.323z" />
                  </svg>
                  {registrationCount} / {competition.capacity} účastníků
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Vstupné: {competition.entryFee} Kč
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isFull ? 'bg-red-400' : 'bg-semin-green'
                    }`}
                    style={{ width: `${Math.min(100, (registrationCount / competition.capacity) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {isFull ? (
                <div className="text-center py-2">
                  <span className="text-red-600 font-medium">Všechna místa jsou již obsazena</span>
                </div>
              ) : (
                <div className="text-center">
                  <span className={`text-sm ${
                    selectedCompetition?.id === competition.id 
                      ? 'text-semin-blue font-medium' 
                      : 'text-semin-gray'
                  }`}>
                    {selectedCompetition?.id === competition.id ? 'Vybráno' : 'Klikněte pro registraci'}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Competition Registration Modal */}
      {selectedCompetition && !isCompetitionFull(selectedCompetition) && (
        <CompetitionRegistration
          competition={selectedCompetition}
          onClose={handleRegistrationComplete}
        />
      )}
    </SectionWrapper>
  )
} 