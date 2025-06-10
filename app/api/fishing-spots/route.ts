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
    
    // Ensure we always return an array, even if empty
    return NextResponse.json(spots || [])
  } catch (error) {
    console.error('Error fetching fishing spots:', error)
    // Return a properly formatted error response
    return NextResponse.json(
      { error: 'Failed to fetch fishing spots', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 