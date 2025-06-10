import React, { useState } from 'react'
import { Competition } from '@/types'
import { GEAR_ITEMS, getGearTotalPrice } from '@/lib/gear-config'

interface CompetitionRegistrationProps {
  competition: Competition
  onClose: () => void
}

export default function CompetitionRegistration({ competition, onClose }: CompetitionRegistrationProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  })
  const [selectedGear, setSelectedGear] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [registrationData, setRegistrationData] = useState<any>(null)

  const gearPrice = getGearTotalPrice(selectedGear)
  const totalPrice = competition.entryFee + gearPrice

  const handleGearToggle = (gearId: string) => {
    setSelectedGear(prev => 
      prev.includes(gearId) 
        ? prev.filter(g => g !== gearId)
        : [...prev, gearId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/competition-registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          competitionId: competition.id,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          totalPrice,
          rentedGear: selectedGear.join(','),
          gearPrice
        }),
      })

      if (response.ok) {
        const registration = await response.json()
        setRegistrationData(registration)
        setSuccess(true)
      } else {
        alert('Chyba při registraci na závod')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Chyba při registraci na závod')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success && registrationData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-soft p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-semin-green/10 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-semin-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-semin-green mb-1">Registrace úspěšně dokončena!</h3>
              <p className="text-semin-gray">Brzy obdržíte potvrzovací e-mail.</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Registration Details */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-blue-800 font-medium mb-1">Shrnutí registrace</div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-gray-600">Závod:</span><span className="text-gray-900 font-medium">{competition.name}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Datum:</span><span className="text-gray-900 font-medium">{new Date(competition.date).toLocaleDateString('cs-CZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Jméno:</span><span className="text-gray-900 font-medium">{registrationData.customerName}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">E-mail:</span><span className="text-gray-900 font-medium">{registrationData.customerEmail}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Telefon:</span><span className="text-gray-900 font-medium">{registrationData.customerPhone}</span></div>
                    </div>
                  </div>
                  {selectedGear.length > 0 && (
                    <div>
                      <div className="text-sm text-blue-800 font-medium mb-1">Půjčené vybavení</div>
                      <ul className="list-disc list-inside text-sm text-gray-900 ml-4">
                        {selectedGear.map(gearId => {
                          const gearItem = GEAR_ITEMS.find(item => item.id === gearId)
                          return gearItem ? (
                            <li key={gearId}>{gearItem.name}</li>
                          ) : null
                        })}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="text-sm text-blue-800 font-medium mb-1">Souhrn ceny</div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-gray-600">Vstupné:</span><span className="text-gray-900">{competition.entryFee} Kč</span></div>
                    {gearPrice > 0 && (
                      <div className="flex justify-between"><span className="text-gray-600">Vybavení:</span><span className="text-gray-900">{gearPrice} Kč</span></div>
                    )}
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium text-gray-900">Celkem k úhradě:</span>
                      <span className="font-bold text-gray-900 text-lg">{totalPrice} Kč</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            {registrationData.variableSymbol && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <div className="mb-2 text-sm text-blue-900">Pro urychlení rezervace můžete provést platbu předem.</div>
                <div className="text-sm text-blue-800 space-y-1 mb-4">
                  <div className="flex justify-between"><span>Číslo účtu:</span><span className="font-mono text-gray-900">123456789/0100</span></div>
                  <div className="flex justify-between"><span>Variabilní symbol:</span><span className="font-mono text-gray-900">{registrationData.variableSymbol}</span></div>
                  <div className="flex justify-between"><span>Částka:</span><span className="font-mono text-gray-900">{totalPrice} Kč</span></div>
                </div>
                <div className="flex justify-center mb-2">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SPD*1.0*ACC:CZ6801000000123456789*AM:${totalPrice}*CC:CZK*RF:${registrationData.variableSymbol}*MSG:Registrace%20zavod%20${encodeURIComponent(competition.name)}`}
                    alt="QR kód pro platbu"
                    className="w-32 h-32 rounded-lg"
                  />
                </div>
                <p className="text-xs text-gray-600 text-center">Naskenujte QR kód pro rychlou platbu</p>
              </div>
            )}

            {/* Map Section */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Jak se k nám dostanete</h3>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1651.405240448874!2d15.531935757891537!3d50.053176652165135!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x470c30b45180bd21%3A0x420a9f30bd933982!2zVG9tw6HFoWVr!5e1!3m2!1sen!2scz!4v1749514996026!5m2!1sen!2scz"
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded"
              />
            </div>

            <button
              onClick={onClose}
              className="w-full bg-semin-blue text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-card hover:bg-semin-blue/90 hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-semin-blue/30 transition-all duration-200 mt-2"
            >
              Dokončit registraci
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Registrace na závod</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-6">
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-blue-900 mb-1">{competition.name}</h3>
            <div className="text-sm text-blue-800">
              <div className="flex justify-between"><span>Datum:</span><span>{new Date(competition.date).toLocaleDateString('cs-CZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
              <div className="flex justify-between"><span>Vstupné:</span><span>{competition.entryFee} Kč</span></div>
              <div className="flex justify-between"><span>Kapacita:</span><span>{competition.capacity} účastníků</span></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-semin-blue mb-4">Kontaktní údaje</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-semin-gray mb-2">
                  Celé jméno *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-semin-blue focus:border-semin-blue transition-all duration-200 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="Zadejte své celé jméno"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-semin-gray mb-2">
                  E-mailová adresa *
                </label>
                <input
                  type="email"
                  required
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-semin-blue focus:border-semin-blue transition-all duration-200 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="Zadejte svou e-mailovou adresu"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-semin-gray mb-2">
                Telefonní číslo *
              </label>
              <input
                type="tel"
                required
                value={formData.customerPhone}
                onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
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
              {GEAR_ITEMS.map((gear) => (
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
                    onChange={(e) => handleGearToggle(gear.id)}
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-semin-blue text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-card hover:bg-semin-blue/90 hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-semin-blue/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSubmitting ? 'Registruji...' : (
              <div className="flex justify-between items-center">
                <span>Registrovat se na závod</span>
                <div className="text-right">
                  {gearPrice > 0 && (
                    <div className="text-sm opacity-90">
                      Vstupné: {competition.entryFee} Kč + Vybavení: {gearPrice} Kč
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
      </div>
    </div>
  )
} 