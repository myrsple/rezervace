import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple back-off retry wrapper around a Prisma query
async function queryWithRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let delay = 100
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      console.error(`Competitions query failed (attempt ${i + 1})`, err)
      if (i === attempts - 1) throw err
      await new Promise(r => setTimeout(r, delay))
      delay *= 3
    }
  }
  // should never reach
  throw new Error('unreachable')
}

export async function GET() {
  try {
    const competitions = await queryWithRetry(() =>
      prisma.competition.findMany({
        include: { registrations: true },
        orderBy: { date: 'asc' },
      })
    )

    return NextResponse.json(competitions, { status: 200 })
  } catch (err) {
    console.error('Competitions endpoint fatal error', err)
    // Tell the client data are temporarily unavailable – keeps spinner + retries
    return NextResponse.json({ error: 'Database temporarily unavailable' }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, date, endDate, capacity, entryFee } = body

    if (!name || !date || !capacity || !entryFee) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Ensure endDate is after start date; default to +24h if not provided
    const startDateObj = new Date(date)
    const endDateObj = endDate ? new Date(endDate) : new Date(startDateObj.getTime() + 24 * 60 * 60 * 1000)

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    if (endDateObj <= startDateObj) {
      return NextResponse.json({ error: 'endDate must be after start date' }, { status: 400 })
    }

    const competition = await prisma.competition.create({
      data: {
        name,
        date: startDateObj,
        // @ts-ignore endDate available after next prisma generate
        endDate: endDateObj,
        capacity: parseInt(capacity),
        entryFee: parseFloat(entryFee),
        isActive: true
      } as any,
      include: {
        registrations: true
      }
    })

    return NextResponse.json(competition)
  } catch (error) {
    console.error('Error creating competition:', error)
    return NextResponse.json(
      { error: 'Failed to create competition' },
      { status: 500 }
    )
  }
} 