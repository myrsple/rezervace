'use client'

import React, { useState, useEffect } from 'react'
import { FishingSpot } from '@/types'
import { format } from 'date-fns'
import { GEAR_ITEMS, getGearTotalPrice } from '@/lib/gear-config'
import { generateCzechPaymentQR, DEFAULT_BANK_ACCOUNT } from '@/lib/qr-payment'

interface BookingFormProps {
  spot: FishingSpot
  date: Date
  duration: string
  timeSlot: string
  onComplete: () => void
}

const STANDARD_PRICING: Record<string, number> = {
  day: 200,
  '24h': 350,
  '48h': 600,
  '72h': 950,
  '96h': 1200,
}

const VIP_PRICING: Record<string, number> = {
  '24h': 1200,
  '48h': 2000,
  '72h': 3200,
  '96h': 4000,
}

const getBasePrice = (duration: string, spot: FishingSpot): number => {
  const isVIP = spot.name === 'Lovné místo VIP' || spot.number === 99
  if (isVIP) {
    return VIP_PRICING[duration] || 0
  }
  return STANDARD_PRICING[duration] || 0
}

export default function BookingForm({
  spot,
  date,
  duration,
  timeSlot,
  onComplete
}: BookingFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  })
  const [selectedGear, setSelectedGear] = useState<string[]>([])
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [reservationData, setReservationData] = useState<any>(null)

  const basePrice = getBasePrice(duration, spot)
  const gearPrice = getGearTotalPrice(selectedGear)
  const totalPrice = basePrice + gearPrice

  // Generate QR code when reservation is successful
  useEffect(() => {
    if (reservationData?.variableSymbol) {
      generateCzechPaymentQR({
        accountNumber: DEFAULT_BANK_ACCOUNT.accountNumber,
        bankCode: DEFAULT_BANK_ACCOUNT.bankCode,
        amount: totalPrice,
        variableSymbol: reservationData.variableSymbol,
        message: `Lovné místo ${spot.number}`
      }).then(setQrCodeUrl).catch(console.error)
    }
  }, [reservationData, totalPrice, spot.number])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    // Basic form validation
    if (!formData.customerName.trim()) {
      setError('Prosím vyplňte jméno')
      setIsSubmitting(false)
      return
    }
    if (!formData.customerEmail.trim()) {
      setError('Prosím vyplňte email')
      setIsSubmitting(false)
      return
    }
    if (!formData.customerPhone.trim()) {
      setError('Prosím vyplňte telefonní číslo')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spotId: spot.id,
          ...formData,
          startDate: date.toISOString(),
          duration,
          startTime: duration === 'day' ? '6am' : 'noon',
          totalPrice,
          rentedGear: selectedGear.length > 0 ? selectedGear.join(',') : null,
          gearPrice: gearPrice > 0 ? gearPrice : null
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Rezervace se nezdařila'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError)
        }
        throw new Error(errorMessage)
      }

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('Error parsing success response:', jsonError)
        throw new Error('Nepodařilo se zpracovat odpověď ze serveru')
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Neplatná odpověď ze serveru')
      }

      setReservationData(data)
      setSuccess(true)
      onComplete()

    } catch (err) {
      console.error('Reservation error:', err)
      setError(err instanceof Error ? err.message : 'Rezervace se nezdařila. Zkuste to prosím znovu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGearChange = (gearId: string, checked: boolean) => {
    setSelectedGear(prev => 
      checked 
        ? [...prev, gearId]
        : prev.filter(id => id !== gearId)
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (success) {
    return (
      <div>
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-semin-green/10 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-semin-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-semin-green">Rezervace potvrzena!</h3>
            <p className="text-semin-gray">Brzy obdržíte potvrzovací e-mail.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Reservation Details */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-blue-800 font-medium mb-1">Kontaktní údaje</div>
                  <div className="text-sm space-y-1">
                    <p className="text-gray-900">{formData.customerName}</p>
                    <p className="text-gray-600">{formData.customerEmail}</p>
                    <p className="text-gray-600">{formData.customerPhone}</p>
                  </div>
                </div>

                {selectedGear.length > 0 && (
                  <div>
                    <div className="text-sm text-blue-800 font-medium mb-1">Půjčené vybavení</div>
                    <div className="text-sm space-y-1">
                      {selectedGear.map(gearId => {
                        const gearItem = GEAR_ITEMS.find(item => item.id === gearId)
                        return gearItem && (
                          <div key={gearId} className="flex justify-between">
                            <span className="text-gray-900">{gearItem.name}</span>
                            <span className="text-gray-600">{gearItem.price},-</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-blue-800 font-medium mb-1">Platební údaje</div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Číslo účtu:</span>
                      <span className="text-gray-900 font-mono">{DEFAULT_BANK_ACCOUNT.accountNumber}/{DEFAULT_BANK_ACCOUNT.bankCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Variabilní symbol:</span>
                      <span className="text-gray-900 font-mono">{reservationData?.variableSymbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Místo:</span>
                      <span className="text-gray-900">{basePrice},-</span>
                    </div>
                    {gearPrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vybavení:</span>
                        <span className="text-gray-900">{gearPrice},-</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium text-gray-900">Celkem:</span>
                      <span className="font-medium text-gray-900">{totalPrice},-</span>
                    </div>
                  </div>
                </div>

                {qrCodeUrl && (
                  <div className="flex justify-center">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR kód pro platbu" 
                      className="w-32 h-32 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setSuccess(false)
              setReservationData(null)
              setQrCodeUrl('')
              setFormData({
                customerName: '',
                customerEmail: '',
                customerPhone: ''
              })
              setSelectedGear([])
              onComplete()
            }}
            className="w-full bg-semin-blue text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-card hover:bg-semin-blue/90 hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-semin-blue/30 transition-all duration-200"
          >
            Vytvořit novou rezervaci
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <div className="space-y-4">
        <h4 className="text-2xl font-bold text-semin-blue mb-4">Kontaktní údaje</h4>
        
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-semin-gray mb-2">
            Celé jméno *
          </label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-semin-blue focus:border-semin-blue transition-all duration-200 text-gray-900 bg-white placeholder-gray-400"
            placeholder="Zadejte své celé jméno"
          />
        </div>

        <div>
          <label htmlFor="customerEmail" className="block text-sm font-medium text-semin-gray mb-2">
            E-mailová adresa *
          </label>
          <input
            type="email"
            id="customerEmail"
            name="customerEmail"
            value={formData.customerEmail}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-semin-blue focus:border-semin-blue transition-all duration-200 text-gray-900 bg-white placeholder-gray-400"
            placeholder="Zadejte svou e-mailovou adresu"
          />
        </div>

        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium text-semin-gray mb-2">
            Telefonní číslo *
          </label>
          <input
            type="tel"
            id="customerPhone"
            name="customerPhone"
            value={formData.customerPhone}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-semin-blue focus:border-semin-blue transition-all duration-200 text-gray-900 bg-white placeholder-gray-400"
            placeholder="123 456 789"
          />
        </div>
      </div>

      {/* Gear Rental Section */}
      <div className="space-y-4">
        <h4 className="text-xl font-bold text-semin-blue mb-4">Potřebujete vybavení?</h4>
        <p className="text-sm text-semin-gray mb-4">
          Pokud vám něco chybí, můžete si u nás půjčit nebo dokoupit vše potřebné.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GEAR_ITEMS.map(gear => (
            <label 
              key={gear.id}
              className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                selectedGear.includes(gear.id)
                  ? 'border-semin-blue bg-semin-light-blue'
                  : 'border-gray-200 hover:border-semin-blue'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedGear.includes(gear.id)}
                onChange={(e) => handleGearChange(gear.id, e.target.checked)}
                className="w-5 h-5 text-semin-blue border-gray-300 rounded focus:ring-semin-blue"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{gear.emoji}</span>
                  <div>
                    <div className="font-medium text-semin-gray">{gear.name}</div>
                    <div className="text-lg font-bold text-semin-green">{gear.price},-</div>
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
        
        {selectedGear.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 className="font-medium text-green-800 mb-2">Vybrané vybavení:</h5>
            <div className="space-y-1 text-sm text-green-700">
              {selectedGear.map(gearId => {
                const gear = GEAR_ITEMS.find(g => g.id === gearId)
                return gear ? (
                  <div key={gearId} className="flex justify-between">
                    <span>{gear.emoji} {gear.name}</span>
                    <span className="font-medium">{gear.price},-</span>
                  </div>
                ) : null
              })}
              <div className="border-t border-green-300 pt-2 mt-2 flex justify-between font-bold">
                <span>Celkem vybavení:</span>
                <span>{gearPrice},-</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600 text-sm">Rezervace se nezdařila. Zkuste to prosím znovu.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !formData.customerName || !formData.customerEmail || !formData.customerPhone}
        className="w-full bg-semin-blue text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-card hover:bg-semin-blue/90 hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-semin-blue/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isSubmitting ? 'Vytváření rezervace...' : (
          <div className="flex justify-between items-center">
            <span>Potvrdit rezervaci</span>
            <div className="text-right">
              {gearPrice > 0 && (
                <div className="text-sm opacity-90">
                  Místo: {basePrice},- + Vybavení: {gearPrice},-
                </div>
              )}
              <div className="text-xl font-bold">{totalPrice},-</div>
            </div>
          </div>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Odesláním tohoto formuláře souhlasíte s našimi obchodními podmínkami. 
        Krátce po rezervaci obdržíte potvrzovací e-mail.
      </p>
    </form>
  )
} 