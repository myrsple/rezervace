import { GearItem } from '@/types'

export const GEAR_ITEMS: GearItem[] = [
  {
    id: 'prut',
    name: 'Prut',
    description: 'Kvalitní rybářský prut včetně navijáku',
    price: 100,
    emoji: '🎣'
  },
  {
    id: 'podberak',
    name: 'Podběrák',
    description: 'Velký podběrák pro bezpečné podebrání úlovku',
    price: 50,
    emoji: '🥅'
  },
  {
    id: 'podlozka',
    name: 'Podložka',
    description: 'Měkká podložka pro šetrné položení ryby',
    price: 50,
    emoji: '🛏️'
  },
  {
    id: 'vazici_sak',
    name: 'Vážící sak',
    description: 'Sak pro bezpečné zvážení a přechování ryby',
    price: 50,
    emoji: '🧺'
  }
]

export const getGearTotalPrice = (selectedGearIds: string[]): number => {
  return GEAR_ITEMS
    .filter(item => selectedGearIds.includes(item.id))
    .reduce((total, item) => total + item.price, 0)
}

export const getGearNames = (gearString?: string): string[] => {
  if (!gearString) return []
  return gearString.split(',').map(id => {
    const item = GEAR_ITEMS.find(gear => gear.id === id)
    return item ? item.name : id
  })
} 