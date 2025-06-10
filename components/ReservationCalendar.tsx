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
  isToday,
  addHours
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

  const getDateAvailability = (date: Date): 'available' | 'occupied' | 'partial' | 'competition' | 'past' => {
    const dayStart = startOfDay(date)
    const today = startOfDay(new Date())

    // Check if date is in the past (before today)
    if (isBefore(dayStart, today)) {
      return 'past'
    }

    // Check if there's a competition on this date
    const hasCompetition = competitions.some(competition => {
      const competitionDate = startOfDay(new Date(competition.date))
      const endDate = addHours(competitionDate, 24) // Competition ends 24h after start
      const visibilityEndDate = addHours(endDate, 48) // Show for 48h after end
      const now = new Date()
      return competitionDate.getTime() === dayStart.getTime() && competition.isActive && isBefore(now, visibilityEndDate)
    })

    if (hasCompetition) {
      return 'competition'
    }

    const dayReservations = spotReservations.filter(reservation => {
      const reservationStart = new Date(reservation.startDate)
      const reservationEnd = new Date(reservation.endDate)
      // The day starts at 00:00 and ends at 23:59:59
      const dayStart = startOfDay(date)
      const dayEnd = addDays(dayStart, 1)
      return reservationStart < dayEnd && reservationEnd > dayStart
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
    if (availability === 'past' || availability === 'occupied' || availability === 'competition') return false
    if (duration === '48h') {
      const nextDay = addDays(date, 1)
      const nextDayAvailability = getDateAvailability(nextDay)
      return nextDayAvailability !== 'occupied' && nextDayAvailability !== 'past'
    }
    return true
  }

  const getDayClasses = (
    date: Date,
    isSelected: boolean,
    canSelect: boolean,
    isCurrentMonth: boolean,
    availability: 'available' | 'occupied' | 'partial' | 'competition' | 'past'
  ): string => {
    const baseClasses = "min-h-[60px] p-1 flex flex-col justify-between text-left transition-all duration-200 text-sm"

    if (!isCurrentMonth) {
      return `${baseClasses} bg-gray-50/50 text-gray-300 cursor-not-allowed`
    }

    if (isSelected) {
      return `${baseClasses} bg-semin-blue/10 text-semin-blue ring-2 ring-semin-blue font-medium shadow-sm`
    }

    // Match the legend colors for each state
    switch (availability) {
      case 'available':
        return `${baseClasses} bg-green-200 hover:bg-green-300 text-gray-800 hover:text-green-900 cursor-pointer ring-1 ring-green-300 hover:ring-green-400`
      case 'occupied':
        return `${baseClasses} bg-red-200 text-gray-700 cursor-not-allowed ring-1 ring-red-300`
      case 'partial':
        return `${baseClasses} bg-yellow-200 hover:bg-yellow-300 text-gray-800 hover:text-yellow-900 cursor-pointer ring-1 ring-yellow-300 hover:ring-yellow-400`
      case 'competition':
        return `${baseClasses} bg-purple-200 text-purple-900 cursor-not-allowed ring-1 ring-purple-300`
      case 'past':
        return `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed`
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-semin-blue">
          Lovné místo {spot.number}
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
          <span className="px-3 py-1.5 text-sm font-bold text-semin-blue bg-semin-blue/10 rounded-xl">
            {format(currentDate, 'LLLL yyyy', { locale: cs })}
          </span>
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

      <div className="flex justify-end space-x-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded bg-green-200 ring-1 ring-green-300 mr-1.5"></div>
          <span className="text-gray-600">Volné</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded bg-red-200 ring-1 ring-red-300 mr-1.5"></div>
          <span className="text-gray-600">Obsazené</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded bg-yellow-200 ring-1 ring-yellow-300 mr-1.5"></div>
          <span className="text-gray-600">Částečně</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded bg-purple-200 ring-1 ring-purple-300 mr-1.5"></div>
          <span className="text-gray-600">Závod</span>
        </div>
      </div>

      <div className="rounded-md overflow-hidden bg-white shadow-lg border border-gray-100 mt-4 mb-6">
        {/* Weekday Bar: reduce corner radius */}
        <div className="grid grid-cols-7 bg-gray-100 rounded-t-md">
          {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
            <div key={day} className="py-2 text-xs font-bold text-gray-700 text-center tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days: reduce cell radius, align numbers left */}
        <div className="grid grid-cols-7 gap-1 p-2 bg-white">
          {calendarDays.map(date => {
            const isSelected = !!(selectedDate && isSameDay(date, selectedDate));
            const canSelect = canSelectDate(date);
            const availability = getDateAvailability(date);
            const isCurrentMonth = date.getMonth() === monthStart.getMonth();
            const dateKey = format(date, 'yyyy-MM-dd');
            const weather = weatherData[dateKey];
            const isTodayDate = isToday(date);

            // Modern cell style
            let cellClasses = getDayClasses(date, isSelected, canSelect, isCurrentMonth, availability) +
              ' rounded-md font-semibold transition-transform duration-150 ease-in-out';
            if (canSelect && isCurrentMonth && !isSelected) {
              cellClasses += ' hover:scale-105 hover:shadow-md focus:scale-105 focus:shadow-md';
            }
            if (isTodayDate) {
              cellClasses += ' ring-2 ring-semin-blue';
            }

            return (
              <button
                key={date.toISOString()}
                onClick={() => canSelect && onDateSelect(date)}
                className={cellClasses}
                disabled={!canSelect || !isCurrentMonth}
                style={{ minHeight: 48 }}
              >
                <div className="flex items-center h-7">
                  {isTodayDate ? (
                    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-semin-blue text-white font-bold text-base shadow">
                      {format(date, 'd')}
                    </span>
                  ) : (
                    <span className="text-base font-semibold text-left">
                      {format(date, 'd')}
                    </span>
                  )}
                </div>
                {isCurrentMonth && weather && (
                  <div className="text-xl mt-1">{weather.icon}</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {competitions.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-2">Nadcházející závody</h4>
          <div className="space-y-2">
            {competitions
              .filter(comp => new Date(comp.date) >= startOfDay(new Date()))
              .map(comp => (
                <div key={comp.id} className="flex items-center space-x-3 text-sm">
                  <div className="w-24 text-blue-800 font-medium">
                    {format(new Date(comp.date), 'dd.MM.yyyy')}
                  </div>
                  <div className="text-gray-900 font-medium">{comp.name}</div>
                </div>
              ))}
            <div className="pt-4">
              <span className="text-sm text-blue-900">V tyto dny není možné rezervovat lovné místo, ale můžete se </span>
              <a href="#competitions" className="text-sm font-medium text-purple-600 hover:text-purple-700 underline">
                přihlásit do závodu
              </a>
              <span className="text-sm text-blue-900">.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 