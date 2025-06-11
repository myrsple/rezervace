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
  onDateSelect: (date: Date, availableHalf?: 'morning' | 'evening' | null) => void
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

  const getDateAvailability = (date: Date): 'available' | 'occupied' | 'competition' | 'past' => {
    const dayStart = startOfDay(date)
    const today = startOfDay(new Date())

    if (isBefore(dayStart, today)) {
      return 'past'
    }

    const hasCompetition = competitions.some(competition => {
      const competitionDate = startOfDay(new Date(competition.date))
      const endDate = addHours(competitionDate, 24)
      const visibilityEndDate = addHours(endDate, 48)
      const now = new Date()
      return competitionDate.getTime() === dayStart.getTime() && competition.isActive && isBefore(now, visibilityEndDate)
    })

    if (hasCompetition) {
      return 'competition'
    }

    const dayReservations = spotReservations.filter(reservation => {
      const reservationStart = new Date(reservation.startDate)
      const reservationEnd = new Date(reservation.endDate)
      const dayStart = startOfDay(date)
      const dayEnd = addDays(dayStart, 1)
      return reservationStart < dayEnd && reservationEnd > dayStart
    })

    if (dayReservations.length === 0) {
      return 'available'
    }

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
      return 'available'
    }

    return 'available'
  }

  const canSelectDate = (date: Date): boolean => {
    const dayStart = startOfDay(date);
    const today = startOfDay(new Date());
    if (isBefore(dayStart, today)) return false;
    // Use the same logic as in the render to determine if the day is split
    function getHalvesBooked(day: Date) {
      const reservations = spotReservations.filter(reservation => {
        const reservationStart = new Date(reservation.startDate)
        const reservationEnd = new Date(reservation.endDate)
        const dayStart = startOfDay(day)
        const dayEnd = addDays(dayStart, 1)
        return reservationStart < dayEnd && reservationEnd > dayStart
      })
      let morningBooked = false;
      let eveningBooked = false;
      for (const res of reservations) {
        const resStart = new Date(res.startDate);
        const resEnd = new Date(res.endDate);
        if (resEnd > new Date(day.setHours(6,0,0,0)) && resStart < new Date(day.setHours(18,0,0,0))) {
          morningBooked = true;
        }
        if (resEnd > new Date(day.setHours(18,0,0,0)) && resStart < new Date(addDays(day,1).setHours(6,0,0,0))) {
          eveningBooked = true;
        }
      }
      return { morningBooked, eveningBooked };
    }
    if (duration === '48h') {
      const days = [date, addDays(date, 1), addDays(date, 2)];
      for (const d of days) {
        // Prevent selection if any day is a competition
        if (getDateAvailability(d) === 'competition') return false;
        const { morningBooked, eveningBooked } = getHalvesBooked(d);
        if (morningBooked || eveningBooked) return false;
      }
      return true;
    }
    // Allow selection if at least one half is available for other durations
    const { morningBooked, eveningBooked } = getHalvesBooked(date);
    if (!morningBooked || !eveningBooked) return true;
    // Otherwise, fall back to previous logic
    const availability = getDateAvailability(date);
    if (availability === 'past' || availability === 'occupied' || availability === 'competition') return false;
    return true;
  }

  const getDayClasses = (
    date: Date,
    isSelected: boolean,
    canSelect: boolean,
    isCurrentMonth: boolean,
    availability: 'available' | 'occupied' | 'competition' | 'past'
  ): string => {
    const baseClasses = "min-h-[60px] p-1 flex flex-col justify-between text-left transition-all duration-200 text-sm"
    if (!isCurrentMonth) {
      return `${baseClasses} bg-gray-50/50 text-gray-300 cursor-not-allowed`
    }
    if (isSelected) {
      return `${baseClasses} bg-semin-blue/10 text-semin-blue ring-2 ring-semin-blue font-medium shadow-sm`
    }
    switch (availability) {
      case 'available':
        return `${baseClasses} bg-green-200 hover:bg-green-300 text-gray-800 hover:text-green-900 cursor-pointer ring-1 ring-green-300 hover:ring-green-400`
      case 'occupied':
        return `${baseClasses} bg-red-200 text-gray-700 cursor-not-allowed ring-1 ring-red-300`
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
            const isCurrentMonth = date.getMonth() === monthStart.getMonth();
            const isSelected = !!(selectedDate && isSameDay(date, selectedDate));
            const canSelect = canSelectDate(date);
            const dateKey = format(date, 'yyyy-MM-dd');
            const weather = weatherData[dateKey];
            const isTodayDate = isToday(date);

            // Use getDateAvailability to determine the true state (competition, occupied, split, available, past)
            const availability = getDateAvailability(date);

            // Define morning and evening half boundaries
            const morningStart = new Date(date);
            morningStart.setHours(6, 0, 0, 0);
            const morningEnd = new Date(date);
            morningEnd.setHours(18, 0, 0, 0);
            const eveningStart = new Date(date);
            eveningStart.setHours(18, 0, 0, 0);
            const eveningEnd = new Date(date);
            eveningEnd.setDate(eveningEnd.getDate() + 1);
            eveningEnd.setHours(6, 0, 0, 0);

            // Find all reservations for this day
            const dayReservations = spotReservations.filter(reservation => {
              const reservationStart = new Date(reservation.startDate)
              const reservationEnd = new Date(reservation.endDate)
              const dayStart = startOfDay(date)
              const dayEnd = addDays(dayStart, 1)
              return reservationStart < dayEnd && reservationEnd > dayStart
            })

            // Check if morning or evening is booked
            let morningBooked = false;
            let eveningBooked = false;
            for (const res of dayReservations) {
              const resStart = new Date(res.startDate);
              const resEnd = new Date(res.endDate);
              // Morning is booked if any reservation overlaps 6:00–18:00
              if (resEnd > morningStart && resStart < morningEnd) {
                morningBooked = true;
              }
              // Evening is booked if any reservation overlaps 18:00–6:00 next day
              if (resEnd > eveningStart && resStart < eveningEnd) {
                eveningBooked = true;
              }
            }

            // Determine tile type
            let tileType = 'available';
            if (availability === 'competition') {
              tileType = 'competition';
            } else if (morningBooked && eveningBooked) {
              tileType = 'occupied';
            } else if (morningBooked || eveningBooked) {
              tileType = 'split';
            }

            // Update highlight logic for preview overlay:
            let isInSelectedRange = false;
            let isInSelectedHalf: 'morning' | 'evening' | 'full' | null = null;
            if (selectedDate && duration === 'day') {
              isInSelectedRange = isSameDay(date, selectedDate);
              isInSelectedHalf = 'full';
            } else if (selectedDate && duration === '24h') {
              const start = startOfDay(selectedDate);
              const next = addDays(start, 1);
              if (timeSlot === 'morning') {
                // Highlight full selected day and next day's morning
                if (isSameDay(date, selectedDate)) {
                  isInSelectedRange = true;
                  isInSelectedHalf = 'full';
                } else if (isSameDay(date, next)) {
                  isInSelectedRange = true;
                  isInSelectedHalf = 'morning';
                }
              } else if (timeSlot === 'evening') {
                // Highlight selected day's evening and next day's full
                if (isSameDay(date, selectedDate)) {
                  isInSelectedRange = true;
                  isInSelectedHalf = 'evening';
                } else if (isSameDay(date, next)) {
                  isInSelectedRange = true;
                  isInSelectedHalf = 'full';
                }
              }
            } else if (selectedDate && duration === '48h') {
              const start = startOfDay(selectedDate);
              const next = addDays(start, 1);
              const next2 = addDays(start, 2);
              if (timeSlot === 'morning') {
                // Highlight full selected day, next day, and next2 morning
                if (isSameDay(date, selectedDate) || isSameDay(date, next)) {
                  isInSelectedRange = true;
                  isInSelectedHalf = 'full';
                } else if (isSameDay(date, next2)) {
                  isInSelectedRange = true;
                  isInSelectedHalf = 'morning';
                }
              } else if (timeSlot === 'evening') {
                // Highlight selected day's evening, next day full, next2 full
                if (isSameDay(date, selectedDate)) {
                  isInSelectedRange = true;
                  isInSelectedHalf = 'evening';
                } else if (isSameDay(date, next) || isSameDay(date, next2)) {
                  isInSelectedRange = true;
                  isInSelectedHalf = 'full';
                }
              }
            }

            // Use getDayClasses with the correct tileType
            let cellClasses = getDayClasses(date, isSelected, canSelect, isCurrentMonth, tileType as any) + ' rounded-md font-semibold transition-transform duration-150 ease-in-out';
            if (canSelect && isCurrentMonth && !isSelected && tileType !== 'competition') {
              cellClasses += ' hover:scale-105 hover:shadow-md focus:scale-105 focus:shadow-md';
            }
            if (isTodayDate) {
              cellClasses += ' ring-2 ring-semin-blue';
            }
            if (isInSelectedRange && isCurrentMonth && isInSelectedHalf === 'morning') {
              cellClasses += ' bg-blue-100 ring-2 ring-blue-400';
            } else if (isInSelectedRange && isCurrentMonth && isInSelectedHalf === 'evening') {
              cellClasses += ' bg-blue-100 ring-2 ring-blue-400';
            } else if (isInSelectedRange && isCurrentMonth && isInSelectedHalf === 'full') {
              cellClasses += ' bg-blue-100 ring-2 ring-blue-400';
            }

            // Render competition tile as purple, unclickable, no split logic
            if (tileType === 'competition') {
              return (
                <button
                  key={date.toISOString()}
                  className={getDayClasses(date, isSelected, false, isCurrentMonth, 'competition') + ' rounded-md font-semibold cursor-not-allowed'}
                  disabled
                  style={{ minHeight: 48, position: 'relative', overflow: 'hidden' }}
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
              );
            }

            return (
              <button
                key={date.toISOString()}
                onClick={() => {
                  if (!canSelect || !isCurrentMonth) return;
                  // Determine which half is available
                  let availableHalf: 'morning' | 'evening' | null = null;
                  if (tileType === 'split') {
                    if (!morningBooked) availableHalf = 'morning';
                    if (!eveningBooked) availableHalf = 'evening';
                  }
                  onDateSelect(date, availableHalf);
                }}
                className={cellClasses}
                disabled={!canSelect || !isCurrentMonth}
                style={{ minHeight: 48, position: 'relative', overflow: 'hidden' }}
              >
                {/* Split tile rendering */}
                {tileType === 'split' && isCurrentMonth && !isSelected ? (
                  <>
                    {/* If morning is booked, left/top is red, right/bottom is green. If evening is booked, left/top is green, right/bottom is red. */}
                    <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}>
                      {morningBooked ? (
                        <div style={{width: '100%', height: '100%', background: 'linear-gradient(135deg, #fecaca 50%, #bbf7d0 50%)', opacity: 1, zIndex: 0, position: 'absolute', top: 0, left: 0}}></div>
                      ) : (
                        <div style={{width: '100%', height: '100%', background: 'linear-gradient(135deg, #bbf7d0 50%, #fecaca 50%)', opacity: 1, zIndex: 0, position: 'absolute', top: 0, left: 0}}></div>
                      )}
                    </div>
                    <div style={{position: 'relative', zIndex: 1}}>
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
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
                {isInSelectedRange && isCurrentMonth && isInSelectedHalf === 'morning' ? (
                  <>
                    {/* Half-cell highlight and outline using the same diagonal as availability */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 10,
                      pointerEvents: 'none',
                      background: 'linear-gradient(135deg, #60a5fa 50%, transparent 50%)',
                      opacity: 0.7,
                      borderTopLeftRadius: '0.5rem',
                      borderBottomLeftRadius: '0.5rem',
                      borderTopRightRadius: '0.5rem',
                      borderBottomRightRadius: '0.5rem',
                      boxShadow: isSelected ? '-2px 0 0 0 #2563eb, 0 -2px 0 0 #2563eb' : undefined,
                      borderLeft: isSelected ? '2px solid #2563eb' : undefined,
                      borderTop: isSelected ? '2px solid #2563eb' : undefined,
                    }}></div>
                  </>
                ) : isInSelectedRange && isCurrentMonth && isInSelectedHalf === 'evening' ? (
                  <>
                    {/* Half-cell highlight and outline using the same diagonal as availability */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 10,
                      pointerEvents: 'none',
                      background: 'linear-gradient(135deg, transparent 50%, #60a5fa 50%)',
                      opacity: 0.7,
                      borderTopLeftRadius: '0.5rem',
                      borderBottomLeftRadius: '0.5rem',
                      borderTopRightRadius: '0.5rem',
                      borderBottomRightRadius: '0.5rem',
                      boxShadow: isSelected ? '2px 0 0 0 #2563eb, 0 2px 0 0 #2563eb' : undefined,
                      borderRight: isSelected ? '2px solid #2563eb' : undefined,
                      borderBottom: isSelected ? '2px solid #2563eb' : undefined,
                    }}></div>
                  </>
                ) : isInSelectedRange && isCurrentMonth && isInSelectedHalf === 'full' ? (
                  <>
                    {/* Full-cell highlight and outline */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: '#60a5fa',
                      opacity: 0.7,
                      zIndex: 10,
                      pointerEvents: 'none',
                      border: isSelected ? '2px solid #2563eb' : undefined,
                      borderRadius: '0.5rem',
                    }}></div>
                  </>
                ) : null}
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