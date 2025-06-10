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
    return timeSlot === 'morning' ? '6:00' : '18:00'
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
    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
      <h3 className="text-xl font-bold text-semin-blue mb-4">
        Shrnutí rezervace
      </h3>
      <div className="space-y-3">
        <div className="flex">
          <span className="text-gray-600 w-24">Datum:</span>
          <span className="font-medium text-gray-900">
            {format(date, 'EEEE, d. MMMM yyyy', { locale: cs })}
          </span>
        </div>
        <div className="flex">
          <span className="text-gray-600 w-24">Začátek:</span>
          <span className="font-medium text-gray-900">{getStartTime()}</span>
        </div>
        <div className="flex">
          <span className="text-gray-600 w-24">Délka:</span>
          <span className="font-medium text-gray-900">{getDurationText()}</span>
        </div>
        <div className="flex">
          <span className="text-gray-600 w-24">Místo:</span>
          <span className="font-medium text-gray-900">#{spot.number} - Lovné místo {spot.number}</span>
        </div>
      </div>
    </div>
  )
} 