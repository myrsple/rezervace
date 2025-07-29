'use client'

import React from 'react'
import useSWR from 'swr'
import { Competition } from '@/types'
import { format, startOfDay, addHours } from 'date-fns'
import { cs } from 'date-fns/locale'
import CompetitionRegistration from './CompetitionRegistration'

// Helper: treat timestamp stored as UTC but representing local naive time
const toLocalDate = (iso: string | Date | undefined): Date | null => {
  if(!iso) return null
  const d = typeof iso === 'string' ? new Date(iso) : iso
  // Convert from real UTC to naive local by subtracting the timezone offset
  return new Date(d.getTime() - d.getTimezoneOffset()*60000)
}

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
      const end = comp.endDate ? toLocalDate(comp.endDate)! : addHours(toLocalDate(comp.date)!,24)
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
          <p className="text-lg font-medium">Momentálně nejsou vypsány žádné nadcházející závody.</p>
          <p className="mt-2">
            <a
              href="https://www.facebook.com/sportovnirybolovsemin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-semin-blue font-medium hover:underline"
            >Sledujte nás na Facebooku</a> ať vám oznámení neunikne!
          </p>
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
          
          const startDateObj = toLocalDate(competition.date)!
          const endDateObj = competition.endDate ? toLocalDate(competition.endDate)! : null
          const sameMonth = endDateObj && startDateObj.getMonth() === endDateObj.getMonth() && startDateObj.getFullYear() === endDateObj.getFullYear()
          const startLabel = endDateObj && sameMonth ? format(startDateObj,'d.',{locale:cs}) : format(startDateObj,'d. MMMM',{locale:cs})
          const endLabel = endDateObj ? format(endDateObj,'d. MMMM',{locale:cs}) : null
          
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
                  <span className="mr-2">🗓️</span>
                  {startLabel}
                  {endLabel && <> – {endLabel}</>}
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🕒</span>
                  Start: {format(toLocalDate(competition.date)!, 'HH:mm', { locale: cs })}
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
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
                  <span className="text-sm text-semin-gray">👥 {registrationCount} / {competition.capacity} účastníků</span>
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