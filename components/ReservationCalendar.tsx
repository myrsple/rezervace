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

  // Match by business-facing "number" instead of internal DB id to avoid
  // potential offsets (e.g., VIP spot inserted first).
  const spotReservations = useMemo(() => {
    return reservations.filter(reservation => 
      reservation.fishingSpot?.number === spot.number && 
      reservation.status !== 'CANCELLED'
    )
  }, [reservations, spot.number])

  const getDateAvailability = (date: Date): 'available' | 'reserved' | 'occupied' | 'competition' | 'past' => {
    if (competitionsLoading) return 'past'

    const dayStart = startOfDay(date)
    const today = startOfDay(new Date())

    if (isBefore(dayStart, today)) {
      return 'past'
    }

    const hasCompetition = competitions.some(competition => {
      const compStart = new Date(competition.date)
      const compEnd = competition.endDate ? new Date(competition.endDate) : addHours(compStart, 24)

      // Calculate duration in ms
      const durationMs = compEnd.getTime() - compStart.getTime()

      // Single-day competition (≤ 24 h) → block ONLY the start day
      if (durationMs <= 24 * 60 * 60 * 1000) {
        const compStartDay = startOfDay(compStart)
        if (dayStart.getTime() !== compStartDay.getTime()) return false

        const visibilityEndDate = addHours(compEnd, 48)
        const now = new Date()
        return competition.isActive && isBefore(now, visibilityEndDate)
      }

      // Multi-day competition → block the whole inclusive date range
      const rangeStart = startOfDay(compStart)
      const rangeEnd = startOfDay(compEnd)
      const inRange = dayStart >= rangeStart && dayStart <= rangeEnd
      if (!inRange) return false

      const visibilityEndDate = addHours(compEnd, 48)
      const now = new Date()
      return competition.isActive && isBefore(now, visibilityEndDate)
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

    // Distinguish unpaid reservations that are still awaiting confirmation (isPaid===false)
    const hasPaid = dayReservations.some(reservation => reservation.isPaid)
    const hasUnpaid = dayReservations.some(reservation => !reservation.isPaid)

    // If the day only contains unpaid reservations, mark it as "reserved" (yellow)
    if (!hasPaid && hasUnpaid) {
      return 'reserved'
    }

    // Treat any non-"day" duration as a full-day / multi-day reservation so legacy
    // strings like "48 hodin" are also recognised.
    const hasFullDayReservation = dayReservations.some(reservation => reservation.duration !== 'day')
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
        const resEnd = new Date(new Date(res.endDate).getTime() - 1);
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
        const resEnd = new Date(new Date(res.endDate).getTime() - 1);
        return resEnd > halfStart && resStart < halfEnd;
      });
    }

    const dayAvailable = getDateAvailability(date) === 'available';

    // If the requested duration is a single-day booking but the selected spot only allows long stays, disallow selection
    const spotAllowsDay = !(spot.name === 'Lovné místo VIP' || (spot.number && spot.number <= 6));
    if (duration === 'day' && !spotAllowsDay) return false;

    // Only immediately return for a free day if we actually want a day booking
    if (dayAvailable && duration === 'day') return true;

    // If not dayAvailable, evaluate if 24h or 48h would fit from this date.
    const eveningBusy = isHalfBooked(date,'evening');
    const nextMorningBusy = isHalfBooked(addDays(date,1),'morning');
    const day1MorningBusy = isHalfBooked(addDays(date,1),'morning');
    const day1EveningBusy = isHalfBooked(addDays(date,1),'evening');
    const day2MorningBusy = isHalfBooked(addDays(date,2),'morning');

    const can24hFromHere = !eveningBusy && !nextMorningBusy && getDateAvailability(date)!=='competition' && getDateAvailability(addDays(date,1))!=='competition';
    const can48hFromHere = !eveningBusy && !day1MorningBusy && !day1EveningBusy && !day2MorningBusy && [date, addDays(date,1), addDays(date,2)].every(d=>getDateAvailability(d)!=='competition');
    const can72hFromHere = !eveningBusy && !day1MorningBusy && !day1EveningBusy && !day2MorningBusy && !isHalfBooked(addDays(date,2),'evening') && !isHalfBooked(addDays(date,3),'morning') && [date,addDays(date,1),addDays(date,2),addDays(date,3)].every(d=>getDateAvailability(d)!=='competition');
    const can96hFromHere = can72hFromHere && !isHalfBooked(addDays(date,3),'evening') && !isHalfBooked(addDays(date,4),'morning') && getDateAvailability(addDays(date,4))!=='competition';

    return can24hFromHere || can48hFromHere || can72hFromHere || can96hFromHere;
  }

  const getDayClasses = (
    date: Date,
    isSelected: boolean,
    canSelect: boolean,
    isCurrentMonth: boolean,
    availability: 'available' | 'reserved' | 'occupied' | 'competition' | 'past'
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
      case 'reserved':
        availabilityClasses = `${baseClasses} bg-yellow-200 text-gray-800 cursor-not-allowed ring-1 ring-yellow-300${extraDim}`
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
          <div className="w-3 h-3 rounded bg-yellow-200 ring-1 ring-yellow-300 mr-1.5"></div>
          <span className="text-gray-600">Rezervované</span>
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
              // Treat reservation end as exclusive (switchovers at noon)
              const resEnd = new Date(new Date(res.endDate).getTime() - 1)
              const dayStart = startOfDay(date)
              const dayEnd = addDays(dayStart, 1)
              if (resEnd > morningStart && resStart < morningEnd) {
                morningBooked = true
              }
              if (resEnd > eveningStart && resStart < eveningEnd) {
                eveningBooked = true
              }
            }

            // Determine tile type with half-day awareness for unpaid holds
            let tileType: 'available' | 'reserved' | 'reservedSplit' | 'occupied' | 'split' | 'competition' = 'available'

            const hasPaidRes = dayReservations.some(r => r.isPaid)
            const hasUnpaidRes = dayReservations.some(r => !r.isPaid)
            const allUnpaid = hasUnpaidRes && !hasPaidRes

            if (availability === 'competition') {
              tileType = 'competition'
            } else if (morningBooked && eveningBooked) {
              tileType = allUnpaid ? 'reserved' : 'occupied'
            } else if (morningBooked || eveningBooked) {
              tileType = allUnpaid ? 'reservedSplit' : 'split'
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
              } else if (duration === '72h') {
                if (isSameDay(date, selectedDate)) {
                  isInSelectedRange = true;
                  selectedHalf = 'evening';
                } else if (isSameDay(date, addDays(selectedDate, 1)) || isSameDay(date, addDays(selectedDate,2))) {
                  isInSelectedRange = true;
                  selectedHalf = 'full';
                } else if (isSameDay(date, addDays(selectedDate,3))) {
                  isInSelectedRange = true;
                  selectedHalf = 'morning';
                }
              } else if (duration === '96h') {
                if (isSameDay(date, selectedDate)) {
                  isInSelectedRange = true;
                  selectedHalf = 'evening';
                } else if (isSameDay(date, addDays(selectedDate, 1)) || isSameDay(date, addDays(selectedDate,2)) || isSameDay(date, addDays(selectedDate,3))) {
                  isInSelectedRange = true;
                  selectedHalf = 'full';
                } else if (isSameDay(date, addDays(selectedDate,4))) {
                  isInSelectedRange = true;
                  selectedHalf = 'morning';
                }
              } else if (duration === 'day') {
                isInSelectedRange = isSameDay(date, selectedDate);
                selectedHalf = 'full';
              }
            }

            // Map tileType to colour class group for background (base cell)
            const styleAvailability: 'available' | 'reserved' | 'occupied' | 'competition' | 'past' =
              tileType === 'reserved' ? 'reserved'
              : tileType === 'occupied' ? 'occupied'
              : tileType === 'competition' ? 'competition'
              : availability === 'past' ? 'past'
              : 'available'
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
                {/* Half-day overlay – red for paid, yellow for unpaid */}
                {(tileType === 'split' || tileType === 'reservedSplit') && availability !== 'past' && (
                  morningBooked ? (
                    <div className={`absolute inset-y-0 left-0 w-1/2 ${tileType==='reservedSplit'?'bg-yellow-200':'bg-red-200'} rounded-r-md`} style={{opacity:1, zIndex:0}} />
                  ) : (
                    <div className={`absolute inset-y-0 right-0 w-1/2 ${tileType==='reservedSplit'?'bg-yellow-200':'bg-red-200'} rounded-l-md`} style={{opacity:1, zIndex:0}} />
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
                    <div className="absolute inset-0 bg-blue-200 z-5" style={{opacity:0.55}}></div>
                  ) : selectedHalf === 'morning' ? (
                    <div className="absolute inset-y-0 left-0 w-1/2 bg-blue-200 rounded-r-md z-5" style={{opacity:0.55}}></div>
                  ) : (
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-blue-200 rounded-l-md z-5" style={{opacity:0.55}}></div>
                  )
                )}
              </button>
            )
          })}
        </div>
      </div>

      {competitions.length > 0 && (
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <h4 className="text-lg font-bold text-purple-900 mb-2">Nadcházející závody 🏆</h4>
          <div className="space-y-2">
            {competitions
              .filter(comp => {
                const today = startOfDay(new Date())
                const end = comp.endDate ? new Date(comp.endDate) : addHours(new Date(comp.date),24)
                return end >= today
              })
              .map(comp => (
                <div key={comp.id} className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 text-sm">
                  <div className="sm:w-48 text-gray-500 mb-0 sm:mb-0">
                    {format(new Date(comp.date), 'dd.MM.yyyy')}
                    {comp.endDate && (
                      <> – {format(new Date(comp.endDate), 'dd.MM.yyyy')}</>
                    )}
                  </div>
                  <div className="text-gray-900 font-semibold">{comp.name}</div>
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