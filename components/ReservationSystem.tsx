'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import FishingSpotSelector from './FishingSpotSelector'
import ReservationCalendar from './ReservationCalendar'
import BookingForm from './BookingForm'
import { FishingSpot, Reservation } from '@/types'
import { format, addDays, startOfDay, addHours } from 'date-fns'
import { cs } from 'date-fns/locale'
import { getWeatherForDate, WeatherData } from '@/lib/weather'
import ReservationSummary from './ReservationSummary'
import useSWR from 'swr'

export default function ReservationSystem() {
  const [selectedSpot, setSelectedSpot] = useState<FishingSpot | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<string>('24h')
  const [selectedTimeSlot] = useState<string>('noon')
  const [fishingSpots, setFishingSpots] = useState<FishingSpot[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [weatherForecast, setWeatherForecast] = useState<WeatherData | null>(null)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  // Light-box for the lovná místa map
  const [showMap, setShowMap] = useState(false)
  const [mapZoom, setMapZoom] = useState(1)

  const fetcher = (url:string)=>fetch(url).then(r=>r.json())
  const { data: competitionsData } = useSWR('/api/competitions', fetcher)

  useEffect(() => {
    fetchFishingSpots()
    fetchReservations()
    // Force loading to false after a reasonable timeout
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  const fetchFishingSpots = async () => {
    try {
      const response = await fetch('/api/fishing-spots')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const text = await response.text()
      if (!text) {
        throw new Error('Empty response')
      }
      const spots = JSON.parse(text)
      setFishingSpots(spots)
    } catch (error) {
      console.error('Error fetching fishing spots:', error)
      setFishingSpots([]) // Set empty array on error
    }
  }

  const fetchReservations = async () => {
    try {
      const response = await fetch('/api/reservations')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const reservationsData = await response.json()
      if (!Array.isArray(reservationsData)) {
        throw new Error('Invalid response format')
      }
      setReservations(reservationsData)
    } catch (error) {
      console.error('Error fetching reservations:', error)
      setReservations([]) // Set empty array on error
    }
  }

  const handleSpotSelect = (spot: FishingSpot) => {
    setSelectedSpot(spot)
    setSelectedDate(null) // Reset date when spot changes

    // If selected spot does not allow long stays, force duration to 'day'
    const allowsLong = spot.name === 'Lovné místo VIP' || (spot.number && spot.number <= 6)
    if (!allowsLong && ['24h','48h','72h','96h'].includes(selectedDuration)) {
      setSelectedDuration('day')
    }

    if (allowsLong && selectedDuration === 'day') {
      // default to 24h if it's possible; otherwise 48h; else leave as day
      if (isDurationPossible('24h', null)) setSelectedDuration('24h')
      else if (isDurationPossible('48h', null)) setSelectedDuration('48h')
    }
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setWeatherForecast(getWeatherForDate(date))

    // Evaluate feasibility based on the date the user just clicked (not the stale state value)
    const dayOk = isDayPossible(date)
    const h24Ok = isDurationPossible('24h', date)
    const h48Ok = isDurationPossible('48h', date)
    const h72Ok = isDurationPossible('72h', date)
    const h96Ok = isDurationPossible('96h', date)

    let desired: string = selectedDuration
    if (selectedDuration === 'day' && !dayOk) {
      desired = h24Ok ? '24h' : h48Ok ? '48h' : h72Ok ? '72h' : h96Ok ? '96h' : selectedDuration
    } else if (selectedDuration === '24h' && !h24Ok) {
      desired = h48Ok ? '48h' : h72Ok ? '72h' : h96Ok ? '96h' : dayOk ? 'day' : selectedDuration
    } else if (selectedDuration === '48h' && !h48Ok) {
      desired = h72Ok ? '72h' : h96Ok ? '96h' : h24Ok ? '24h' : dayOk ? 'day' : selectedDuration
    } else if (selectedDuration === '72h' && !h72Ok) {
      desired = h96Ok ? '96h' : h48Ok ? '48h' : h24Ok ? '24h' : dayOk ? 'day' : selectedDuration
    } else if (selectedDuration === '96h' && !h96Ok) {
      desired = h72Ok ? '72h' : h48Ok ? '48h' : h24Ok ? '24h' : dayOk ? 'day' : selectedDuration
    }

    if (desired !== selectedDuration) {
      setSelectedDuration(desired)
    }
  }

  const isDurationPossible = (duration: '24h' | '48h' | '72h' | '96h', baseDate: Date | null = null) => {
    const dateToCheck = baseDate ?? selectedDate
    if (!dateToCheck || !selectedSpot) return true

    const spotRes = reservations.filter(r => r.fishingSpot?.number === selectedSpot.number && r.status !== 'CANCELLED')

    const isHalfBooked = (date: Date, half: 'morning' | 'evening') => {
      const halfStart = new Date(date)
      const halfEnd = new Date(date)
      if (half === 'morning') {
        halfStart.setHours(0,0,0,0)
        halfEnd.setHours(12,0,0,0)
      } else {
        halfStart.setHours(12,0,0,0)
        halfEnd.setDate(halfEnd.getDate()+1)
        halfEnd.setHours(0,0,0,0)
      }
      return spotRes.some(res=>{
        const s = new Date(res.startDate); const e = new Date(new Date(res.endDate).getTime()-1)
        return e>halfStart && s<halfEnd
      })
    }

    const isCompetitionDay = (d: Date)=>{
      if (!competitionsData) return false
      return competitionsData.some((c: any)=>{
        const compStart = new Date(c.date)
        const compEnd = c.endDate ? new Date(c.endDate) : addHours(compStart, 24)

        // Single-day competition (≤24 h) blocks only the start calendar day
        const durationMs = compEnd.getTime() - compStart.getTime()
        const dayStart = startOfDay(d)
        if (durationMs <= 24*60*60*1000) {
          return dayStart.getTime() === startOfDay(compStart).getTime()
        }

        // Multi-day competition blocks a range
        const rangeStart = startOfDay(compStart)
        const rangeEnd = startOfDay(compEnd)
        return dayStart >= rangeStart && dayStart <= rangeEnd
      })
    }

    if (duration === '24h') {
      if(isCompetitionDay(dateToCheck)||isCompetitionDay(addDays(dateToCheck,1))) return false
      return !(isHalfBooked(dateToCheck,'evening') || isHalfBooked(addDays(dateToCheck,1),'morning'))
    }
    if (duration === '48h') {
      if([dateToCheck,addDays(dateToCheck,1),addDays(dateToCheck,2)].some(isCompetitionDay)) return false
      return !(isHalfBooked(dateToCheck,'evening') ||
               isHalfBooked(addDays(dateToCheck,1),'morning') ||
               isHalfBooked(addDays(dateToCheck,1),'evening') ||
               isHalfBooked(addDays(dateToCheck,2),'morning'))
    }
    if (duration === '72h') {
      if([dateToCheck,addDays(dateToCheck,1),addDays(dateToCheck,2),addDays(dateToCheck,3)].some(isCompetitionDay)) return false
      return !(isHalfBooked(dateToCheck,'evening') ||
               isHalfBooked(addDays(dateToCheck,1),'morning') ||
               isHalfBooked(addDays(dateToCheck,1),'evening') ||
               isHalfBooked(addDays(dateToCheck,2),'morning') ||
               isHalfBooked(addDays(dateToCheck,2),'evening') ||
               isHalfBooked(addDays(dateToCheck,3),'morning'))
    }
    if (duration === '96h') {
      if([dateToCheck,addDays(dateToCheck,1),addDays(dateToCheck,2),addDays(dateToCheck,3),addDays(dateToCheck,4)].some(isCompetitionDay)) return false
      return !(isHalfBooked(dateToCheck,'evening') ||
               isHalfBooked(addDays(dateToCheck,1),'morning') ||
               isHalfBooked(addDays(dateToCheck,1),'evening') ||
               isHalfBooked(addDays(dateToCheck,2),'morning') ||
               isHalfBooked(addDays(dateToCheck,2),'evening') ||
               isHalfBooked(addDays(dateToCheck,3),'morning') ||
               isHalfBooked(addDays(dateToCheck,3),'evening') ||
               isHalfBooked(addDays(dateToCheck,4),'morning'))
    }
    return true
  }

  const isDayPossible = (baseDate: Date | null = null) => {
    const dateToCheck = baseDate ?? selectedDate
    if (!dateToCheck || !selectedSpot) return true

    // VIP and spots 1-6 cannot be booked for single-day reservations
    if (selectedSpot.name === 'Lovné místo VIP' || (selectedSpot.number && selectedSpot.number <= 6)) {
      return false
    }
    const spotRes = reservations.filter(r=> r.fishingSpot?.number === selectedSpot.number && r.status!=='CANCELLED')
    const halfBooked=(half:'morning'|'evening')=>{
      const start=new Date(dateToCheck)
      const end=new Date(dateToCheck)
      if(half==='morning'){start.setHours(0,0,0,0); end.setHours(12,0,0,0)}
      else{start.setHours(12,0,0,0); end.setDate(end.getDate()+1); end.setHours(0,0,0,0)}
      return spotRes.some(res=>{const s=new Date(res.startDate); const e=new Date(new Date(res.endDate).getTime()-1); return e>start && s<end})
    }
    const isCompetitionDayInline = (competitionsData??[]).some((c:any)=>{
      const startC = startOfDay(new Date(c.date))
      const endC = c.endDate ? startOfDay(new Date(c.endDate)) : startOfDay(addHours(new Date(c.date),24))
      const d = startOfDay(dateToCheck)
      return d >= startC && d <= endC
    })
    return !(halfBooked('morning')||halfBooked('evening')||isCompetitionDayInline)
  }

  const handleReservationComplete = () => {
    // Refresh reservations after successful booking
    fetchReservations()
    setBookingConfirmed(true)
    
    // Don't reset the form state immediately
    // The user needs to see the success message first
  }

  const getPrice = (durationKey: string): number => {
    const isVIP = selectedSpot ? (selectedSpot.name === 'Lovné místo VIP' || selectedSpot.number === 99) : false
    if (isVIP) {
      const vipMap: Record<string, number> = { '24h': 1200, '48h': 2000, '72h': 3200, '96h': 4000 }
      return vipMap[durationKey] || 0
    }
    const stdMap: Record<string, number> = { 'day': 200, '24h': 350, '48h': 600, '72h': 950, '96h': 1200 }
    return stdMap[durationKey] || 0
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-semin-blue"></div>
        <p className="text-semin-gray font-medium mt-4">Načítám lovná místa...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Step 1: Select Fishing Spot */}
      <div className="bg-white rounded-2xl shadow-soft p-8">
        <h2 className="text-3xl font-bold text-semin-blue mb-6">
          Nejdřív si zvolte lovné místo 🎣
        </h2>
        
        {/* Fishing Spots Map */}
        <div className="mb-6 flex justify-center">
          <div className="relative w-full lg:w-4/5">
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="block w-full focus:outline-none"
            >
              <img 
                src="/lm-mapa.png" 
                alt="Mapa lovných míst" 
                className="w-full h-auto rounded-lg border border-gray-200 shadow-sm"
              />
            </button>
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs pointer-events-none">
              Mapa lovných míst
            </div>
          </div>
        </div>

        <FishingSpotSelector
          spots={fishingSpots}
          selectedSpot={selectedSpot}
          onSpotSelect={handleSpotSelect}
        />
      </div>

      {/* Step 2: Choose Date and Duration */}
      {selectedSpot && (
        <div className="bg-white rounded-2xl shadow-soft p-8">
          {!selectedSpot.isActive && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">Lovné místo není dostupné</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Toto lovné místo bylo dočasně deaktivováno. Prosím vyberte si jiné místo.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <h2 className="text-3xl font-bold text-semin-blue mb-6">
            Teď délku rezervace a termín 🗓️
          </h2>
          
          {/* Duration Selection */}
          <div className="mb-6">
            {(()=>{
              const longOnly = selectedSpot ? (selectedSpot.name === 'Lovné místo VIP' || (selectedSpot.number && selectedSpot.number <= 6)) : false
              const dayOnly = selectedSpot ? !(selectedSpot.name === 'Lovné místo VIP' || (selectedSpot.number && selectedSpot.number <= 6)) : false
              const containerClasses = dayOnly ? 'flex justify-center' : (longOnly ? 'flex flex-wrap justify-center gap-4' : 'grid grid-cols-1 md:grid-cols-3 gap-4 justify-items-center')
              const extraCols = longOnly ? '' : ''
              return (
                <div className={containerClasses}>
                  {(() => {
                    const allowsLong = selectedSpot ? (selectedSpot.name === 'Lovné místo VIP' || (selectedSpot.number && selectedSpot.number <= 6)) : false
                    if(allowsLong) return null
                    const unavailable = !isDayPossible()
                    return (
                      <button
                        type="button"
                        onClick={() => !unavailable && setSelectedDuration('day')}
                        className={`w-full md:w-64 p-6 border-2 rounded-2xl text-center transition-all duration-200 ${unavailable ? 'opacity-40 cursor-not-allowed border-gray-200' : selectedDuration === 'day' ? 'border-semin-blue bg-semin-light-blue shadow-card' : 'border-gray-200 hover:border-semin-blue hover:shadow-card'}`}
                        disabled={unavailable}
                      >
                        <div className={`font-bold text-lg ${selectedDuration === 'day' ? 'text-semin-blue' : 'text-semin-gray'}`}>Denní</div>
                        <div className={`text-sm ${selectedDuration === 'day' ? 'text-semin-blue/70' : 'text-semin-gray/70'}`}>8:00 - 22:00</div>
                        <div className="text-2xl font-bold text-semin-green">200,-</div>
                      </button>
                    )
                  })()}
                
                  {(() => {
                    const allowsLong = selectedSpot ? (selectedSpot.name === 'Lovné místo VIP' || (selectedSpot.number && selectedSpot.number <= 6)) : true
                    if(!allowsLong) return null
                    const unavailable = !isDurationPossible('24h')
                    return (
                      <button
                        type="button"
                        onClick={() => !unavailable && setSelectedDuration('24h')}
                        className={`w-full md:w-64 p-6 border-2 rounded-2xl text-center transition-all duration-200 ${unavailable ? 'opacity-40 cursor-not-allowed border-gray-200' : selectedDuration === '24h' ? 'border-semin-blue bg-semin-light-blue shadow-card' : 'border-gray-200 hover:border-semin-blue hover:shadow-card'}`}
                        disabled={unavailable}
                      >
                        <div className={`font-bold text-lg ${selectedDuration === '24h' ? 'text-semin-blue' : 'text-semin-gray'}`}>24 hodin</div>
                        <div className={`text-sm ${selectedDuration === '24h' ? 'text-semin-blue/70' : 'text-semin-gray/70'}`}>Poledne – Poledne</div>
                        <div className="text-2xl font-bold text-semin-green">{getPrice('24h')},-</div>
                      </button>
                    )
                  })()}

                  {(() => {
                    const allowsLong = selectedSpot ? (selectedSpot.name === 'Lovné místo VIP' || (selectedSpot.number && selectedSpot.number <= 6)) : true
                    if(!allowsLong) return null
                    const unavailable = !isDurationPossible('48h')
                    return (
                      <button
                        type="button"
                        onClick={() => !unavailable && setSelectedDuration('48h')}
                        className={`w-full md:w-64 p-6 border-2 rounded-2xl text-center transition-all duration-200 ${unavailable ? 'opacity-40 cursor-not-allowed border-gray-200' : selectedDuration === '48h' ? 'border-semin-blue bg-semin-light-blue shadow-card' : 'border-gray-200 hover:border-semin-blue hover:shadow-card'}`}
                        disabled={unavailable}
                      >
                        <div className={`font-bold text-lg ${selectedDuration === '48h' ? 'text-semin-blue' : 'text-semin-gray'}`}>48 hodin</div>
                        <div className={`text-sm ${selectedDuration === '48h' ? 'text-semin-blue/70' : 'text-semin-gray/70'}`}>Poledne – Den – Poledne</div>
                        <div className="text-2xl font-bold text-semin-green">{getPrice('48h')},-</div>
                      </button>
                    )
                  })()}

                  {(() => {
                    const allowsLong = selectedSpot ? (selectedSpot.name === 'Lovné místo VIP' || (selectedSpot.number && selectedSpot.number <= 6)) : true
                    if(!allowsLong) return null
                    const unavailable = !isDurationPossible('72h')
                    return (
                      <button type="button"
                        onClick={() => !unavailable && setSelectedDuration('72h')}
                        className={`w-full md:w-64 p-6 border-2 rounded-2xl text-center transition-all duration-200 ${unavailable ? 'opacity-40 cursor-not-allowed border-gray-200' : selectedDuration === '72h' ? 'border-semin-blue bg-semin-light-blue shadow-card' : 'border-gray-200 hover:border-semin-blue hover:shadow-card'}`}
                        disabled={unavailable}>
                        <div className={`font-bold text-lg ${selectedDuration==='72h'?'text-semin-blue':'text-semin-gray'}`}>72 hodin</div>
                        <div className={`text-sm ${selectedDuration==='72h'?'text-semin-blue/70':'text-semin-gray/70'}`}>Poledne – 2 dny – Poledne</div>
                        <div className="text-2xl font-bold text-semin-green">{getPrice('72h')},-</div>
                      </button>
                    )
                  })()}

                  {(() => {
                    const allowsLong = selectedSpot ? (selectedSpot.name === 'Lovné místo VIP' || (selectedSpot.number && selectedSpot.number <= 6)) : true
                    if(!allowsLong) return null
                    const unavailable = !isDurationPossible('96h')
                    return (
                      <button type="button"
                        onClick={() => !unavailable && setSelectedDuration('96h')}
                        className={`w-full md:w-64 p-6 border-2 rounded-2xl text-center transition-all duration-200 ${unavailable ? 'opacity-40 cursor-not-allowed border-gray-200' : selectedDuration === '96h' ? 'border-semin-blue bg-semin-light-blue shadow-card' : 'border-gray-200 hover:border-semin-blue hover:shadow-card'}`}
                        disabled={unavailable}>
                        <div className={`font-bold text-lg ${selectedDuration==='96h'?'text-semin-blue':'text-semin-gray'}`}>96 hodin</div>
                        <div className={`text-sm ${selectedDuration==='96h'?'text-semin-blue/70':'text-semin-gray/70'}`}>Poledne – 3 dny – Poledne</div>
                        <div className="text-2xl font-bold text-semin-green">{getPrice('96h')},-</div>
                      </button>
                    )
                  })()}
                </div>
              )
            })()}
          </div>

          {/* Day-only notice – shown directly under the duration buttons for better visibility */}
          {selectedDuration === 'day' && selectedDate && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mt-4 mb-6">
              <h3 className="text-lg font-bold text-yellow-800 mb-1">Denní rezervace</h3>
              <p className="text-yellow-700 text-sm">
                Pro ověření nám prosím zavolejte na&nbsp;
                <a href="tel:+420773291941" className="font-medium no-underline">+420&nbsp;773&nbsp;291&nbsp;941</a>.
              </p>
            </div>
          )}

          <ReservationCalendar
            spot={selectedSpot}
            reservations={reservations}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            duration={selectedDuration}
            timeSlot={selectedTimeSlot}
          />
        </div>
      )}

      {/* Step 3: Booking Form */}
      {selectedSpot && selectedDate && selectedDuration !== 'day' && (
        <div className="bg-white rounded-2xl shadow-soft p-8">
          {!bookingConfirmed && (
            <>
              <h2 className="text-3xl font-bold text-semin-blue mb-6">Zbývá už jen potvrdit ✅</h2>
              <div className="mb-8">
                <ReservationSummary
                  spot={selectedSpot}
                  date={selectedDate}
                  duration={selectedDuration}
                  timeSlot={selectedTimeSlot}
                />
              </div>
            </>
          )}

          <BookingForm
            spot={selectedSpot}
            date={selectedDate}
            duration={selectedDuration}
            timeSlot={selectedTimeSlot}
            onComplete={handleReservationComplete}
          />
        </div>
      )}

      {/* Lightbox for map */}
      {showMap && typeof window !== 'undefined' && createPortal(
         <div
           className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
           onClick={() => setShowMap(false)}
         >
           <div
             className="relative"
             onWheel={(e)=>{
               e.preventDefault();
               e.stopPropagation();
               setMapZoom(prev=>{
                 const next = e.deltaY < 0 ? prev + 0.1 : prev - 0.1
                 return Math.min(4, Math.max(1, parseFloat(next.toFixed(2))))
               })
             }}
           >
             <img
               src="/lm-mapa.png"
               alt="Mapa lovných míst – detail"
               className="max-w-full max-h-[90vh] rounded-lg shadow-xl transition-transform"
               style={{ transform: `scale(${mapZoom})` }}
             />

             {/* Zoom controls */}
             <div className="absolute bottom-2 right-2 flex flex-col gap-2">
               <button
                 onClick={(e)=>{e.stopPropagation(); setMapZoom(z=>Math.min(4, +(z+0.2).toFixed(2)))} }
                 className="bg-white/90 hover:bg-white text-gray-800 font-bold py-1 px-2 rounded"
                 aria-label="Přiblížit"
               >+
               </button>
               <button
                 onClick={(e)=>{e.stopPropagation(); setMapZoom(z=>Math.max(1, +(z-0.2).toFixed(2)))} }
                 className="bg-white/90 hover:bg-white text-gray-800 font-bold py-1 px-2 rounded"
                 aria-label="Oddálit"
               >−
               </button>
             </div>
           </div>

           <button
             onClick={(e) => {
               e.stopPropagation()
               setShowMap(false)
               setMapZoom(1)
             }}
             className="absolute top-4 right-4 text-white text-3xl font-bold select-none"
             aria-label="Zavřít"
           >
             ×
           </button>
         </div>,
         document.body
       )}
    </div>
  )
} 