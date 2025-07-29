export interface FishingSpot {
  id: number
  number: number
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Reservation {
  id: string
  spotId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  startDate: string
  endDate: string
  duration: string // "24h", "48h", "day"
  startTime: string // "morning", "evening", "6am"
  totalPrice: number
  status: string
  isPaid: boolean
  variableSymbol?: string
  rentedGear?: string // comma-separated list of gear
  gearPrice?: number
  createdAt: string
  updatedAt: string
  fishingSpot?: FishingSpot
}

// ReservationStatus as union type (since SQLite doesn't support enums)
export type ReservationStatus = 'CONFIRMED' | 'CANCELLED'

export interface BookingFormData {
  customerName: string
  customerEmail: string
  customerPhone: string
}

export interface CalendarDay {
  date: Date
  availability: 'available' | 'occupied' | 'competition'
  reservations: Reservation[]
}

export interface PricingConfig {
  day: number
  '24h': number
  '48h': number
}

export interface GearItem {
  id: string
  name: string
  description: string
  price: number
  emoji: string
}

export interface WeatherData {
  date: string
  temperature: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
}

export interface Competition {
  id: number
  name: string
  date: string
  /**
   * End date
   *
   * and time of competition. If omitted (old records) the competition is considered 24h long starting from {@link date}.
   */
  endDate?: string
  capacity: number
  entryFee: number
  isActive: boolean
  registrations?: CompetitionRegistration[]
  /**
   * Fishing spots occupied by this competition. If empty/null the competition blocks ALL spots (legacy behaviour).
   */
  blockedSpots?: CompetitionBlockedSpot[]
  createdAt: string
  updatedAt: string
}

export interface CompetitionRegistration {
  id: string
  competitionId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  totalPrice: number
  isPaid: boolean
  variableSymbol?: string
  rentedGear?: string
  gearPrice?: number
  registeredAt: string
  createdAt: string
  updatedAt: string
  competition?: Competition
}

export interface CompetitionBlockedSpot {
  competitionId: number
  fishingSpotId: number
  fishingSpot?: FishingSpot
} 