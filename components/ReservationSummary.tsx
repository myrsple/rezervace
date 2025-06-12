import React from 'react'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { FishingSpot } from '@/types'

interface ReservationSummaryProps {
  spot: FishingSpot
  date: Date
  duration: string
  timeSlot: string
}

export default function ReservationSummary({
  spot,
  date,
  duration,
  timeSlot
}: ReservationSummaryProps) {
  const getStartTime = () => {
    if (duration === 'day') return '6:00'
    // After schedule revamp, all 24h/48h reservations start at 12:00 (noon)
    return '12:00'
  }

  const getDurationText = () => {
    switch (duration) {
      case 'day': return '24 hodin'
      case '24h': return '24 hodin'
      case '48h': return '48 hodin'
      default: return ''
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-2">Shrnutí rezervace</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-blue-800">Datum:</span>
          <span className="text-gray-900 font-medium">
            {format(date, 'EEEE, d. MMMM yyyy', { locale: cs })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-blue-800">Začátek:</span>
          <span className="text-gray-900 font-medium">{getStartTime()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-blue-800">Délka:</span>
          <span className="text-gray-900 font-medium">{getDurationText()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-blue-800">Místo:</span>
          <span className="text-gray-900 font-medium">#{spot.number} - Lovné místo {spot.number}</span>
        </div>
      </div>
    </div>
  )
} 