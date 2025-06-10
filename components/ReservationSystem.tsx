'use client'

import React, { useState, useEffect } from 'react'
import FishingSpotSelector from './FishingSpotSelector'
import ReservationCalendar from './ReservationCalendar'
import BookingForm from './BookingForm'
import { FishingSpot, Reservation } from '@/types'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { getWeatherForDate, WeatherData } from '@/lib/weather'
import ReservationSummary from './ReservationSummary'

export default function ReservationSystem() {
  const [selectedSpot, setSelectedSpot] = useState<FishingSpot | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<string>('24h')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('morning')
  const [fishingSpots, setFishingSpots] = useState<FishingSpot[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [weatherForecast, setWeatherForecast] = useState<WeatherData | null>(null)

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
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    
    // Load weather forecast for selected date
    const forecast = getWeatherForDate(date)
    setWeatherForecast(forecast)
  }

  const handleReservationComplete = () => {
    // Refresh reservations after successful booking
    fetchReservations()
    // Reset form
    setSelectedDate(null)
    setSelectedSpot(null)
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
          <div className="relative w-1/2">
            <img 
              src="/lm-mapa.png" 
              alt="Mapa lovných míst" 
              className="w-full h-auto rounded-lg border border-gray-200 shadow-sm"
            />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
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
            Teď si vyberte datum 🗓️
          </h2>
          
          {/* Duration Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Délka rezervace
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <button
                  type="button"
                  onClick={() => setSelectedDuration('day')}
                  className={`p-6 border-2 rounded-2xl text-center transition-all duration-200 ${
                    selectedDuration === 'day'
                      ? 'border-semin-blue bg-semin-light-blue shadow-card'
                      : 'border-gray-200 hover:border-semin-blue hover:shadow-card'
                  }`}
                >
                  <div className={`font-bold text-lg ${selectedDuration === 'day' ? 'text-semin-blue' : 'text-semin-gray'}`}>
                    Jeden den
                  </div>
                  <div className={`text-sm ${selectedDuration === 'day' ? 'text-semin-blue/70' : 'text-semin-gray/70'}`}>
                    6:00 - 22:00
                  </div>
                  <div className="text-2xl font-bold text-semin-green">400 Kč</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedDuration('24h')}
                  className={`p-6 border-2 rounded-2xl text-center transition-all duration-200 ${
                    selectedDuration === '24h'
                      ? 'border-semin-blue bg-semin-light-blue shadow-card'
                      : 'border-gray-200 hover:border-semin-blue hover:shadow-card'
                  }`}
                >
                  <div className={`font-bold text-lg ${selectedDuration === '24h' ? 'text-semin-blue' : 'text-semin-gray'}`}>
                    24 hodin
                  </div>
                  <div className={`text-sm ${selectedDuration === '24h' ? 'text-semin-blue/70' : 'text-semin-gray/70'}`}>
                    Celý den
                  </div>
                  <div className="text-2xl font-bold text-semin-green">600 Kč</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDuration('48h')}
                  className={`p-6 border-2 rounded-2xl text-center transition-all duration-200 ${
                    selectedDuration === '48h'
                      ? 'border-semin-blue bg-semin-light-blue shadow-card'
                      : 'border-gray-200 hover:border-semin-blue hover:shadow-card'
                  }`}
                >
                  <div className={`font-bold text-lg ${selectedDuration === '48h' ? 'text-semin-blue' : 'text-semin-gray'}`}>
                    48 hodin
                  </div>
                  <div className={`text-sm ${selectedDuration === '48h' ? 'text-semin-blue/70' : 'text-semin-gray/70'}`}>
                    Dva celé dny
                  </div>
                  <div className="text-2xl font-bold text-semin-green">1000 Kč</div>
                </button>
            </div>
          </div>

          {/* Time Slot Selection (for 24h and 48h) */}
          {(selectedDuration === '24h' || selectedDuration === '48h') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Začátek rezervace
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedTimeSlot('morning')}
                  className={`p-4 border-2 rounded-2xl text-center transition-all duration-200 font-medium ${
                    selectedTimeSlot === 'morning'
                      ? 'border-semin-blue bg-semin-light-blue text-semin-blue shadow-card'
                      : 'border-gray-200 bg-white text-semin-gray hover:border-semin-blue hover:shadow-card'
                  }`}
                >
                  Ráno (6:00)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTimeSlot('evening')}
                  className={`p-4 border-2 rounded-2xl text-center transition-all duration-200 font-medium ${
                    selectedTimeSlot === 'evening'
                      ? 'border-semin-blue bg-semin-light-blue text-semin-blue shadow-card'
                      : 'border-gray-200 bg-white text-semin-gray hover:border-semin-blue hover:shadow-card'
                  }`}
                >
                  Večer (18:00)
                </button>
              </div>
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
      {selectedSpot && selectedDate && (
        <div className="bg-white rounded-2xl shadow-soft p-8">
          <h2 className="text-3xl font-bold text-semin-blue mb-6">
            Zbývá už jen potvrdit ✅
          </h2>

          {/* Reservation Summary */}
          <div className="mb-8">
            <ReservationSummary
              spot={selectedSpot}
              date={selectedDate}
              duration={selectedDuration}
              timeSlot={selectedTimeSlot}
            />
          </div>

          <BookingForm
            spot={selectedSpot}
            date={selectedDate}
            duration={selectedDuration}
            timeSlot={selectedTimeSlot}
            onComplete={handleReservationComplete}
          />
        </div>
      )}
    </div>
  )
} 