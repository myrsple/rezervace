import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    console.log('Fetching competitions...')
    let competitions = await prisma.competition.findMany({
      include: {
        registrations: true
      },
      orderBy: { date: 'asc' }
    })
    
    // If no competitions exist, create sample ones
    if (competitions.length === 0) {
      console.log('No competitions found, creating sample competitions...')
      
      const sampleCompetitions = [
        {
          name: 'Jarní závody 2025',
          date: new Date('2025-04-15T08:00:00Z'),
          capacity: 30,
          entryFee: 200,
          isActive: true
        },
        {
          name: 'Letní turnaj',
          date: new Date('2025-07-20T06:00:00Z'),
          capacity: 50,
          entryFee: 300,
          isActive: true
        }
      ]
      
      for (const comp of sampleCompetitions) {
        await prisma.competition.create({ data: comp })
      }
      
      // Fetch again after creating
      competitions = await prisma.competition.findMany({
        include: {
          registrations: true
        },
        orderBy: { date: 'asc' }
      })
    }
    
    console.log('Found competitions:', competitions.length)
    return NextResponse.json(competitions)
  } catch (error) {
    console.error('Detailed error fetching competitions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    return NextResponse.json(
      { 
        error: 'Failed to fetch competitions',
        details: errorMessage,
        name: errorName
      },
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