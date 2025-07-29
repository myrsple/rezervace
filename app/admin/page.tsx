'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Reservation, FishingSpot, Competition, CompetitionRegistration } from '@/types'
import { format, addHours } from 'date-fns'
import { cs } from 'date-fns/locale'
import { getGearNames } from '@/lib/gear-config'
import AdminLoginForm from '@/components/AdminLoginForm'

export default function AdminDashboard() {
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [fishingSpots, setFishingSpots] = useState<FishingSpot[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'reservations' | 'spots' | 'competitions'>('reservations')
  const [newCompetition, setNewCompetition] = useState({ name: '', date: '', endDate: '', capacity: '', entryFee: '', blockedSpotIds: [] as number[] })
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' })
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
  const [editFormData, setEditFormData] = useState({ name: '', date: '', endDate: '', capacity: '', entryFee: '', blockedSpotIds: [] as number[] })
  const [operationLoading, setOperationLoading] = useState({
    create: false,
    delete: false,
    update: false,
    toggle: new Set<number>(),
    complete: new Set<number>()
  })
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [competitionSortConfigs, setCompetitionSortConfigs] = useState<Record<number, { key: string; direction: 'asc' | 'desc' }>>({})
  const [deleteRegistrationConfirmation, setDeleteRegistrationConfirmation] = useState<{ isOpen: boolean; registrationId: string; customerName: string }>({
    isOpen: false,
    registrationId: '',
    customerName: ''
  })
  const [payConfirmation, setPayConfirmation] = useState<{ isOpen: boolean; reservationId: string; customerName: string }>({
    isOpen: false,
    reservationId: '',
    customerName: ''
  })

  // Pagination for reservations ------------------------------------------------
  const PAGE_SIZE = 30
  const [reservationPage, setReservationPage] = useState(0) // number of pages already loaded
  const [hasMoreReservations, setHasMoreReservations] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Fetch data on mount
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    const minSpinnerTime = new Promise(res => setTimeout(res, 1000))
    const fetchPromise = fetchData()
    Promise.all([minSpinnerTime, fetchPromise]).then(() => {
      if (isMounted) setLoading(false)
    })
    return () => { isMounted = false }
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [reservationsRes, spotsRes, competitionsRes] = await Promise.all([
        fetch(`/api/reservations?limit=${PAGE_SIZE}&skip=0`),
        fetch('/api/fishing-spots'),
        fetch('/api/competitions')
      ])

      // Handle each response individually
      let reservationsData = []
      let spotsData = []
      let competitionsData = []

      if (!reservationsRes.ok) {
        console.error('Reservations API error:', reservationsRes.status)
        showFeedback('error', 'Nepodařilo se načíst rezervace')
      } else {
        try {
          const data = await reservationsRes.json()
          reservationsData = Array.isArray(data) ? data : []
        } catch (error) {
          console.error('Error parsing reservations data:', error)
        }
      }

      if (!spotsRes.ok) {
        console.error('Fishing spots API error:', spotsRes.status)
        showFeedback('error', 'Nepodařilo se načíst lovná místa')
      } else {
        try {
          const data = await spotsRes.json()
          spotsData = Array.isArray(data) ? data : []
        } catch (error) {
          console.error('Error parsing fishing spots data:', error)
        }
      }

      if (!competitionsRes.ok) {
        console.error('Competitions API error:', competitionsRes.status)
        showFeedback('error', 'Nepodařilo se načíst závody')
      } else {
        try {
          const data = await competitionsRes.json()
          competitionsData = Array.isArray(data) ? data : []
        } catch (error) {
          console.error('Error parsing competitions data:', error)
        }
      }

      // Update state with the data we have
      setReservations(reservationsData)
      setFishingSpots(spotsData)
      setCompetitions(competitionsData)

      // ensure default sorting: newest registrations first
      setCompetitionSortConfigs(prev => {
        const updated = { ...prev }
        competitionsData.forEach(comp => {
          if (!updated[comp.id]) {
            updated[comp.id] = { key: 'registeredAt', direction: 'desc' }
          }
        })
        return updated
      })

      setReservationPage(1)
      setHasMoreReservations(reservationsData.length === PAGE_SIZE)
    } catch (error) {
      console.error('Error fetching data:', error)
      showFeedback('error', 'Nepodařilo se načíst data')
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
        // Optimistically update local state so UI reflects the change instantly
        setFishingSpots(prev => prev.map(s => s.id === spotId ? { ...s, isActive } : s))
        await fetchData() // Then refresh to ensure we have server-truth
        showFeedback('success', `Lovné místo bylo ${isActive ? 'aktivováno' : 'deaktivováno'}`)
      } else {
        const errorData = await response.json()
        // Prefer message, then generic error field, finally fallback text
        const errMsg = errorData.message || errorData.error || 'Neznámá chyba'
        // Translate specific known message
        const finalMsg = errMsg.includes('active reservation') || errMsg.includes('aktivní rezervace')
          ? 'Lovné místo má rezervace. Pro deaktivaci je nejdřív zrušte.'
          : errMsg
        showFeedback('error', `Chyba při změně stavu lovného místa: ${finalMsg}`)
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
    setTimeout(() => setFeedback(null), 6000) // Hide after 6 seconds
  }

  const createCompetition = async () => {
    if (!newCompetition.name || !newCompetition.date || !newCompetition.endDate || !newCompetition.capacity || !newCompetition.entryFee) {
      showFeedback('error', 'Prosím vyplňte všechna pole')
      return
    }

    if (getActiveCompetitions().length >= 3) {
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
        setNewCompetition({ name: '', date: '', endDate: '', capacity: '', entryFee: '', blockedSpotIds: [] as number[] })
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
    const startStr = new Date(competition.date).toISOString().slice(0, 16)
    const endStr = competition.endDate ? new Date(competition.endDate).toISOString().slice(0,16) : ''
    
    setEditFormData({
      name: competition.name,
      date: startStr,
      endDate: endStr,
      capacity: competition.capacity.toString(),
      entryFee: competition.entryFee.toString(),
      blockedSpotIds: (competition.blockedSpots || []).map((bs:any)=> bs.fishingSpotId)
    })
    setEditCompetition({ isOpen: true, competition })
  }

  const closeEditCompetition = () => {
    setEditCompetition({ isOpen: false, competition: null })
    setEditFormData({ name: '', date: '', endDate: '', capacity: '', entryFee: '', blockedSpotIds: [] as number[] })
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
          entryFee: parseFloat(editFormData.entryFee),
          endDate: editFormData.endDate,
          blockedSpotIds: editFormData.blockedSpotIds
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
    const start = new Date(competition.date)
    const end = competition.endDate ? new Date(competition.endDate) : addHours(start, 24)
    const visibilityEndDate = addHours(end, 48) // Show for 48h after end
    return now > visibilityEndDate
  }

  const getActiveCompetitions = () => {
    return competitions.filter(comp => !isCompetitionCompleted(comp))
  }

  const getCompletedCompetitions = () => {
    return competitions.filter(comp => isCompetitionCompleted(comp))
  }

  const updateReservationPaidStatus = async (reservationId: string, isPaid: boolean) => {
    if(isPaid===false) return // disallow unmarking
    const currentScroll = window.scrollY
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPaid }),
      })

      if (response.ok) {
        await fetchData() // Refresh data
        window.scrollTo({ top: currentScroll })
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
    }
  }

  const updateCompetitionPaidStatus = async (registrationId: string, isPaid: boolean) => {
    showFeedback('success', 'Ukládám změnu platby...')
    const currentScroll = window.scrollY
    try {
      const response = await fetch(`/api/competition-registrations/${registrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPaid }),
      })

      if (response.ok) {
        await fetchData() // Refresh data
        window.scrollTo({ top: currentScroll })
        showFeedback('success', 'Stav platby byl úspěšně změněn')
      } else {
        const error = await response.json()
        showFeedback('error', `Chyba při změně stavu platby: ${error.message || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error updating competition payment status:', error)
      showFeedback('error', 'Chyba při změně stavu platby')
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
      (() => {
        const num = reservation.fishingSpot?.number
        if (num === 99 || reservation.fishingSpot?.name === 'Lovné místo VIP') {
          return 'VIP'
        }
        return num ? `#${num}` : `#${reservation.spotId}`
      })(),
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
    const headers = ['Rybář', 'Email', 'Telefon', 'VS', 'Vybavení', 'Vstupné', 'Cena vybavení', 'Placeno']
    
    const csvData = (competition.registrations || []).map(registration => [
      registration.customerName,
      registration.customerEmail,
      registration.customerPhone,
      registration.variableSymbol || '',
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
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  })

  const handleCompetitionSort = (competitionId: number, key: string) => {
    setCompetitionSortConfigs(prev => {
      const current = prev[competitionId] || { key: 'registeredAt', direction: 'desc' }
      let direction: 'asc' | 'desc' = 'desc'
      if (current.key === key && current.direction === 'desc') {
        direction = 'asc'
      }
      return { ...prev, [competitionId]: { key, direction } }
    })
  }

  const getSortedRegistrations = (competition: Competition) => {
    const config = competitionSortConfigs[competition.id] || { key: 'registeredAt', direction: 'desc' }
    const regs = [...(competition.registrations || [])]
    regs.sort((a, b) => {
      let aValue: any, bValue: any
      switch (config.key) {
        case 'customerName':
          aValue = a.customerName
          bValue = b.customerName
          break
        case 'variableSymbol':
          aValue = a.variableSymbol || ''
          bValue = b.variableSymbol || ''
          break
        case 'totalPrice':
          aValue = a.totalPrice
          bValue = b.totalPrice
          break
        case 'isPaid':
          aValue = a.isPaid ? 1 : 0
          bValue = b.isPaid ? 1 : 0
          break
        case 'registeredAt':
          aValue = new Date(a.registeredAt || a.createdAt)
          bValue = new Date(b.registeredAt || b.createdAt)
          break
        default:
          return 0
      }
      if (aValue < bValue) return config.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return config.direction === 'asc' ? 1 : -1
      return 0
    })
    return regs
  }

  const deleteCompetitionRegistration = async (registrationId: string) => {
    if (operationLoading.delete) return

    setOperationLoading(prev => ({ ...prev, delete: true }))
    showFeedback('success', 'Mažu registraci...')

    try {
      const response = await fetch(`/api/competition-registrations?id=${registrationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDeleteRegistrationConfirmation({ isOpen: false, registrationId: '', customerName: '' })
        await fetchData()
        showFeedback('success', 'Registrace byla smazána')
      } else {
        const errorData = await response.json()
        showFeedback('error', `Chyba při mazání registrace: ${errorData.error || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error deleting registration:', error)
      showFeedback('error', 'Chyba při mazání registrace')
    } finally {
      setOperationLoading(prev => ({ ...prev, delete: false }))
    }
  }

  const openDeleteRegistrationConfirmation = (registrationId: string, customerName: string) => {
    setDeleteRegistrationConfirmation({ isOpen: true, registrationId, customerName })
  }

  const handleLogout = () => {
    fetch('/api/admin-logout', { method: 'POST' }).finally(() => {
      router.push('/')
    })
  }

  // Manually mark competition as completed
  const completeCompetition = async (competition: Competition) => {
    if (operationLoading.complete.has(competition.id)) return

    const confirmMsg = `Opravdu chcete přesunout závod "${competition.name}" do dokončených? Tuto akci nelze vrátit.`
    if (!window.confirm(confirmMsg)) return

    setOperationLoading(prev => ({
      ...prev,
      complete: new Set(prev.complete).add(competition.id)
    }))

    // Set endDate so that isCompetitionCompleted() immediately returns true (end +48h < now)
    const pastEnd = new Date(Date.now() - 49 * 60 * 60 * 1000) // 49 h ago

    try {
      const res = await fetch(`/api/competitions/${competition.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endDate: pastEnd.toISOString() })
      })
      if (res.ok) {
        await fetchData()
        showFeedback('success', 'Závod byl označen jako dokončený')
      } else {
        const err = await res.json()
        showFeedback('error', `Chyba při dokončení závodu: ${err.message || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Complete competition error', error)
      showFeedback('error', 'Chyba při dokončení závodu')
    } finally {
      setOperationLoading(prev => {
        const newSet = new Set(prev.complete)
        newSet.delete(competition.id)
        return { ...prev, complete: newSet }
      })
    }
  }

  // Load next page of reservations -------------------------------------------
  const loadMoreReservations = async () => {
    if (!hasMoreReservations || loadingMore) return
    setLoadingMore(true)
    const skip = reservationPage * PAGE_SIZE
    try {
      const res = await fetch(`/api/reservations?limit=${PAGE_SIZE}&skip=${skip}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setReservations(prev => [...prev, ...data])
          setReservationPage(prev => prev + 1)
          if (data.length < PAGE_SIZE) setHasMoreReservations(false)
        }
      }
    } catch (err) {
      console.error('Error loading more reservations', err)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Správa rezervací, lovných míst a závodů</h1>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
            <span>Odhlásit</span>
          </button>
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
              <table className="min-w-full divide-y divide-gray-200 admin-table">
                <thead className="bg-gray-50">
                  <tr>
                    {/* Rybář */}
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('customerName')}
                    >
                      <div className="flex items-center">
                        Rybář
                        {sortConfig.key === 'customerName' && (
                          <span className="ml-1">{sortConfig.direction === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </div>
                    </th>
                    {/* Místo */}
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('spotId')}
                    >
                      <div className="flex items-center">
                        Místo
                        {sortConfig.key === 'spotId' && (
                          <span className="ml-1">{sortConfig.direction === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </div>
                    </th>
                    {/* Datum a délka */}
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('startDate')}
                    >
                      <div className="flex items-center">
                        Datum a délka
                        {sortConfig.key === 'startDate' && (
                          <span className="ml-1">{sortConfig.direction === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </div>
                    </th>
                    {/* Vybavení */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vybavení
                    </th>
                    {/* Cena */}
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('totalPrice')}
                    >
                      <div className="flex items-center">
                        Cena
                        {sortConfig.key === 'totalPrice' && (
                          <span className="ml-1">{sortConfig.direction === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </div>
                    </th>
                    {/* VS */}
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('variableSymbol')}
                    >
                      <div className="flex items-center">
                        VS
                        {sortConfig.key === 'variableSymbol' && (
                          <span className="ml-1">{sortConfig.direction === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </div>
                    </th>
                    {/* Placeno */}
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('isPaid')}
                    >
                      <div className="flex items-center">
                        Placeno?
                        {sortConfig.key === 'isPaid' && (
                          <span className="ml-1">{sortConfig.direction === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </div>
                    </th>
                    {/* Registrováno */}
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center">
                        Registrováno
                        {sortConfig.key === 'createdAt' && (
                          <span className="ml-1">{sortConfig.direction === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </div>
                    </th>
                    {/* Smazat */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Smazat</th>
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
                      {/* Místo */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(() => {
                          const num = reservation.fishingSpot?.number
                          if (num === 99 || reservation.fishingSpot?.name === 'Lovné místo VIP') {
                            return 'VIP'
                          }
                          return num ? `#${num}` : `#${reservation.spotId}`
                        })()}
                      </td>
                      {/* Datum a délka */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(reservation.startDate), 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reservation.duration === 'day' ? 'Jeden den' : reservation.duration === '24h' ? '24 hodin' : '48 hodin'}
                        </div>
                      </td>
                      {/* Vybavení */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {reservation.rentedGear ? (
                          <div className="space-y-1">
                            {getGearNames(reservation.rentedGear).map((name, idx) => (
                              <div key={idx} className="text-xs text-green-600">
                                {name}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      {/* Cena */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{reservation.totalPrice} Kč</div>
                        {reservation.rentedGear && (
                          <div className="text-xs text-green-600">+ vybavení {reservation.gearPrice} Kč</div>
                        )}
                      </td>
                      {/* VS */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reservation.variableSymbol || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reservation.isPaid ? (
                          <span role="img" aria-label="paid">✅</span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={()=>setPayConfirmation({ isOpen:true, reservationId: reservation.id, customerName: reservation.customerName })}
                            className="w-6 h-6 sm:w-4 sm:h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(reservation.createdAt), 'd.M.yyyy HH:mm', { locale: cs })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openDeleteConfirmation(reservation.id, reservation.customerName)}
                          disabled={operationLoading.delete}
                          className="p-2 rounded hover:bg-gray-100 text-red-600 disabled:opacity-50"
                          title="Smazat rezervaci" aria-label="Smazat rezervaci"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22m-7-4V3a2 2 0 00-2-2h-4a2 2 0 00-2 2v4" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Load more button */}
              {hasMoreReservations && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={loadMoreReservations}
                    disabled={loadingMore}
                    className="px-4 py-2 bg-semin-blue text-white rounded-lg hover:bg-semin-blue/90 disabled:opacity-50"
                  >
                    {loadingMore ? 'Načítám…' : 'Načíst další'}
                  </button>
                </div>
              )}
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
                        <div className={`rounded-lg p-3 flex flex-col gap-1 ${nextReservation.isPaid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                          <div className={`text-base font-semibold ${nextReservation.isPaid ? 'text-green-900' : 'text-yellow-900'}`}>{nextReservation.customerName}</div>
                          <div className={`text-lg font-bold ${nextReservation.isPaid ? 'text-green-800' : 'text-yellow-800'}`}>
                            {format(new Date(nextReservation.startDate), 'd.M.yyyy HH:mm', { locale: cs })}
                          </div>
                          <div className={`text-xs ${nextReservation.isPaid ? 'text-green-700' : 'text-yellow-700'}`}>
                            {nextReservation.duration === 'day' ? 'Jeden den' :
                             nextReservation.duration === '24h' ? '24 hodin' : '48 hodin'}
                          </div>
                          <div className={`text-xs ${nextReservation.isPaid ? 'text-green-700' : 'text-yellow-700'}`}>{nextReservation.customerEmail} | {nextReservation.customerPhone}</div>
                          <div className={`text-xs font-semibold mt-1 ${nextReservation.isPaid ? 'text-green-700' : 'text-yellow-700'}`}
                            >{nextReservation.isPaid ? 'Zaplaceno' : 'Nezaplaceno'}</div>
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
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-600 mb-1" htmlFor="comp-name">Název závodu</label>
                  <input
                    id="comp-name"
                    type="text"
                    placeholder="Název závodu"
                    value={newCompetition.name}
                    onChange={(e) => setNewCompetition({ ...newCompetition, name: e.target.value })}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg"
                    disabled={operationLoading.create}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-600 mb-1" htmlFor="comp-date">Datum a čas</label>
                  <input
                    id="comp-date"
                    type="datetime-local"
                    value={newCompetition.date}
                    onChange={(e) => setNewCompetition({ ...newCompetition, date: e.target.value })}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg"
                    disabled={operationLoading.create}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-600 mb-1" htmlFor="comp-end">Datum a konec</label>
                  <input
                    id="comp-end"
                    type="datetime-local"
                    value={newCompetition.endDate}
                    onChange={(e) => setNewCompetition({ ...newCompetition, endDate: e.target.value })}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg"
                    disabled={operationLoading.create}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-600 mb-1" htmlFor="comp-cap">Kapacita</label>
                  <input
                    id="comp-cap"
                    type="number"
                    placeholder="Kapacita"
                    value={newCompetition.capacity}
                    onChange={(e) => setNewCompetition({ ...newCompetition, capacity: e.target.value })}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg"
                    disabled={operationLoading.create}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-600 mb-1" htmlFor="comp-fee">Startovné (Kč)</label>
                  <input
                    id="comp-fee"
                    type="number"
                    placeholder="Startovné (Kč)"
                    value={newCompetition.entryFee}
                    onChange={(e) => setNewCompetition({ ...newCompetition, entryFee: e.target.value })}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg"
                    disabled={operationLoading.create}
                  />
                </div>
                {/* Obsadí lovná místa - selector */}
                <div className="col-span-full">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Obsadí lovná místa</label>
                  <div className="flex flex-wrap gap-2">
                    {fishingSpots.map(spot => {
                      const selected = newCompetition.blockedSpotIds.includes(spot.id)
                      return (
                        <label key={spot.id} className={`flex items-center space-x-1 px-2 py-1 border-2 rounded-lg cursor-pointer ${selected ? 'border-semin-blue bg-semin-light-blue' : 'border-gray-200'}`}>
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-semin-blue"
                            checked={selected}
                            onChange={() => {
                              setNewCompetition(prev => {
                                const list = selected ? prev.blockedSpotIds.filter(id => id !== spot.id) : [...prev.blockedSpotIds, spot.id]
                                return { ...prev, blockedSpotIds: list }
                              })
                            }}
                          />
                          <span className="text-sm">{spot.number}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
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
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-semin-blue"></div>
                </div>
              ) : getActiveCompetitions().length === 0 ? (
                <div className="text-center py-12 text-semin-gray">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <p className="text-lg font-medium">Žádné aktivní závody</p>
                  <p className="mt-2">Vytvořte nový závod pomocí formuláře výše</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {getActiveCompetitions().map((competition) => (
                    <div key={competition.id} className={`border border-gray-200 rounded-lg p-6 ${!competition.isActive ? 'bg-gray-50' : ''}`}>
                      <div className="flex flex-col sm:flex-row sm:justify-between items-start mb-4 space-y-3 sm:space-y-0">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 truncate max-w-full">{competition.name}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            <div>
                              Datum: {format(new Date(competition.date), 'dd.MM.yyyy HH:mm', { locale: cs })}
                              {competition.endDate && (
                                <> – {format(new Date(competition.endDate), 'dd.MM.yyyy HH:mm', { locale: cs })}</>
                              )}
                            </div>
                            <div>Kapacita: {competition.registrations?.length || 0} / {competition.capacity} účastníků</div>
                            <div>Vstupné: {competition.entryFee} Kč</div>
                            <div className="font-semibold">Tržby: {competition.registrations?.reduce((sum,r)=>sum + (r.totalPrice||0),0)} Kč</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {/* Edit icon */}
                          <button
                            onClick={() => openEditCompetition(competition)}
                            disabled={operationLoading.update || operationLoading.toggle.has(competition.id)}
                            className="p-2 rounded hover:bg-gray-100 text-blue-600 disabled:opacity-50" 
                            title="Upravit"
                            aria-label="Upravit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 3.487a2.007 2.007 0 112.83 2.83L9.06 16.95l-3.89 1.06a.75.75 0 01-.92-.92l1.06-3.89 10.612-10.61z" />
                            </svg>
                          </button>

                          {/* Active toggle */}
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 select-none">{competition.isActive ? 'Viditelný' : 'Skrytý'}</span>
                            <button
                              onClick={() => toggleCompetitionStatus(competition.id, !competition.isActive)}
                              disabled={operationLoading.toggle.has(competition.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-semin-blue ${
                                competition.isActive ? 'bg-semin-blue' : 'bg-gray-200'
                              } disabled:opacity-50`}
                              aria-label="Přepnout aktivitu závodu"
                            >
                              {operationLoading.toggle.has(competition.id) ? (
                                <svg className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                    competition.isActive ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              )}
                            </button>
                          </div>

                          {/* Complete icon */}
                          <button
                            onClick={() => completeCompetition(competition)}
                            disabled={operationLoading.complete.has(competition.id) || operationLoading.toggle.has(competition.id)}
                            className="p-2 rounded hover:bg-gray-100 text-green-600 disabled:opacity-50"
                            title="Dokončit" aria-label="Dokončit"
                          >
                            {operationLoading.complete.has(competition.id) ? (
                              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          {/* Delete icon */}
                          <button
                            onClick={() => openDeleteCompetitionConfirmation(competition.id, competition.name)}
                            disabled={operationLoading.delete}
                            className="p-2 rounded hover:bg-gray-100 text-red-600 disabled:opacity-50"
                            title="Smazat závod" aria-label="Smazat závod"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22m-7-4V3a2 2 0 00-2-2h-4a2 2 0 00-2 2v4" />
                            </svg>
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
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => downloadCompetitionCSV(competition)}
                                className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>CSV</span>
                              </button>
                              {isCompetitionCompleted(competition) && (
                                <button
                                  onClick={() => openDeleteCompetitionConfirmation(competition.id, competition.name)}
                                  className="p-2 rounded hover:bg-gray-100 text-red-600"
                                  title="Smazat závod" aria-label="Smazat závod"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22m-7-4V3a2 2 0 00-2-2h-4a2 2 0 00-2 2v4" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 admin-table">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleCompetitionSort(competition.id, 'customerName')}>
                                    <div className="flex items-center">
                                      Rybář
                                      {competitionSortConfigs[competition.id]?.key === 'customerName' && (
                                        <span className="ml-1">{competitionSortConfigs[competition.id]?.direction === 'desc' ? '↓' : '↑'}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleCompetitionSort(competition.id, 'variableSymbol')}>
                                    <div className="flex items-center">
                                      VS
                                      {competitionSortConfigs[competition.id]?.key === 'variableSymbol' && (
                                        <span className="ml-1">{competitionSortConfigs[competition.id]?.direction === 'desc' ? '↓' : '↑'}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vybavení
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleCompetitionSort(competition.id, 'totalPrice')}>
                                    <div className="flex items-center">
                                      Cena
                                      {competitionSortConfigs[competition.id]?.key === 'totalPrice' && (
                                        <span className="ml-1">{competitionSortConfigs[competition.id]?.direction === 'desc' ? '↓' : '↑'}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleCompetitionSort(competition.id, 'isPaid')}>
                                    <div className="flex items-center">
                                      Placeno?
                                      {competitionSortConfigs[competition.id]?.key === 'isPaid' && (
                                        <span className="ml-1">{competitionSortConfigs[competition.id]?.direction === 'desc' ? '↓' : '↑'}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleCompetitionSort(competition.id, 'registeredAt')}>
                                    <div className="flex items-center">
                                      Registrováno
                                      {competitionSortConfigs[competition.id]?.key === 'registeredAt' && (
                                        <span className="ml-1">{competitionSortConfigs[competition.id]?.direction === 'desc' ? '↓' : '↑'}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Smazat
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {getSortedRegistrations(competition).map((registration) => (
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
                                        className="w-6 h-6 sm:w-4 sm:h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                                      />
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {format(new Date(registration.registeredAt || registration.createdAt), 'd.M.yyyy HH:mm', { locale: cs })}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                      <button
                                        onClick={() => openDeleteRegistrationConfirmation(registration.id, registration.customerName)}
                                        className="p-2 rounded hover:bg-gray-100 text-red-600"
                                        title="Smazat registraci" aria-label="Smazat registraci"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22m-7-4V3a2 2 0 00-2-2h-4a2 2 0 00-2 2v4" />
                                        </svg>
                                      </button>
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
              )}
            </div>

            {/* Completed Competitions */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="text-xl font-bold text-semin-blue mb-4">Dokončené závody</h3>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-semin-blue"></div>
                </div>
              ) : getCompletedCompetitions().length === 0 ? (
                <div className="text-center py-12 text-semin-gray">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <p className="text-lg font-medium">Žádné dokončené závody</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {getCompletedCompetitions().map((competition) => (
                    <div key={competition.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <div className="flex flex-col sm:flex-row sm:justify-between items-start mb-4 space-y-3 sm:space-y-0">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-700 truncate max-w-full">{competition.name}</h4>
                          <div className="text-sm text-gray-500 mt-1">
                            <div>
                              Datum: {format(new Date(competition.date), 'dd.MM.yyyy HH:mm', { locale: cs })}
                              {competition.endDate && (
                                <> – {format(new Date(competition.endDate), 'dd.MM.yyyy HH:mm', { locale: cs })}</>
                              )}
                            </div>
                            <div>Počet účastníků: {competition.registrations?.length || 0} / {competition.capacity}</div>
                            <div>Vstupné: {competition.entryFee} Kč</div>
                            <div className="font-semibold">Tržby: {competition.registrations?.reduce((sum,r)=>sum + (r.totalPrice||0),0)} Kč</div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0 text-right sm:text-left">
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
                          <button
                            onClick={() => openDeleteCompetitionConfirmation(competition.id, competition.name)}
                            className="p-2 rounded hover:bg-gray-100 text-red-600"
                            title="Smazat závod" aria-label="Smazat závod"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22m-7-4V3a2 2 0 00-2-2h-4a2 2 0 00-2 2v4" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Final Results Table */}
                      {competition.registrations && competition.registrations.length > 0 && (
                        <div className="border-t pt-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Shrnutí</h5>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 admin-table">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleCompetitionSort(competition.id, 'customerName')}>
                                    <div className="flex items-center">
                                      Rybář
                                      {competitionSortConfigs[competition.id]?.key === 'customerName' && (
                                        <span className="ml-1">{competitionSortConfigs[competition.id]?.direction === 'desc' ? '↓' : '↑'}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleCompetitionSort(competition.id, 'variableSymbol')}>
                                    <div className="flex items-center">
                                      VS
                                      {competitionSortConfigs[competition.id]?.key === 'variableSymbol' && (
                                        <span className="ml-1">{competitionSortConfigs[competition.id]?.direction === 'desc' ? '↓' : '↑'}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vybavení
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleCompetitionSort(competition.id, 'totalPrice')}>
                                    <div className="flex items-center">
                                      Cena
                                      {competitionSortConfigs[competition.id]?.key === 'totalPrice' && (
                                        <span className="ml-1">{competitionSortConfigs[competition.id]?.direction === 'desc' ? '↓' : '↑'}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleCompetitionSort(competition.id, 'isPaid')}>
                                    <div className="flex items-center">
                                      Placeno?
                                      {competitionSortConfigs[competition.id]?.key === 'isPaid' && (
                                        <span className="ml-1">{competitionSortConfigs[competition.id]?.direction === 'desc' ? '↓' : '↑'}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleCompetitionSort(competition.id, 'registeredAt')}>
                                    <div className="flex items-center">
                                      Registrováno
                                      {competitionSortConfigs[competition.id]?.key === 'registeredAt' && (
                                        <span className="ml-1">{competitionSortConfigs[competition.id]?.direction === 'desc' ? '↓' : '↑'}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Smazat
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {getSortedRegistrations(competition).map((registration) => (
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
                                        className="w-6 h-6 sm:w-4 sm:h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                                      />
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {format(new Date(registration.registeredAt || registration.createdAt), 'd.M.yyyy HH:mm', { locale: cs })}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                      <button
                                        onClick={() => openDeleteRegistrationConfirmation(registration.id, registration.customerName)}
                                        className="p-2 rounded hover:bg-gray-100 text-red-600"
                                        title="Smazat registraci" aria-label="Smazat registraci"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22m-7-4V3a2 2 0 00-2-2h-4a2 2 0 00-2 2v4" />
                                        </svg>
                                      </button>
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
              )}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Datum a konec</label>
                      <input
                        type="datetime-local"
                        value={editFormData.endDate}
                        onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
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
                  {/* Obsadí lovná místa - selector (edit) */}
                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Obsadí lovná místa</label>
                    <div className="flex flex-wrap gap-2">
                      {fishingSpots.map(spot => {
                        const selected = editFormData.blockedSpotIds.includes(spot.id)
                        return (
                          <label key={spot.id} className={`flex items-center space-x-1 px-2 py-1 border-2 rounded-lg cursor-pointer ${selected ? 'border-semin-blue bg-semin-light-blue' : 'border-gray-200'}`}>
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-semin-blue"
                              checked={selected}
                              onChange={() => {
                                setEditFormData(prev => {
                                  const list = selected ? prev.blockedSpotIds.filter(id => id !== spot.id) : [...prev.blockedSpotIds, spot.id]
                                  return { ...prev, blockedSpotIds: list }
                                })
                              }}
                            />
                            <span className="text-sm">{spot.number}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Registration Confirmation Modal */}
            {deleteRegistrationConfirmation.isOpen && (
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
                        Smazat registraci
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Opravdu chcete smazat registraci pro <strong>{deleteRegistrationConfirmation.customerName}</strong>? Tuto akci nelze vrátit zpět.
                      </p>
                      <div className="flex space-x-3 justify-center">
                        <button
                          onClick={() => setDeleteRegistrationConfirmation({ isOpen: false, registrationId: '', customerName: '' })}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                          disabled={operationLoading.delete}
                        >
                          Zrušit
                        </button>
                        <button
                          onClick={() => deleteCompetitionRegistration(deleteRegistrationConfirmation.registrationId)}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={operationLoading.delete}
                        >
                          {operationLoading.delete ? 'Mažu…' : 'Smazat registraci'}
                        </button>
                      </div>
                    </div>
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

      {/* Pay Confirmation Modal */}
      {payConfirmation.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
                <span className="text-2xl">💰</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Potvrzení platby</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Potvrdit přijetí platby od <strong>{payConfirmation.customerName}</strong> a odeslat potvrzovací email?
                </p>
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={()=>setPayConfirmation({ isOpen:false, reservationId:'', customerName:'' })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >Zrušit</button>
                  <button
                    onClick={()=>{updateReservationPaidStatus(payConfirmation.reservationId,true); setPayConfirmation({ isOpen:false, reservationId:'', customerName:'' })}}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >Potvrdit</button>
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