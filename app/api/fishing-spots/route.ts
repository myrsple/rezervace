import { NextRequest, NextResponse } from 'next/server'
import { withDatabaseWarmup } from '../../../lib/db-warmup'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const spots = await withDatabaseWarmup(async () => {
      const result = await prisma.fishingSpot.findMany({
        orderBy: { number: 'asc' }
      })
      return result || []
    })
    
    // Ensure we always return a valid array
    if (!Array.isArray(spots)) {
      console.error('Invalid spots data:', spots)
      return NextResponse.json([], { status: 200, headers: { 'Cache-Control': 'no-store' } })
    }
    
    return NextResponse.json(spots, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error fetching fishing spots:', error)
    // Always return a valid JSON response
    return NextResponse.json([], { status: 200, headers: { 'Cache-Control': 'no-store' } })
  }
}

export const dynamic = 'force-dynamic' 