import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { sendReservationPaymentReceived } from '../../../../lib/email'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, isPaid } = body

    // Fetch current reservation to detect isPaid transition
    const current = await prisma.reservation.findUnique({
      where: { id: params.id },
      include: { fishingSpot: true }
    })

    if (!current) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Build update fields
    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (isPaid !== undefined) updateData.isPaid = isPaid

    const reservation = await prisma.reservation.update({
      where: { id: params.id },
      data: updateData,
      include: { fishingSpot: true }
    })

    // If payment just marked received, send email
    if (!current.isPaid && reservation.isPaid) {
      console.info('[reservation] Payment received, sending confirmation email', reservation.id)
      await sendReservationPaymentReceived(reservation).catch(console.error)
    }

    return NextResponse.json(reservation)
  } catch (error) {
    console.error('Error updating reservation:', error)
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    )
  }
} 