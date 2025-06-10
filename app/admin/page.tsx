'use client'

import React, { useState, useEffect } from 'react'
import { Reservation, FishingSpot, Competition, CompetitionRegistration } from '@/types'
import { format, addHours } from 'date-fns'
import { cs } from 'date-fns/locale'
import { getGearNames } from '@/lib/gear-config'

export default function AdminDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [fishingSpots, setFishingSpots] = useState<FishingSpot[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'reservations' | 'spots' | 'competitions'>('reservations')
  const [newCompetition, setNewCompetition] = useState({ name: '', date: '', capacity: '', entryFee: '' })
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'startDate', direction: 'desc' })
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; reservationId: string; customerName: string }>({ 
    isOpen: false, 
    reservationId: '', 
    customerName: '' 
  })
  const [deleteCompetitionConfirmation, setDeleteCompetitionConfirmation] = useState<{ isOpen: boolean; competitionId: number; competitionName: string }>({ 
    isOpen: false, 
    competitionId: 0, 
    competitionName: '' 
  })
  const [editCompetition, setEditCompetition] = useState<{ isOpen: boolean; competition: Competition | null }>({ 
    isOpen: false, 
    competition: null 
  })
  const [editFormData, setEditFormData] = useState({ name: '', date: '', capacity: '', entryFee: '' })
  const [operationLoading, setOperationLoading] = useState({
    create: false,
    delete: false,
    update: false,
    toggle: new Set<number>()
  })
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [reservationsRes, spotsRes, competitionsRes] = await Promise.all([
        fetch('/api/reservations'),
        fetch('/api/fishing-spots'),
        fetch('/api/competitions')
      ])

      if (!reservationsRes.ok) {
        throw new Error(`Reservations API error: ${reservationsRes.status}`)
      }
      if (!spotsRes.ok) {
        throw new Error(`Fishing spots API error: ${spotsRes.status}`)
      }
      if (!competitionsRes.ok) {
        throw new Error(`Competitions API error: ${competitionsRes.status}`)
      }

      const [reservationsData, spotsData, competitionsData] = await Promise.all([
        reservationsRes.json(),
        spotsRes.json(),
        competitionsRes.json()
      ])

      // Ensure we have arrays even if the API returns undefined
      setReservations(Array.isArray(reservationsData) ? reservationsData : [])
      setFishingSpots(Array.isArray(spotsData) ? spotsData : [])
      setCompetitions(Array.isArray(competitionsData) ? competitionsData : [])
    } catch (error) {
      console.error('Error fetching data:', error)
      // Set empty arrays as fallback
      setReservations([])
      setFishingSpots([])
      setCompetitions([])
    } finally {
      setLoading(false)
    }
  }

  const toggleSpotStatus = async (spotId: number, isActive: boolean) => {
    if (operationLoading.toggle.has(spotId)) return // Prevent duplicate toggles

    setOperationLoading(prev => ({
      ...prev,
      toggle: new Set(prev.toggle).add(spotId)
    }))
    showFeedback('success', `${isActive ? 'Aktivuji' : 'Deaktivuji'} lovné místo...`)

    try {
      const response = await fetch(`/api/fishing-spots/${spotId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        await fetchData() // Refresh data
        showFeedback('success', `Lovné místo bylo ${isActive ? 'aktivováno' : 'deaktivováno'}`)
      } else {
        const error = await response.json()
        showFeedback('error', `Chyba při změně stavu lovného místa: ${error.message || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error updating spot status:', error)
      showFeedback('error', 'Chyba při změně stavu lovného místa')
    } finally {
      setOperationLoading(prev => {
        const newToggle = new Set(prev.toggle)
        newToggle.delete(spotId)
        return { ...prev, toggle: newToggle }
      })
    }
  }

  const getNextReservation = (spotId: number) => {
    const now = new Date()
    const spotReservations = reservations
      .filter(reservation => {
        if (reservation.spotId !== spotId || reservation.status === 'CANCELLED') {
          return false
        }
        
        const startDate = new Date(reservation.startDate)
        const endDate = new Date(reservation.endDate)
        
        // Show reservation if it starts in the future OR is currently active (between start and end)
        return startDate > now || (startDate <= now && endDate > now)
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    
    return spotReservations[0] || null
  }

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 3000) // Hide after 3 seconds
  }

  const createCompetition = async () => {
    if (!newCompetition.name || !newCompetition.date || !newCompetition.capacity || !newCompetition.entryFee) {
      showFeedback('error', 'Prosím vyplňte všechna pole')
      return
    }

    if (competitions.length >= 3) {
      showFeedback('error', 'Můžete mít maximálně 3 závody současně')
      return
    }

    if (operationLoading.create) return // Prevent duplicate submissions

    setOperationLoading(prev => ({ ...prev, create: true }))
    showFeedback('success', 'Vytvářím závod...')

    try {
      const response = await fetch('/api/competitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCompetition),
      })

      if (response.ok) {
        await fetchData()
        setNewCompetition({ name: '', date: '', capacity: '', entryFee: '' })
        showFeedback('success', 'Závod byl úspěšně vytvořen')
      } else {
        const error = await response.json()
        showFeedback('error', `Chyba při vytváření závodu: ${error.message || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error creating competition:', error)
      showFeedback('error', 'Chyba při vytváření závodu')
    } finally {
      setOperationLoading(prev => ({ ...prev, create: false }))
    }
  }

  const toggleCompetitionStatus = async (competitionId: number, isActive: boolean) => {
    if (operationLoading.toggle.has(competitionId)) return // Prevent duplicate toggles

    setOperationLoading(prev => ({
      ...prev,
      toggle: new Set(prev.toggle).add(competitionId)
    }))

    try {
      const response = await fetch(`/api/competitions/${competitionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        await fetchData()
        showFeedback('success', `Závod byl ${isActive ? 'aktivován' : 'deaktivován'}`)
      } else {
        const error = await response.json()
        showFeedback('error', `Chyba při změně stavu závodu: ${error.message || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error updating competition:', error)
      showFeedback('error', 'Chyba při změně stavu závodu')
    } finally {
      setOperationLoading(prev => {
        const newToggle = new Set(prev.toggle)
        newToggle.delete(competitionId)
        return { ...prev, toggle: newToggle }
      })
    }
  }

  const deleteCompetition = async (competitionId: number) => {
    if (operationLoading.delete) return // Prevent duplicate deletions

    setOperationLoading(prev => ({ ...prev, delete: true }))
    showFeedback('success', 'Mažu závod...')

    try {
      const response = await fetch(`/api/competitions/${competitionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeleteCompetitionConfirmation({ isOpen: false, competitionId: 0, competitionName: '' })
        await fetchData()
        showFeedback('success', 'Závod byl úspěšně smazán')
      } else {
        const error = await response.json()
        showFeedback('error', `Chyba při mazání závodu: ${error.message || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error deleting competition:', error)
      showFeedback('error', 'Chyba při mazání závodu')
    } finally {
      setOperationLoading(prev => ({ ...prev, delete: false }))
    }
  }

  const openDeleteCompetitionConfirmation = (competitionId: number, competitionName: string) => {
    setDeleteCompetitionConfirmation({ isOpen: true, competitionId, competitionName })
  }

  const openEditCompetition = (competition: Competition) => {
    const competitionDate = new Date(competition.date)
    const dateTimeString = competitionDate.toISOString().slice(0, 16) // Format for datetime-local input
    
    setEditFormData({
      name: competition.name,
      date: dateTimeString,
      capacity: competition.capacity.toString(),
      entryFee: competition.entryFee.toString()
    })
    setEditCompetition({ isOpen: true, competition })
  }

  const closeEditCompetition = () => {
    setEditCompetition({ isOpen: false, competition: null })
    setEditFormData({ name: '', date: '', capacity: '', entryFee: '' })
  }

  const updateCompetition = async () => {
    if (!editCompetition.competition || !editFormData.name || !editFormData.date || !editFormData.capacity || !editFormData.entryFee) {
      showFeedback('error', 'Prosím vyplňte všechna pole')
      return
    }

    if (operationLoading.update) return // Prevent duplicate updates

    setOperationLoading(prev => ({ ...prev, update: true }))
    showFeedback('success', 'Aktualizuji závod...')

    try {
      const response = await fetch(`/api/competitions/${editCompetition.competition.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editFormData.name,
          date: editFormData.date,
          capacity: parseInt(editFormData.capacity),
          entryFee: parseFloat(editFormData.entryFee)
        }),
      })

      if (response.ok) {
        await fetchData()
        closeEditCompetition()
        showFeedback('success', 'Závod byl úspěšně aktualizován')
      } else {
        const error = await response.json()
        showFeedback('error', `Chyba při aktualizaci závodu: ${error.message || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error updating competition:', error)
      showFeedback('error', 'Chyba při aktualizaci závodu')
    } finally {
      setOperationLoading(prev => ({ ...prev, update: false }))
    }
  }

  const isCompetitionCompleted = (competition: Competition) => {
    const now = new Date()
    const competitionDate = new Date(competition.date)
    const endDate = addHours(competitionDate, 24) // Competition ends 24h after start
    const visibilityEndDate = addHours(endDate, 48) // Show for 48h after end
    return now > visibilityEndDate
  }

  const getActiveCompetitions = () => {
    return competitions.filter(comp => !isCompetitionCompleted(comp))
  }

  const getCompletedCompetitions = () => {
    return competitions.filter(comp => isCompetitionCompleted(comp))
  }

  const updateReservationPaidStatus = async (reservationId: string, isPaid: boolean) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPaid }),
      })

      if (response.ok) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
    }
  }

  const updateCompetitionPaidStatus = async (registrationId: string, isPaid: boolean) => {
    try {
      const response = await fetch(`/api/competition-registrations/${registrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPaid }),
      })

      if (response.ok) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error('Error updating competition payment status:', error)
    }
  }

  const downloadReservationsCSV = () => {
    const headers = ['Rybář', 'Email', 'Telefon', 'Vybavení', 'VS', 'Místo', 'Datum', 'Délka', 'Cena', 'Placeno']
    
    const csvData = sortedReservations.map(reservation => [
      reservation.customerName,
      reservation.customerEmail,
      reservation.customerPhone,
      reservation.rentedGear ? getGearNames(reservation.rentedGear).join('; ') : '—',
      reservation.variableSymbol || '',
      `#${reservation.spotId}`,
      format(new Date(reservation.startDate), 'd.M.yyyy'),
      reservation.duration === 'day' ? 'Jeden den' : 
       reservation.duration === '24h' ? '24 hodin' : '48 hodin',
      `${reservation.totalPrice} Kč`,
      reservation.isPaid ? 'Ano' : 'Ne'
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    
    // Use Czech date format for filename
    const exportDate = format(new Date(), 'd.M.yyyy', { locale: cs })
    link.download = `rezervace_${exportDate}.csv`
    link.click()
  }

  const downloadCompetitionCSV = (competition: Competition) => {
    const headers = ['Rybář', 'Email', 'Telefon', 'Vybavení', 'Vstupné', 'Cena vybavení', 'Placeno']
    
    const csvData = (competition.registrations || []).map(registration => [
      registration.customerName,
      registration.customerEmail,
      registration.customerPhone,
      registration.rentedGear ? getGearNames(registration.rentedGear).join('; ') : '—',
      `${competition.entryFee} Kč`,
      `${registration.gearPrice || 0} Kč`,
      registration.isPaid ? 'Ano' : 'Ne'
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    
    // Format competition name and date for filename
    const competitionDate = format(new Date(competition.date), 'd.M.yyyy', { locale: cs })
    const safeCompetitionName = competition.name.replace(/[^a-zA-Z0-9-_]/g, '_')
    link.download = `${safeCompetitionName}_${competitionDate}.csv`
    link.click()
  }

  const deleteReservation = async (reservationId: string) => {
    try {
      const response = await fetch(`/api/reservations?id=${reservationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDeleteConfirmation({ isOpen: false, reservationId: '', customerName: '' })
        fetchData() // Refresh data
      } else {
        const errorData = await response.json()
        alert(`Chyba při mazání rezervace: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting reservation:', error)
      alert('Chyba při mazání rezervace')
    }
  }

  const openDeleteConfirmation = (reservationId: string, customerName: string) => {
    setDeleteConfirmation({ isOpen: true, reservationId, customerName })
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  }

  const sortedReservations = [...reservations].sort((a, b) => {
    const { key, direction } = sortConfig;
    let aValue: any, bValue: any;
    
    switch (key) {
      case 'customerName':
        aValue = a.customerName;
        bValue = b.customerName;
        break;
      case 'variableSymbol':
        aValue = a.variableSymbol || '';
        bValue = b.variableSymbol || '';
        break;
      case 'spotId':
        aValue = a.spotId;
        bValue = b.spotId;
        break;
      case 'startDate':
        aValue = new Date(a.startDate);
        bValue = new Date(b.startDate);
        break;
      case 'totalPrice':
        aValue = a.totalPrice;
        bValue = b.totalPrice;
        break;

      case 'isPaid':
        aValue = a.isPaid ? 1 : 0;
        bValue = b.isPaid ? 1 : 0;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-semin-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Administrace lovných míst</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab('reservations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'reservations'
                  ? 'border-semin-blue text-semin-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rezervace ({reservations.length})
            </button>
            <button
              onClick={() => setSelectedTab('spots')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'spots'
                  ? 'border-semin-blue text-semin-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Lovná místa ({fishingSpots.length})
            </button>
            <button
              onClick={() => setSelectedTab('competitions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'competitions'
                  ? 'border-semin-blue text-semin-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Závody ({getActiveCompetitions().length})
            </button>
          </nav>
        </div>

        {/* Reservations Tab */}
        {selectedTab === 'reservations' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Poslední rezervace</h2>
                <button
                  onClick={downloadReservationsCSV}
                  className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Stáhnout CSV</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('customerName')}
                    >
                      <div className="flex items-center">
                        Rybář
                        {sortConfig.key === 'customerName' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'desc' ? '↓' : '↑'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('variableSymbol')}
                    >
                      <div className="flex items-center">
                        VS
                        {sortConfig.key === 'variableSymbol' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'desc' ? '↓' : '↑'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vybavení
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('spotId')}
                    >
                      <div className="flex items-center">
                        Místo
                        {sortConfig.key === 'spotId' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'desc' ? '↓' : '↑'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('startDate')}
                    >
                      <div className="flex items-center">
                        Datum a délka
                        {sortConfig.key === 'startDate' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'desc' ? '↓' : '↑'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('totalPrice')}
                    >
                      <div className="flex items-center">
                        Cena
                        {sortConfig.key === 'totalPrice' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'desc' ? '↓' : '↑'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('isPaid')}
                    >
                      <div className="flex items-center">
                        Placeno?
                        {sortConfig.key === 'isPaid' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'desc' ? '↓' : '↑'}
                          </span>
                        )}
                      </div>
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akce
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedReservations.map((reservation) => (
                    <tr key={reservation.id} className={`hover:bg-gray-50 ${reservation.isPaid ? 'bg-green-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.customerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {reservation.customerEmail}
                          </div>
                          <div className="text-sm text-gray-500">
                            {reservation.customerPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reservation.variableSymbol || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {reservation.rentedGear ? (
                          <div className="space-y-1">
                            {reservation.rentedGear.split(',').map((gearId: string, index: number) => {
                              const gearNames = {
                                'rod_reel': '🎣 Prut+naviják',
                                'tackle_box': '🗃️ Drobné náčiní',
                                'chair': '🪑 Židle',
                                'net': '🥅 Podběrák',
                                'rum_flask': '🥃 Flaška rumu',
                                'bait': '🪱 Návnada'
                              }
                              return (
                                <div key={index} className="text-xs text-green-600">
                                  {gearNames[gearId as keyof typeof gearNames] || gearId}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{reservation.spotId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(reservation.startDate), 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reservation.duration === 'day' ? 'Jeden den' :
                           reservation.duration === '24h' ? '24 hodin' : '48 hodin'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {reservation.totalPrice} Kč
                        </div>
                        {reservation.rentedGear && (
                          <div className="text-xs text-green-600">
                            + vybavení {reservation.gearPrice} Kč
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <input
                          type="checkbox"
                          checked={reservation.isPaid}
                          onChange={(e) => updateReservationPaidStatus(reservation.id, e.target.checked)}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openDeleteConfirmation(reservation.id, reservation.customerName)}
                          className="inline-flex items-center px-2 py-1 border border-red-300 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                          title="Smazat rezervaci"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fishing Spots Tab */}
        {selectedTab === 'spots' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Lovná místa</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {[
                ...fishingSpots.filter(spot => spot.name === 'Lovné místo VIP' || spot.number === 99),
                ...fishingSpots.filter(spot => spot.name !== 'Lovné místo VIP' && spot.number !== 99)
              ].map((spot) => {
                const nextReservation = getNextReservation(spot.id)
                return (
                  <div key={spot.id} className={`border border-gray-200 rounded-lg p-4 ${!spot.isActive ? 'bg-gray-50' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {spot.name === 'Lovné místo VIP' || spot.number === 99 ? 'VIP' : `Lovné místo ${spot.number}`}
                      </h3>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">
                          {spot.isActive ? 'Aktivní' : 'Neaktivní'}
                        </span>
                        {/* iOS-style toggle with loading state */}
                        <button
                          onClick={() => toggleSpotStatus(spot.id, !spot.isActive)}
                          disabled={operationLoading.toggle.has(spot.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-semin-blue focus:ring-offset-2 ${
                            spot.isActive 
                              ? 'bg-semin-blue' 
                              : 'bg-gray-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {operationLoading.toggle.has(spot.id) ? (
                            <svg className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                                spot.isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Příští rezervace:</h4>
                      {nextReservation ? (
                        <div className="text-sm text-gray-600">
                          <div className="font-medium">{nextReservation.customerName}</div>
                          <div>{format(new Date(nextReservation.startDate), 'd.M.yyyy HH:mm', { locale: cs })}</div>
                          <div className="text-xs text-gray-500">
                            {nextReservation.duration === 'day' ? 'Jeden den' :
                             nextReservation.duration === '24h' ? '24 hodin' : '48 hodin'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">Žádné nadcházející rezervace</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Competitions Tab */}
        {selectedTab === 'competitions' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="text-xl font-bold text-semin-blue mb-4">Vytvořit nový závod</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Název závodu"
                  value={newCompetition.name}
                  onChange={(e) => setNewCompetition({ ...newCompetition, name: e.target.value })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg"
                  disabled={operationLoading.create}
                />
                <input
                  type="datetime-local"
                  value={newCompetition.date}
                  onChange={(e) => setNewCompetition({ ...newCompetition, date: e.target.value })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg"
                  disabled={operationLoading.create}
                />
                <input
                  type="number"
                  placeholder="Kapacita"
                  value={newCompetition.capacity}
                  onChange={(e) => setNewCompetition({ ...newCompetition, capacity: e.target.value })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg"
                  disabled={operationLoading.create}
                />
                <input
                  type="number"
                  placeholder="Startovné (Kč)"
                  value={newCompetition.entryFee}
                  onChange={(e) => setNewCompetition({ ...newCompetition, entryFee: e.target.value })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg"
                  disabled={operationLoading.create}
                />
              </div>
              <button
                onClick={createCompetition}
                disabled={operationLoading.create}
                className="mt-4 bg-semin-blue text-white px-6 py-2 rounded-lg hover:bg-semin-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px]"
              >
                {operationLoading.create ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Vytvářím...
                  </>
                ) : (
                  'Vytvořit závod'
                )}
              </button>
            </div>

            {/* Active Competitions */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="text-xl font-bold text-semin-blue mb-4">Aktivní závody</h3>
              <div className="space-y-6">
                {getActiveCompetitions().map((competition) => (
                  <div key={competition.id} className={`border border-gray-200 rounded-lg p-6 ${!competition.isActive ? 'bg-gray-50' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{competition.name}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>Datum a čas: {format(new Date(competition.date), 'dd.MM.yyyy HH:mm', { locale: cs })}</div>
                          <div>Kapacita: {competition.registrations?.length || 0} / {competition.capacity} účastníků</div>
                          <div>Vstupné: {competition.entryFee} Kč</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => openEditCompetition(competition)}
                          disabled={operationLoading.update || operationLoading.toggle.has(competition.id)}
                          className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Upravit
                        </button>
                        <button
                          onClick={() => toggleCompetitionStatus(competition.id, !competition.isActive)}
                          disabled={operationLoading.toggle.has(competition.id)}
                          className={`${
                            competition.isActive ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'
                          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                        >
                          {operationLoading.toggle.has(competition.id) ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {competition.isActive ? 'Deaktivuji...' : 'Aktivuji...'}
                            </>
                          ) : (
                            competition.isActive ? 'Deaktivovat' : 'Aktivovat'
                          )}
                        </button>
                        <button
                          onClick={() => openDeleteCompetitionConfirmation(competition.id, competition.name)}
                          disabled={operationLoading.delete || operationLoading.toggle.has(competition.id)}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Smazat
                        </button>
                      </div>
                    </div>

                    {/* Registration Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Registrace</span>
                        <span>{competition.registrations?.length || 0} / {competition.capacity}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-semin-blue h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, ((competition.registrations?.length || 0) / competition.capacity) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Registrations Table */}
                    {competition.registrations && competition.registrations.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="text-sm font-medium text-gray-700">Registrovaní účastníci</h5>
                          <button
                            onClick={() => downloadCompetitionCSV(competition)}
                            className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>CSV</span>
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rybář</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VS</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vybavení</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cena</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placeno?</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {competition.registrations.map((registration) => (
                                <tr key={registration.id} className={`hover:bg-gray-50 ${registration.isPaid ? 'bg-green-50' : ''}`}>
                                  <td className="px-4 py-2 whitespace-nowrap">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {registration.customerName}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {registration.customerEmail}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {registration.customerPhone}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {registration.variableSymbol || '—'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap">
                                    {registration.rentedGear ? (
                                      <div className="space-y-1">
                                        {getGearNames(registration.rentedGear).map((gearName, index) => (
                                          <div key={index} className="text-xs text-green-600">
                                            {gearName}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 font-medium">
                                      {registration.totalPrice} Kč
                                    </div>
                                    {registration.rentedGear && (
                                      <div className="text-xs text-green-600">
                                        Vstupné: {competition.entryFee} Kč + vybavení: {registration.gearPrice || 0} Kč
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    <input
                                      type="checkbox"
                                      checked={registration.isPaid}
                                      onChange={(e) => updateCompetitionPaidStatus(registration.id, e.target.checked)}
                                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Competitions */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="text-xl font-bold text-semin-blue mb-4">Dokončené závody</h3>
              <div className="space-y-6">
                {getCompletedCompetitions().map((competition) => (
                  <div key={competition.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-700">{competition.name}</h4>
                        <div className="text-sm text-gray-500 mt-1">
                          <div>Datum a čas: {format(new Date(competition.date), 'dd.MM.yyyy HH:mm', { locale: cs })}</div>
                          <div>Počet účastníků: {competition.registrations?.length || 0} / {competition.capacity}</div>
                          <div>Vstupné: {competition.entryFee} Kč</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Dokončen
                        </span>
                        <button
                          onClick={() => downloadCompetitionCSV(competition)}
                          className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Final Results Table */}
                    {competition.registrations && competition.registrations.length > 0 && (
                      <div className="border-t pt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Finální výsledky</h5>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rybář</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VS</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vybavení</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cena</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placeno?</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {competition.registrations.map((registration) => (
                                <tr key={registration.id} className={`hover:bg-gray-50 ${registration.isPaid ? 'bg-green-50' : ''}`}>
                                  <td className="px-4 py-2 whitespace-nowrap">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {registration.customerName}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {registration.customerEmail}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {registration.customerPhone}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {registration.variableSymbol || '—'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap">
                                    {registration.rentedGear ? (
                                      <div className="space-y-1">
                                        {getGearNames(registration.rentedGear).map((gearName, index) => (
                                          <div key={index} className="text-xs text-green-600">
                                            {gearName}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 font-medium">
                                      {registration.totalPrice} Kč
                                    </div>
                                    {registration.rentedGear && (
                                      <div className="text-xs text-green-600">
                                        Vstupné: {competition.entryFee} Kč + vybavení: {registration.gearPrice || 0} Kč
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    <input
                                      type="checkbox"
                                      checked={registration.isPaid}
                                      onChange={(e) => updateCompetitionPaidStatus(registration.id, e.target.checked)}
                                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Delete Competition Confirmation Modal */}
            {deleteCompetitionConfirmation.isOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold text-semin-blue mb-4">Potvrdit smazání</h3>
                  <p className="mb-6">
                    Opravdu chcete smazat závod "{deleteCompetitionConfirmation.competitionName}"?
                    Tato akce je nevratná.
                  </p>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setDeleteCompetitionConfirmation({ isOpen: false, competitionId: 0, competitionName: '' })}
                      disabled={operationLoading.delete}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Zrušit
                    </button>
                    <button
                      onClick={() => deleteCompetition(deleteCompetitionConfirmation.competitionId)}
                      disabled={operationLoading.delete}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {operationLoading.delete ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Mažu...
                        </>
                      ) : (
                        'Smazat'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Competition Modal */}
            {editCompetition.isOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
                  <h3 className="text-xl font-bold text-semin-blue mb-4">Upravit závod</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Název závodu</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                        disabled={operationLoading.update}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Datum a čas</label>
                      <input
                        type="datetime-local"
                        value={editFormData.date}
                        onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                        disabled={operationLoading.update}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kapacita</label>
                      <input
                        type="number"
                        value={editFormData.capacity}
                        onChange={(e) => setEditFormData({ ...editFormData, capacity: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                        disabled={operationLoading.update}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Startovné (Kč)</label>
                      <input
                        type="number"
                        value={editFormData.entryFee}
                        onChange={(e) => setEditFormData({ ...editFormData, entryFee: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                        disabled={operationLoading.update}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={closeEditCompetition}
                      disabled={operationLoading.update}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Zrušit
                    </button>
                    <button
                      onClick={updateCompetition}
                      disabled={operationLoading.update}
                      className="px-4 py-2 bg-semin-blue text-white rounded-lg hover:bg-semin-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {operationLoading.update ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Ukládám...
                        </>
                      ) : (
                        'Uložit změny'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Reservation Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Smazat rezervaci
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Opravdu chcete smazat rezervaci pro <strong>{deleteConfirmation.customerName}</strong>? 
                  Tuto akci nelze vrátit zpět.
                </p>
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={() => setDeleteConfirmation({ isOpen: false, reservationId: '', customerName: '' })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Zrušit
                  </button>
                  <button
                    onClick={() => deleteReservation(deleteConfirmation.reservationId)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Smazat rezervaci
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Message */}
      {feedback && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
          feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white transition-opacity duration-300`}>
          {feedback.message}
        </div>
      )}
    </div>
  )
}