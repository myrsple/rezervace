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

const PRICING = {
  day: 400,
  '24h': 600,
  '48h': 1000
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

  const basePrice = PRICING[duration as keyof typeof PRICING] || 0
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
          startTime: duration === 'day' ? '6am' : timeSlot,
          totalPrice,
          rentedGear: selectedGear.length > 0 ? selectedGear.join(',') : null,
          gearPrice: gearPrice > 0 ? gearPrice : null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create reservation')
      }

      const reservation = await response.json()
      setReservationData(reservation)
      setSuccess(true)

    } catch (err) {
      setError('Rezervace se nezdařila. Zkuste to prosím znovu.')
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
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 bg-semin-green/10 rounded-2xl flex items-center justify-center">
          <svg className="w-10 h-10 text-semin-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-semin-green mb-3">Rezervace potvrzena!</h3>
        <p className="text-semin-gray text-lg mb-6">Vaše rezervace byla úspěšně vytvořena. Brzy obdržíte potvrzovací e-mail.</p>
        
        {/* Payment Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-lg mx-auto">
          <h4 className="text-lg font-semibold text-blue-800 mb-4">Platba předem</h4>
          <p className="text-sm text-blue-700 mb-4">
            Pro rychlejší odbavení můžete uhradit celou částku předem bankovním převodem.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-blue-800">Číslo účtu:</span>
                <span className="text-blue-700 font-mono">1234567890/0100</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-blue-800">Částka:</span>
                <span className="text-blue-700 font-semibold">{totalPrice} Kč</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-blue-800">Variabilní symbol:</span>
                <span className="text-blue-700 font-mono font-bold text-lg">
                  {reservationData?.variableSymbol || '------'}
                </span>
              </div>
            </div>
            
            {/* QR Code */}
            <div className="flex justify-center">
              {qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="QR kód pro platbu" 
                  className="w-32 h-32 rounded-lg border border-blue-200"
                />
              ) : (
                <div className="w-24 h-24 bg-white border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xs text-blue-600 font-medium">QR kód</div>
                    <div className="text-xs text-blue-500">se načítá...</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-xs text-blue-600 mt-4 text-center">
            Nezapomeňte uvést variabilní symbol při platbě!
          </p>
        </div>
        
        {/* Navigation Map */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-lg mx-auto mt-6">
          <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <span className="mr-2">🗺️</span>
            Jak se k nám dostanete
          </h4>
          <div className="bg-white rounded-lg border border-green-200 overflow-hidden">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1651.405240448874!2d15.531935757891537!3d50.053176652165135!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x470c30b45180bd21%3A0x420a9f30bd933982!2zVG9tw6HFoWVr!5e1!3m2!1sen!2scz!4v1749514996026!5m2!1sen!2scz"
              width="100%" 
              height="200" 
              style={{ border: 0 }} 
              allowFullScreen={true}
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa - jak se k nám dostanete"
            ></iframe>
          </div>
          <p className="text-sm text-green-700 mt-3 text-center">
            Klikněte na mapu pro podrobné navigační pokyny
          </p>
        </div>
        
        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={() => {
              onComplete()
              setSuccess(false)
              setReservationData(null)
              setFormData({ customerName: '', customerEmail: '', customerPhone: '' })
            }}
            className="w-full bg-semin-green text-white py-3 px-6 rounded-2xl font-semibold text-lg shadow-card hover:bg-semin-green/90 hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-semin-green/30 transition-all duration-200"
          >
            Dokončit rezervaci
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
                    <div className="text-lg font-bold text-semin-green">{gear.price} Kč</div>
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
                    <span className="font-medium">{gear.price} Kč</span>
                  </div>
                ) : null
              })}
              <div className="border-t border-green-300 pt-2 mt-2 flex justify-between font-bold">
                <span>Celkem vybavení:</span>
                <span>{gearPrice} Kč</span>
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
                  Místo: {basePrice} Kč + Vybavení: {gearPrice} Kč
                </div>
              )}
              <div className="text-xl font-bold">{totalPrice} Kč</div>
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