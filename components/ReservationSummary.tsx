import React from 'react'
import { format, addDays } from 'date-fns'
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
  const getEndDate = (): Date => {
    const map: Record<string, number> = {
      'day': 0,
      '24h': 1,
      '48h': 2,
      '72h': 3,
      '96h': 4,
    }
    const add = map[duration] ?? 0
    return addDays(date, add)
  }

  const getDateRangeText = () => {
    const end = getEndDate()
    const sameMonth = date.getMonth() === end.getMonth() && date.getFullYear() === end.getFullYear()
    if (sameMonth) {
      return `${format(date, 'd.', { locale: cs })} – ${format(end, 'd. MMMM yyyy', { locale: cs })}`
    }
    const sameYear = date.getFullYear() === end.getFullYear()
    if (sameYear) {
      return `${format(date, 'd. MMMM', { locale: cs })} – ${format(end, 'd. MMMM yyyy', { locale: cs })}`
    }
    return `${format(date, 'd. MMMM yyyy', { locale: cs })} – ${format(end, 'd. MMMM yyyy', { locale: cs })}`
  }

  const getDurationText = () => {
    if (duration === 'day') return '24h'
    return duration
  }

  const getStartLabel = () => {
    const weekday = format(date, 'EEEE', { locale: cs })
    const capital = weekday.charAt(0).toUpperCase() + weekday.slice(1)
    return `${capital} 12:00 (poledne)`
  }

  return (
    <div className="mb-4">
      <h3 className="text-lg font-bold text-semin-blue mb-4">Shrnutí rezervace</h3>
      <div className="space-y-1">
        <div className="flex gap-2 text-sm">
          <span className="text-gray-600">Datum:</span>
          <span className="text-gray-900">{getDateRangeText()}</span>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="text-gray-600">Začátek:</span>
          <span className="text-gray-900">{getStartLabel()}</span>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="text-gray-600">Délka:</span>
          <span className="text-gray-900">{getDurationText()}</span>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="text-gray-600">Lovné místo:</span>
          <span className="text-gray-900">{spot.number}</span>
        </div>
      </div>
    </div>
  )
} 