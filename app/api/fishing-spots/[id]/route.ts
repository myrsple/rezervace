import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const spotId = parseInt(params.id)
    if (isNaN(spotId)) {
      return NextResponse.json(
        { error: 'Invalid fishing spot ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean value' },
        { status: 400 }
      )
    }

    // Check if fishing spot exists
    const existingSpot = await prisma.fishingSpot.findUnique({
      where: { id: spotId }
    })

    if (!existingSpot) {
      return NextResponse.json(
        { error: 'Fishing spot not found' },
        { status: 404 }
      )
    }

    // Check for active reservations if we're trying to deactivate
    if (!isActive) {
      const activeReservations = await prisma.reservation.count({
        where: {
          spotId,
          status: 'CONFIRMED',
          endDate: {
            gt: new Date()
          }
        }
      })

      if (activeReservations > 0) {
        return NextResponse.json(
          { error: 'Cannot deactivate spot with active reservations' },
          { status: 400 }
        )
      }
    }

    const fishingSpot = await prisma.fishingSpot.update({
      where: { id: spotId },
      data: { isActive },
    })

    return NextResponse.json({
      message: `Fishing spot ${isActive ? 'activated' : 'deactivated'} successfully`,
      fishingSpot
    })
  } catch (error) {
    console.error('Error updating fishing spot:', error)
    return NextResponse.json(
      { error: 'Failed to update fishing spot' },
      { status: 500 }
    )
  }
} 