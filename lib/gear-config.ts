import { GearItem } from '@/types'

export const GEAR_ITEMS: GearItem[] = [
  {
    id: 'rod_reel',
    name: 'Prut + naviják',
    description: 'Kompletní sada: teleskopický prut 3,5m + špička + naviják',
    price: 200,
    emoji: '🎣'
  },
  {
    id: 'tackle_box',
    name: 'Drobné náčiní',
    description: 'Plná krabička: háčky, olova, splávky, vlasce, nástrahy',
    price: 150,
    emoji: '🗃️'
  },
  {
    id: 'chair',
    name: 'Rybářská židle',
    description: 'Pohodlná skládací židle s operadlem a držákem na prut',
    price: 100,
    emoji: '🪑'
  },
  {
    id: 'net',
    name: 'Podběrák',
    description: 'Velký podběrák s teleskopickou rukojetí, ideální pro větší ryby',
    price: 80,
    emoji: '🥅'
  },
  {
    id: 'rum_flask',
    name: 'Flaška rumu',
    description: 'Kvalitní český rum pro zahřátí během dlouhého rybaření',
    price: 100,
    emoji: '🥃'
  },
  {
    id: 'bait',
    name: 'Návnada',
    description: 'Čerstvá návnada - žížaly, kukuřice, peletky (denní dávka)',
    price: 80,
    emoji: '🪱'
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