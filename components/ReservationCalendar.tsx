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
  const [competitionsLoading, setCompetitionsLoading] = useState(true)

  useEffect(() => {
    fetchCompetitions()
  }, [])

  const fetchCompetitions = async () => {
    setCompetitionsLoading(true)
    try {
      const response = await fetch('/api/competitions')
      if (response.ok) {
        const data = await response.json()
        setCompetitions(data.filter((comp: Competition) => comp.isActive))
      }
    } catch (error) {
      console.error('Error fetching competitions:', error)
      setCompetitions([])
    } finally {
      setCompetitionsLoading(false)
    }
  }

  const spotReservations = useMemo(() => {
    return reservations.filter(reservation => 
      reservation.spotId === spot.id && 
      reservation.status !== 'CANCELLED'
    )
  }, [reservations, spot.id])

  const getDateAvailability = (date: Date): 'available' | 'occupied' | 'competition' | 'past' => {
    if (competitionsLoading) return 'past'

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
    if (competitionsLoading) return false

    const dayStart = startOfDay(date);
    const today = startOfDay(new Date());
    if (isBefore(dayStart, today)) return false;

    // helper to see if specific half of a day is booked
    const isHalfBooked = (day: Date, half: 'morning' | 'evening'): boolean => {
      const reservations = spotReservations.filter(res => {
        const resStart = new Date(res.startDate);
        const resEnd = new Date(res.endDate);
        const dayStart = startOfDay(day);
        const dayEnd = addDays(dayStart,1);
        return resStart < dayEnd && resEnd > dayStart;
      });
      const halfStart = new Date(day);
      const halfEnd = new Date(day);
      if (half === 'morning') {
        halfStart.setHours(0,0,0,0);
        halfEnd.setHours(12,0,0,0);
      } else {
        halfStart.setHours(12,0,0,0);
        halfEnd.setDate(halfEnd.getDate()+1);
        halfEnd.setHours(0,0,0,0);
      }
      return reservations.some(res => {
        const resStart = new Date(res.startDate);
        const resEnd = new Date(res.endDate);
        return resEnd > halfStart && resStart < halfEnd;
      });
    }

    // For 'day' duration: allow click if either full day is available (usual case)
    // OR if a 24h/48h stay could legitimately start here so that UI can auto-switch
    const dayAvailable = getDateAvailability(date) === 'available';
    if (dayAvailable) return true;

    // If not dayAvailable, evaluate if 24h or 48h would fit from this date.
    const eveningBusy = isHalfBooked(date,'evening');
    const nextMorningBusy = isHalfBooked(addDays(date,1),'morning');
    const day1MorningBusy = isHalfBooked(addDays(date,1),'morning');
    const day1EveningBusy = isHalfBooked(addDays(date,1),'evening');
    const day2MorningBusy = isHalfBooked(addDays(date,2),'morning');

    const can24hFromHere = !eveningBusy && !nextMorningBusy && getDateAvailability(date)!=='competition' && getDateAvailability(addDays(date,1))!=='competition';
    const can48hFromHere = !eveningBusy && !day1MorningBusy && !day1EveningBusy && !day2MorningBusy && [date, addDays(date,1), addDays(date,2)].every(d=>getDateAvailability(d)!=='competition');

    return can24hFromHere || can48hFromHere;
  }

  const getDayClasses = (
    date: Date,
    isSelected: boolean,
    canSelect: boolean,
    isCurrentMonth: boolean,
    availability: 'available' | 'occupied' | 'competition' | 'past'
  ): string => {
    const baseClasses = "min-h-[60px] p-1 flex flex-col justify-between text-left transition-all duration-200 text-sm"
    let extraDim = ''
    if (!isCurrentMonth) {
      extraDim = ' opacity-40 cursor-not-allowed'
    }

    // Determine classes based on availability first
    let availabilityClasses = ''
    switch (availability) {
      case 'available':
        availabilityClasses = `${baseClasses} bg-green-200 text-gray-800 ring-1 ring-green-300${!isCurrentMonth ? '' : ' hover:bg-green-300 hover:text-green-900 cursor-pointer hover:ring-semin-blue'}${extraDim}`
        break
      case 'occupied':
        availabilityClasses = `${baseClasses} bg-red-200 text-gray-700 cursor-not-allowed ring-1 ring-green-300${extraDim}`
        break
      case 'competition':
        availabilityClasses = `${baseClasses} bg-purple-200 text-purple-900 cursor-not-allowed ring-1 ring-green-300${extraDim}`
        break
      case 'past':
        availabilityClasses = `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed${extraDim}`
        break
      default:
        availabilityClasses = `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed${extraDim}`
    }

    // If selected, overlay ring & blue text but keep original background classes
    if (isSelected) {
      return `${availabilityClasses} text-semin-blue ring-2 ring-semin-blue font-medium shadow-sm`
    }

    return availabilityClasses
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-semin-blue">
          {spot.name === 'Lovné místo VIP' || spot.number === 99 ? 'Lovné místo VIP 👑' : `Lovné místo ${spot.number}`}
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

            // Define morning and evening half boundaries (00:00–12:00 and 12:00–24:00)
            const morningStart = new Date(date);
            morningStart.setHours(0, 0, 0, 0);
            const morningEnd = new Date(date);
            morningEnd.setHours(12, 0, 0, 0);
            const eveningStart = new Date(date);
            eveningStart.setHours(12, 0, 0, 0);
            const eveningEnd = new Date(date);
            eveningEnd.setDate(eveningEnd.getDate() + 1);
            eveningEnd.setHours(0, 0, 0, 0);

            // Find all reservations for this day
            const dayReservations = spotReservations.filter(reservation => {
              const reservationStart = new Date(reservation.startDate)
              const reservationEnd = new Date(reservation.endDate)
              const dayStart = startOfDay(date)
              const dayEnd = addDays(dayStart, 1)
              return reservationStart < dayEnd && reservationEnd > dayStart
            })

            // Check if morning or evening is booked (early = 00-12, late = 12-24)
            let morningBooked = false;
            let eveningBooked = false;
            for (const res of dayReservations) {
              const resStart = new Date(res.startDate)
              const resEnd = new Date(res.endDate)
              if (resEnd > morningStart && resStart < morningEnd) {
                morningBooked = true
              }
              if (resEnd > eveningStart && resStart < eveningEnd) {
                eveningBooked = true
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

            // Highlight preview for selected reservation (half-aware)
            let isInSelectedRange = false;
            let selectedHalf: 'morning' | 'evening' | 'full' | null = null;
            if (selectedDate) {
              const start = startOfDay(selectedDate)
              if (duration === '24h') {
                if (isSameDay(date, selectedDate)) {
                  isInSelectedRange = true;
                  selectedHalf = 'evening';
                } else if (isSameDay(date, addDays(selectedDate, 1))) {
                  isInSelectedRange = true;
                  selectedHalf = 'morning';
                }
              } else if (duration === '48h') {
                if (isSameDay(date, selectedDate)) {
                  isInSelectedRange = true;
                  selectedHalf = 'evening';
                } else if (isSameDay(date, addDays(selectedDate, 1))) {
                  isInSelectedRange = true;
                  selectedHalf = 'full';
                } else if (isSameDay(date, addDays(selectedDate, 2))) {
                  isInSelectedRange = true;
                  selectedHalf = 'morning';
                }
              } else if (duration === 'day') {
                isInSelectedRange = isSameDay(date, selectedDate);
                selectedHalf = 'full';
              }
            }

            // For visual styling choose:
            //  - 'past' remains past
            //  - split days use 'available' styling
            const styleAvailability = availability === 'past' ? 'past' : (tileType === 'split' ? 'available' : (tileType as any))
            let cellClasses = getDayClasses(date, isSelected, canSelect, isCurrentMonth, styleAvailability) + ' font-semibold transition-transform duration-150 ease-in-out';
            if (canSelect && isCurrentMonth && !isSelected && tileType !== 'competition') {
              cellClasses += ' hover:scale-105 hover:shadow-md focus:scale-105 focus:shadow-md';
            }

            // Render competition tile as purple, unclickable, no split logic
            if (tileType === 'competition') {
              return (
                <button
                  key={date.toISOString()}
                  className={getDayClasses(date, isSelected, false, isCurrentMonth, 'competition') + ' font-semibold cursor-not-allowed focus:outline-none'}
                  disabled
                  style={{ minHeight: 48, position: 'relative', overflow: 'hidden' }}
                >
                  <div className="flex items-center h-7 ml-[5px]">
                    {isTodayDate ? (
                      <span className="w-7 h-7 flex items-center justify-center rounded-full bg-semin-blue text-white font-bold text-base shadow" style={{marginLeft:'-4px'}}>
                        {format(date, 'd.')}
                      </span>
                    ) : (
                      <span className="text-base font-semibold text-left">
                        {format(date, 'd.')}
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
                  onDateSelect(date);
                }}
                className={cellClasses + ' hover:z-40 focus:z-40 focus:outline-none'}
                disabled={!canSelect || !isCurrentMonth}
                style={{ minHeight: 48, position: 'relative', overflow: 'visible', zIndex: isSelected ? 30 : undefined }}
              >
                {/* Split tile rendering with red half overlay */}
                {tileType === 'split' && isCurrentMonth && (
                  morningBooked ? (
                    <div className="absolute inset-y-0 left-0 w-1/2 bg-red-200 rounded-r-md" style={{opacity:1, zIndex:0}} />
                  ) : (
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-red-200 rounded-l-md" style={{opacity:1, zIndex:0}} />
                  )
                )}

                <div className="flex items-center h-7 ml-[5px] relative z-10">
                  {isTodayDate ? (
                    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-semin-blue text-white font-bold text-base shadow" style={{marginLeft:'-4px'}}>
                      {format(date, 'd.')}
                    </span>
                  ) : (
                    <span className="text-base font-semibold text-left">
                      {format(date, 'd.')}
                    </span>
                  )}
                </div>
                {isCurrentMonth && weather && (
                  <div className="text-xl mt-1 relative z-10">{weather.icon}</div>
                )}

                {/* Preview overlay for current selection – pale blue fill, no border */}
                {isInSelectedRange && selectedHalf && (
                  selectedHalf === 'full' ? (
                    <div className="absolute inset-0 bg-red-100 z-5" style={{opacity:0.65}}></div>
                  ) : selectedHalf === 'morning' ? (
                    <div className="absolute inset-y-0 left-0 w-1/2 bg-red-100 rounded-r-md z-5" style={{opacity:0.65}}></div>
                  ) : (
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-red-100 rounded-l-md z-5" style={{opacity:0.65}}></div>
                  )
                )}
              </button>
            )
          })}
        </div>
      </div>

      {competitions.length > 0 && (
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <h4 className="text-lg font-bold text-purple-900 mb-2">Nadcházející závody</h4>
          <div className="space-y-2">
            {competitions
              .filter(comp => new Date(comp.date) >= startOfDay(new Date()))
              .map(comp => (
                <div key={comp.id} className="flex items-center space-x-3 text-sm">
                  <div className="w-24 text-gray-700 font-medium">
                    {format(new Date(comp.date), 'dd. MM. yyyy')}
                  </div>
                  <div className="text-gray-900 font-medium">{comp.name}</div>
                </div>
              ))}
            <div className="pt-4">
              <span className="text-sm text-purple-900">V tyto dny není možné rezervovat lovné místo, ale můžete se </span>
              <a href="#competitions" className="text-sm font-medium text-purple-600 hover:text-purple-700 no-underline">
                přihlásit do závodu
              </a>
              <span className="text-sm text-purple-900">.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 