import { PrismaClient } from '@prisma/client'
import { addHours, addDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  const legacy = await prisma.reservation.findMany({
    where: {
      duration: { in: ['24h', '48h'] },
    },
  })

  for (const res of legacy) {
    const start = new Date(res.startDate)
    const hours = start.getHours()
    // Skip if already noon based
    if (hours === 12) continue

    // Round to next/prev noon
    let newStart = new Date(start)
    newStart.setMinutes(0, 0, 0)
    if (hours < 12) {
      newStart.setHours(12)
    } else {
      // hours > 12 (typically 18) -> shift to next day's noon
      newStart = addDays(newStart, 1)
      newStart.setHours(12, 0, 0, 0)
    }

    const newEnd = addHours(newStart, res.duration === '24h' ? 24 : 48)

    await prisma.reservation.update({
      where: { id: res.id },
      data: {
        startDate: newStart,
        endDate: newEnd,
        startTime: 'noon',
      },
    })

    console.log(`Fixed reservation ${res.id}: ${start.toISOString()} -> ${newStart.toISOString()}`)
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect()) 