'use client'

import React, { useState, useEffect } from 'react'
import { Competition } from '@/types'
import { format, isBefore } from 'date-fns'
import { cs } from 'date-fns/locale'

export default function CompetitionSection() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchCompetitions()
  }, [])

  const fetchCompetitions = async () => {
    setLoading(true)
    setError(false)
    try {
      const response = await fetch('/api/competitions')
      if (!response.ok) {
        throw new Error('Failed to fetch competitions')
      }
      const data = await response.json()
      
      // Only show upcoming competitions
      const now = new Date()
      const activeCompetitions = data.filter((comp: Competition) => {
        const competitionDate = new Date(comp.date)
        return comp.isActive && isBefore(now, competitionDate)
      })
      
      setCompetitions(activeCompetitions)
    } catch (error) {
      console.error('Error fetching competitions:', error)
      setError(true)
    } finally {
      setLoading(false)
    }
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
            onClick={fetchCompetitions}
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
      <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
        <h3 className="text-xl font-bold text-semin-blue mb-4">
          Nadcházející závody
        </h3>
        <div className="space-y-3">
          {competitions.map(comp => (
            <div key={comp.id} className="flex">
              <span className="text-gray-600 w-32 font-medium">
                {format(new Date(comp.date), 'dd.MM.yyyy')}:
              </span>
              <span className="font-medium text-gray-900">{comp.name}</span>
            </div>
          ))}
        </div>
        <p className="text-gray-600 mt-4 text-sm">
          V dny závodů nelze rezervovat lovná místa. <a href="#competitions" className="font-semibold text-semin-blue hover:text-semin-blue/80 underline">Přihlaste se!</a>
        </p>
      </div>
    </SectionWrapper>
  )
} 