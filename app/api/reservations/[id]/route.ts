import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, isPaid } = body

    // Create update data object with only provided fields
    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (isPaid !== undefined) updateData.isPaid = isPaid

    const reservation = await prisma.reservation.update({
      where: { id: params.id },
      data: updateData,
      include: {
        fishingSpot: true
      }
    })

    return NextResponse.json(reservation)
  } catch (error) {
    console.error('Error updating reservation:', error)
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    )
  }
} 