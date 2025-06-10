import { NextRequest, NextResponse } from 'next/server'
import { withDatabaseWarmup } from '../../../lib/db-warmup'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const spots = await withDatabaseWarmup(async () => {
      return prisma.fishingSpot.findMany({
        orderBy: { number: 'asc' }
      })
    })
    
    return NextResponse.json(spots)
  } catch (error) {
    console.error('Error fetching fishing spots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fishing spots' },
      { status: 500 }
    )
  }
} 