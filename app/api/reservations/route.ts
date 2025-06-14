import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { addDays, addHours } from 'date-fns'
import { sendReservationConfirmation } from '../../../lib/email'

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        fishingSpot: true
      },
      orderBy: { startDate: 'asc' }
    })
    
    return NextResponse.json(reservations)
  } catch (error) {
    console.error('Error fetching reservations:', error)
    // Return empty array instead of error response
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (connError) {
      console.error('Database connection error:', connError)
      return NextResponse.json(
        { error: 'Nepodařilo se připojit k databázi' },
        { status: 503 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('Error parsing request body:', error)
      return NextResponse.json(
        { error: 'Neplatný formát požadavku' },
        { status: 400 }
      )
    }

    // Log incoming request data (excluding sensitive info)
    console.log('Incoming reservation request:', {
      spotId: body.spotId,
      startDate: body.startDate,
      duration: body.duration,
      startTime: body.startTime
    })

    const {
      spotId,
      customerName,
      customerEmail,
      customerPhone,
      startDate,
      duration,
      startTime,
      totalPrice,
      rentedGear,
      gearPrice
    } = body

    // Validate required fields
    const missingFields = []
    if (!spotId) missingFields.push('spotId')
    if (!customerName) missingFields.push('customerName')
    if (!customerEmail) missingFields.push('customerEmail')
    if (!customerPhone) missingFields.push('customerPhone')
    if (!startDate) missingFields.push('startDate')
    if (!duration) missingFields.push('duration')
    if (!totalPrice) missingFields.push('totalPrice')

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields)
      return NextResponse.json(
        { error: `Chybí povinná pole: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate date format
    const startDateTime = new Date(startDate)
    if (isNaN(startDateTime.getTime())) {
      console.error('Invalid date format:', startDate)
      return NextResponse.json(
        { error: 'Neplatný formát data' },
        { status: 400 }
      )
    }

    // Calculate start & end dates in a way that is independent of the server's time-zone.
    // The incoming ISO string encodes midnight in Czech local time (because the
    // browser converted the user-selected calendar day to UTC).  Adding hour
    // offsets instead of using setHours() preserves the intended local times no
    // matter whether the server runs in UTC or another TZ.

    let endDate: Date

    const add = (h: number) => addHours(startDateTime, h)

    switch (duration) {
      case 'day':
        // 06:00 – 22:00 of the chosen day (16-hour window)
        const dayStart = add(6)
        const dayEnd   = add(22)
        startDateTime.setTime(dayStart.getTime())
        endDate = dayEnd
        break
      case '24h':
        // 12:00 day 0 → 10:00 day 1  (22 h span)
        const h24Start = add(12)
        startDateTime.setTime(h24Start.getTime())
        endDate = addHours(h24Start, 22)
        break
      case '48h':
        // 12:00 day 0 → 10:00 day 2  (46 h span)
        const h48Start = add(12)
        startDateTime.setTime(h48Start.getTime())
        endDate = addHours(h48Start, 46)
        break
      case '72h':
        // 12:00 day 0 → 10:00 day 3  (70 h span)
        const h72Start = add(12)
        startDateTime.setTime(h72Start.getTime())
        endDate = addHours(h72Start, 70)
        break
      case '96h':
        // 12:00 day 0 → 10:00 day 4  (94 h span)
        const h96Start = add(12)
        startDateTime.setTime(h96Start.getTime())
        endDate = addHours(h96Start, 94)
        break
      default:
        return NextResponse.json({ error: 'Neplatná délka rezervace' }, { status: 400 })
    }

    // Check for conflicts – treat endDate as exclusive (switch-over at noon)
    // Two intervals [a,b) and [c,d) overlap iff a < d and b > c
    const conflictingReservations = await prisma.reservation.findMany({
      where: {
        spotId: spotId,
        status: { not: 'CANCELLED' },
        startDate: { lt: endDate },
        endDate:   { gt: startDateTime }
      }
    })

    if (conflictingReservations.length > 0) {
      // Check if conflicts are compatible (day booking vs full day booking)
      const hasFullDayConflict = conflictingReservations.some(reservation => 
        ['24h','48h','72h','96h'].includes(reservation.duration as string)
      )
      
      if (hasFullDayConflict || ['24h','48h','72h','96h'].includes(duration)) {
        return NextResponse.json(
          { error: 'Tento termín je již rezervován' },
          { status: 409 }
        )
      }
    }

    // Generate 6-digit variable symbol for payment
    const variableSymbol = Math.floor(100000 + Math.random() * 900000).toString()

    try {
      // Create the reservation
      const reservation = await prisma.reservation.create({
        data: {
          spotId,
          customerName,
          customerEmail,
          customerPhone,
          startDate: startDateTime,
          endDate,
          duration,
          startTime: duration === 'day' ? '6am' : startTime,
          totalPrice,
          status: 'CONFIRMED',
          variableSymbol,
          rentedGear: rentedGear || null,
          gearPrice: gearPrice || null
        },
        include: {
          fishingSpot: true
        }
      })

      // Fire-and-forget confirmation email (no blocking)
      sendReservationConfirmation(reservation).catch(err => console.error('Failed to send confirmation email', err))

      // Ensure we have a valid response object
      const responseData = {
        ...reservation,
        startDate: reservation.startDate.toISOString(),
        endDate: reservation.endDate.toISOString(),
        createdAt: reservation.createdAt.toISOString(),
        updatedAt: reservation.updatedAt.toISOString(),
        fishingSpot: {
          ...reservation.fishingSpot,
          createdAt: reservation.fishingSpot.createdAt.toISOString(),
          updatedAt: reservation.fishingSpot.updatedAt.toISOString()
        }
      }

      return new NextResponse(JSON.stringify(responseData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (dbError) {
      // Enhanced error logging
      console.error('Database error creating reservation. Details:', {
        error: dbError,
        requestData: {
          spotId,
          startDate: startDateTime?.toISOString(),
          endDate: endDate?.toISOString(),
          duration,
          startTime: duration === 'day' ? '6am' : startTime
        }
      })
      
      // Check for specific Prisma errors
      const prismaError = dbError as { code?: string }
      if (prismaError.code === 'P2002') {
        return new NextResponse(JSON.stringify({ error: 'Duplicitní rezervace' }), {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }
      if (prismaError.code === 'P2003') {
        return new NextResponse(JSON.stringify({ error: 'Neplatné ID lovného místa' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }
      
      return new NextResponse(JSON.stringify({ 
        error: 'Nepodařilo se vytvořit rezervaci v databázi. Zkuste to prosím znovu.' 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
  } catch (error) {
    // Enhanced general error logging
    console.error('Unexpected error creating reservation:', error)
    return new NextResponse(JSON.stringify({ 
      error: 'Došlo k neočekávané chybě. Zkuste to prosím znovu.' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reservationId = searchParams.get('id')
    
    if (!reservationId) {
      return NextResponse.json(
        { error: 'ID rezervace je povinné' },
        { status: 400 }
      )
    }

    // Check if reservation exists
    const existingReservation = await prisma.reservation.findUnique({
      where: { id: reservationId }
    })

    if (!existingReservation) {
      return NextResponse.json(
        { error: 'Rezervace nebyla nalezena' },
        { status: 404 }
      )
    }

    // Delete the reservation
    await prisma.reservation.delete({
      where: { id: reservationId }
    })

    return NextResponse.json(
      { message: 'Rezervace byla úspěšně smazána' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting reservation:', error)
    return NextResponse.json(
      { error: 'Nepodařilo se smazat rezervaci' },
      { status: 500 }
    )
  }
} 