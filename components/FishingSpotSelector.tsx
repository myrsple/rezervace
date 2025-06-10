'use client'

import React from 'react'
import { FishingSpot } from '@/types'

interface FishingSpotSelectorProps {
  spots: FishingSpot[]
  selectedSpot: FishingSpot | null
  onSpotSelect: (spot: FishingSpot) => void
}

export default function FishingSpotSelector({ 
  spots, 
  selectedSpot, 
  onSpotSelect 
}: FishingSpotSelectorProps) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
      {[
        ...spots.filter(spot => spot.name === 'Lovné místo VIP' || spot.number === 99),
        ...spots.filter(spot => spot.name !== 'Lovné místo VIP' && spot.number !== 99)
      ].map((spot) => (
        <button
          key={spot.id}
          onClick={() => spot.isActive && onSpotSelect(spot)}
          className={`
            h-16 p-3 border-2 rounded-2xl font-bold transition-all duration-200
            flex flex-col items-center justify-center text-center relative
            ${!spot.isActive 
              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
              : selectedSpot?.id === spot.id
                ? 'border-semin-blue bg-semin-light-blue text-semin-blue shadow-card transform scale-105'
                : 'border-gray-200 bg-white text-semin-gray hover:border-semin-blue hover:bg-semin-light-blue hover:shadow-card cursor-pointer'
            }
          `}
          disabled={!spot.isActive}
          title={!spot.isActive ? 'Toto lovné místo je dočasně nedostupné' : ''}
        >
          <div className="text-base font-bold">
            {spot.name === 'Lovné místo VIP' ? (
              <>
                <span>VIP</span><br />
                <span className="text-xs font-normal">Lovné místo</span>
              </>
            ) : (
              spot.number
            )}
          </div>
          <div className="text-xs truncate w-full">
            {spot.name === 'Lovné místo VIP' ? '' : spot.name}
          </div>
          {!spot.isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-500 bg-opacity-20 rounded-2xl">
              <div className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md shadow-sm">
                Nedostupné
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  )
} 