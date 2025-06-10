'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { FishingSpot, Reservation, CalendarDay, Competition } from '@/types'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addDays,
  startOfWeek,
  endOfWeek,
  isBefore,
  startOfDay
} from 'date-fns'
import { cs } from 'date-fns/locale'

interface ReservationCalendarProps {
  spot: FishingSpot
  reservations: Reservation[]
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  duration: string
  timeSlot: string
}

export default function ReservationCalendar({
  spot,
  reservations,
  selectedDate,
  onDateSelect,
  duration,
  timeSlot
}: ReservationCalendarProps) {
  const currentDate = new Date()
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  
  const [competitions, setCompetitions] = useState<Competition[]>([])

  useEffect(() => {
    fetchCompetitions()
  }, [])

  const fetchCompetitions = async () => {
    try {
      const response = await fetch('/api/competitions')
      if (response.ok) {
        const data = await response.json()
        setCompetitions(data.filter((comp: Competition) => comp.isActive))
      }
    } catch (error) {
      console.error('Error fetching competitions:', error)
      setCompetitions([])
    }
  }

  const spotReservations = useMemo(() => {
    return reservations.filter(reservation => 
      reservation.spotId === spot.id && 
      reservation.status !== 'CANCELLED'
    )
  }, [reservations, spot.id])

  const getDateAvailability = (date: Date): 'available' | 'occupied' | 'partial' | 'competition' => {
    const dayStart = startOfDay(date)
    
    // Check if date is in the past
    if (isBefore(dayStart, startOfDay(currentDate))) {
      return 'occupied'
    }

    // Check if there's a competition on this date
    const hasCompetition = competitions.some(competition => {
      const competitionDate = startOfDay(new Date(competition.date))
      return competitionDate.getTime() === dayStart.getTime()
    })

    if (hasCompetition) {
      return 'competition'
    }

    const dayReservations = spotReservations.filter(reservation => {
      const reservationStart = new Date(reservation.startDate)
      const reservationEnd = new Date(reservation.endDate)
      
      return dayStart >= startOfDay(reservationStart) && dayStart <= startOfDay(reservationEnd)
    })

    if (dayReservations.length === 0) {
      return 'available'
    }

    // Check for partial availability
    const hasFullDayReservation = dayReservations.some(reservation => 
      reservation.duration === '24h' || reservation.duration === '48h'
    )
    
    const hasDayOnlyReservation = dayReservations.some(reservation => 
      reservation.duration === 'day'
    )

    if (hasFullDayReservation) {
      return 'occupied'
    }

    if (hasDayOnlyReservation && duration === 'day') {
      return 'occupied'
    }

    if (hasDayOnlyReservation && (duration === '24h' || duration === '48h')) {
      return 'partial'
    }

    return 'available'
  }

  const canSelectDate = (date: Date): boolean => {
    const availability = getDateAvailability(date)
    
    if (availability === 'occupied' || availability === 'competition') return false
    
    if (duration === '48h') {
      // For 48h bookings, check next day availability too
      const nextDay = addDays(date, 1)
      const nextDayAvailability = getDateAvailability(nextDay)
      return nextDayAvailability !== 'occupied'
    }
    
    return true
  }

  const getDayClasses = (date: Date): string => {
    const availability = getDateAvailability(date)
    const isSelected = selectedDate && isSameDay(date, selectedDate)
    const canSelect = canSelectDate(date)
    const isCurrentMonth = date.getMonth() === currentDate.getMonth()
    
    let classes = 'calendar-day '
    
    if (!isCurrentMonth) {
      classes += 'text-gray-400 '
    }
    
    if (isSelected) {
      classes += 'selected '
    } else if (availability === 'available' && canSelect) {
      classes += 'available '
    } else if (availability === 'partial' && canSelect) {
      classes += 'partial '
    } else if (availability === 'competition') {
      classes += 'competition '
    } else {
      classes += 'occupied '
    }
    
    return classes
  }

  return (
    <div className="space-y-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-semin-blue">
          {(() => {
            const months = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 
                           'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
            return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
          })()} • Lovné místo {spot.number}
        </h3>
        <div className="flex space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded mr-2"></div>
            <span className="font-medium text-semin-gray">Volné</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-50 border border-red-200 rounded mr-2"></div>
            <span className="font-medium text-semin-gray">Obsazené</span>
          </div>
          <div className="flex items-center">  
            <div className="w-4 h-4 rounded mr-2 border border-gray-300" style={{
              background: 'linear-gradient(135deg, #dcfce7 50%, #fef3c7 50%)'
            }}></div>
            <span className="font-medium text-semin-gray">Částečně</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded mr-2"></div>
            <span className="font-medium text-semin-gray">Závod</span>
          </div>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="grid grid-cols-7 bg-semin-light-gray border border-gray-200 rounded-t-xl">
        {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
          <div key={day} className="py-3 text-sm font-bold text-semin-blue text-center border-r border-gray-200 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 border-l border-r border-b border-gray-200 rounded-b-xl bg-white">
        {calendarDays.map(date => {
          const canSelect = canSelectDate(date)
          const isCurrentMonth = date.getMonth() === currentDate.getMonth()
          return (
            <button
              key={date.toISOString()}
              onClick={() => canSelect && onDateSelect(date)}
              className={`${getDayClasses(date)} border-r border-b border-gray-200 last:border-r-0 ${!isCurrentMonth ? 'bg-gray-50' : ''}`}
              disabled={!canSelect}
            >
              <div className="flex flex-col items-center">
                <span className={`text-sm font-medium ${!isCurrentMonth ? 'text-gray-400' : ''}`}>
                  {format(date, 'd')}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Competition Notice */}
      {competitions.length > 0 && (
        <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-medium text-purple-800 mb-2">Nadcházející závody</h4>
          <div className="space-y-1 text-sm text-purple-700">
            {competitions.map(competition => (
              <div key={competition.id}>
                <strong>{format(new Date(competition.date), 'dd.MM.yyyy', { locale: cs })}:</strong> {competition.name}
              </div>
            ))}
          </div>
          <p className="text-xs text-purple-600 mt-2">
            V dny závodů nelze rezervovat lovná místa pro běžný rybolov. <a href="#competitions" className="text-purple-800 font-semibold underline hover:text-purple-900 transition-colors">Přihlaste se!</a>
          </p>
        </div>
      )}

      {/* Booking Summary */}
      {selectedDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Shrnutí rezervace</h4>
          <div className="space-y-1 text-sm text-blue-700">
            <div><strong>Datum:</strong> {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: cs })}</div>
            <div><strong>Délka:</strong> {
              duration === 'day' ? 'Jeden den (6:00 - 22:00)' :
              duration === '24h' ? '24 hodin' : '48 hodin'
            }</div>
            {(duration === '24h' || duration === '48h') && (
              <div><strong>Začátek:</strong> {
                timeSlot === 'morning' ? '6:00' : '18:00'
              }</div>
            )}
            <div><strong>Místo:</strong> #{spot.number} - {spot.name}</div>
          </div>
        </div>
      )}
    </div>
  )
} 