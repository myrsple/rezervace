import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { isActive } = body

    const fishingSpot = await prisma.fishingSpot.update({
      where: { id: parseInt(params.id) },
      data: { isActive },
    })

    return NextResponse.json(fishingSpot)
  } catch (error) {
    console.error('Error updating fishing spot:', error)
    return NextResponse.json(
      { error: 'Failed to update fishing spot' },
      { status: 500 }
    )
  }
} 