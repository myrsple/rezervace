import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    console.log('Attempting to connect to database...')
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20))
    
    const spots = await prisma.fishingSpot.findMany({
      orderBy: { number: 'asc' }
    })
    
    console.log('Successfully fetched spots:', spots.length)
    return NextResponse.json(spots)
  } catch (error) {
    console.error('Detailed error fetching fishing spots:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    return NextResponse.json(
      { 
        error: 'Failed to fetch fishing spots',
        details: errorMessage,
        name: errorName
      },
      { status: 500 }
    )
  }
} 