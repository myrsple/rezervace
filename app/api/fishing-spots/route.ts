import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const spots = await prisma.fishingSpot.findMany({
      orderBy: { number: 'asc' }
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