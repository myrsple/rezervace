import { PrismaClient } from '@prisma/client'
import { addHours } from 'date-fns'

const prisma = new PrismaClient()

// Duration hours as stored in the reservation.duration field
const DURATION_HOURS: Record<string, number> = {
  '24h': 24,
  '48h': 48,
  '72h': 72,
  '96h': 96,
}

async function main() {
  const reservations = await prisma.reservation.findMany({
    where: {
      duration: { in: Object.keys(DURATION_HOURS) },
    },
  })

  for (const res of reservations) {
    const hours = DURATION_HOURS[res.duration as keyof typeof DURATION_HOURS]
    if (!hours) continue

    // Desired start at 12:00 local time
    const desiredStart = new Date(res.startDate)
    desiredStart.setHours(12, 0, 0, 0)

    // Determine end date: desiredStart + durationHours - 2h → 10:00 local time of last day
    const dayOffset = hours / 24 // 1,2,3,4
    const desiredEnd = new Date(desiredStart)
    desiredEnd.setDate(desiredEnd.getDate() + dayOffset)
    desiredEnd.setHours(10, 0, 0, 0)

    const updates: any = {}

    const currentStart = new Date(res.startDate)
    if (Math.abs(currentStart.getTime() - desiredStart.getTime()) >= 60 * 1000) {
      updates.startDate = desiredStart
    }

    const currentEnd = new Date(res.endDate)
    if (Math.abs(currentEnd.getTime() - desiredEnd.getTime()) >= 60 * 1000) {
      updates.endDate = desiredEnd
    }

    if (Object.keys(updates).length === 0) {
      continue // nothing to do
    }

    await prisma.reservation.update({
      where: { id: res.id },
      data: updates,
    })

    console.log(
      `Adjusted reservation ${res.id}: ${Object.keys(updates).join(', ')}`
    )
  }
}

main()
  .catch((err) => {
    console.error(err)
  })
  .finally(() => prisma.$disconnect()) 