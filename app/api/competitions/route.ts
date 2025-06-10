import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const competitions = await prisma.competition.findMany({
      include: {
        registrations: true
      },
      orderBy: { date: 'asc' }
    })
    
    return NextResponse.json(competitions)
  } catch (error) {
    console.error('Error fetching competitions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch competitions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, date, capacity, entryFee } = body

    const competition = await prisma.competition.create({
      data: {
        name,
        date: new Date(date),
        capacity: parseInt(capacity),
        entryFee: parseFloat(entryFee) || 0,
        isActive: true
      },
      include: {
        registrations: true
      }
    })

    return NextResponse.json(competition, { status: 201 })
  } catch (error) {
    console.error('Error creating competition:', error)
    return NextResponse.json(
      { error: 'Failed to create competition' },
      { status: 500 }
    )
  }
} 