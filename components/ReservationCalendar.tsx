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
  startOfDay,
  isToday
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
  const [currentDate, setCurrentDate] = useState(new Date())
  const [weatherData, setWeatherData] = useState<Record<string, { temperature: number, icon: string }>>({})
  const [loadingWeather, setLoadingWeather] = useState<Record<string, boolean>>({})
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
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

  const getDayClasses = (
    date: Date,
    isSelected: boolean,
    canSelect: boolean,
    isCurrentMonth: boolean,
    availability: 'available' | 'occupied' | 'partial' | 'competition'
  ): string => {
    const baseClasses = "min-h-[120px] p-3 flex flex-col justify-between text-left transition-all duration-200"

    if (!isCurrentMonth) {
      return `${baseClasses} bg-gray-50/50 text-gray-300 cursor-not-allowed`
    }

    if (isSelected) {
      return `${baseClasses} bg-semin-blue/10 text-semin-blue ring-2 ring-semin-blue font-medium shadow-sm`
    }

    // Match the legend colors for each state
    switch (availability) {
      case 'available':
        return `${baseClasses} bg-green-50/50 hover:bg-green-100/50 text-gray-700 hover:text-green-800 cursor-pointer ring-1 ring-green-100 hover:ring-green-200`
      case 'occupied':
        return `${baseClasses} bg-red-50/50 text-gray-500 cursor-not-allowed ring-1 ring-red-100`
      case 'partial':
        return `${baseClasses} bg-yellow-50/50 hover:bg-yellow-100/50 text-gray-700 hover:text-yellow-800 cursor-pointer ring-1 ring-yellow-100 hover:ring-yellow-200`
      case 'competition':
        return `${baseClasses} bg-purple-50/50 text-purple-700 cursor-not-allowed ring-1 ring-purple-100`
      default:
        return `${baseClasses} bg-gray-50/50 text-gray-400 cursor-not-allowed`
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-semin-blue">
          {format(monthStart, 'MMMM yyyy', { locale: cs })} • Lovné místo {spot.number}
        </h3>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setCurrentDate(addDays(currentDate, -30))} 
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())} 
            className="px-4 py-2 text-sm font-medium text-semin-blue bg-semin-blue/10 rounded-xl hover:bg-semin-blue/20 transition-colors"
          >
            Dnes
          </button>
          <button 
            onClick={() => setCurrentDate(addDays(currentDate, 30))} 
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex justify-end space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-100 ring-1 ring-green-200 mr-2"></div>
          <span className="text-gray-600">Volné</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-100 ring-1 ring-red-200 mr-2"></div>
          <span className="text-gray-600">Obsazené</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-100 ring-1 ring-yellow-200 mr-2"></div>
          <span className="text-gray-600">Částečně</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-purple-100 ring-1 ring-purple-200 mr-2"></div>
          <span className="text-gray-600">Závod</span>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 bg-gray-50/50 border-b border-gray-100">
          {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
            <div key={day} className="py-3 text-sm font-medium text-gray-600 text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
          {calendarDays.map(date => {
            const isSelected = !!(selectedDate && isSameDay(date, selectedDate));
            const canSelect = canSelectDate(date);
            const availability = getDateAvailability(date);
            const isCurrentMonth = date.getMonth() === monthStart.getMonth();
            const dateKey = format(date, 'yyyy-MM-dd');
            const weather = weatherData[dateKey];
            
            return (
              <button
                key={date.toISOString()}
                onClick={() => canSelect && onDateSelect(date)}
                className={getDayClasses(date, isSelected, canSelect, isCurrentMonth, availability)}
                disabled={!canSelect || !isCurrentMonth}
              >
                <div className="flex items-center justify-between">
                  <div className={`font-medium ${
                    isToday(date) 
                      ? 'bg-semin-blue text-white w-7 h-7 rounded-full flex items-center justify-center' 
                      : ''
                  }`}>
                    {format(date, 'd')}
                  </div>
                  {isCurrentMonth && weather && (
                    <div className="text-2xl">{weather.icon}</div>
                  )}
                </div>
                {isCurrentMonth && weather && (
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-600">{weather.temperature}°C</p>
                  </div>
                )}
                {isCurrentMonth && loadingWeather[dateKey] && (
                  <div className="w-4 h-4 border-2 border-semin-blue/20 border-t-semin-blue rounded-full animate-spin mx-auto mt-2"></div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {competitions.length > 0 && (
        <div className="mt-6 p-4 bg-purple-50/50 border border-purple-200 rounded-2xl text-sm">
          <h4 className="font-bold text-purple-800 mb-2">Nadcházející závody</h4>
          {competitions.map(comp => (
            <div key={comp.id} className="text-purple-700">
              <strong>{format(new Date(comp.date), 'dd.MM.yyyy')}:</strong> {comp.name}
            </div>
          ))}
          <p className="text-xs text-purple-600 mt-2">
            V dny závodů nelze rezervovat lovná místa. <a href="#competitions" className="font-semibold underline">Přihlaste se!</a>
          </p>
        </div>
      )}

      {/* Booking Summary */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-blue-50/50 border border-blue-200 rounded-2xl text-sm">
          <h4 className="font-semibold text-blue-800 mb-2">Shrnutí rezervace</h4>
          <div className="space-y-1 text-blue-700">
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