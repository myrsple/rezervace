import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { addDays, addHours } from 'date-fns'

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
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('Error parsing request body:', error)
      return NextResponse.json(
        { error: 'Invalid request format' },
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
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate date format
    const startDateTime = new Date(startDate)
    if (isNaN(startDateTime.getTime())) {
      console.error('Invalid date format:', startDate)
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Calculate end date based on duration
    let endDate: Date
    switch (duration) {
      case 'day':
        // Single day booking: same day but different end time
        endDate = new Date(startDateTime)
        endDate.setHours(22, 0, 0, 0) // 10 PM
        startDateTime.setHours(6, 0, 0, 0) // 6 AM
        break
      case '24h':
        if (startTime === 'morning') {
          startDateTime.setHours(6, 0, 0, 0) // 6 AM
          endDate = addHours(startDateTime, 24)
        } else {
          startDateTime.setHours(18, 0, 0, 0) // 6 PM
          endDate = addHours(startDateTime, 24)
        }
        break
      case '48h':
        if (startTime === 'morning') {
          startDateTime.setHours(6, 0, 0, 0) // 6 AM
          endDate = addHours(startDateTime, 48)
        } else {
          startDateTime.setHours(18, 0, 0, 0) // 6 PM
          endDate = addHours(startDateTime, 48)
        }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid duration' },
          { status: 400 }
        )
    }

    // Check for conflicts
    const conflictingReservations = await prisma.reservation.findMany({
      where: {
        spotId: spotId,
        status: { not: 'CANCELLED' },
        OR: [
          {
            AND: [
              { startDate: { lte: startDateTime } },
              { endDate: { gte: startDateTime } }
            ]
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } }
            ]
          },
          {
            AND: [
              { startDate: { gte: startDateTime } },
              { endDate: { lte: endDate } }
            ]
          }
        ]
      }
    })

    if (conflictingReservations.length > 0) {
      // Check if conflicts are compatible (day booking vs full day booking)
      const hasFullDayConflict = conflictingReservations.some(reservation => 
        reservation.duration === '24h' || reservation.duration === '48h'
      )
      
      if (hasFullDayConflict || (duration === '24h' || duration === '48h')) {
        return NextResponse.json(
          { error: 'Time slot is already booked' },
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
        return new NextResponse(JSON.stringify({ error: 'Duplicate reservation found' }), {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }
      if (prismaError.code === 'P2003') {
        return new NextResponse(JSON.stringify({ error: 'Invalid fishing spot ID' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }
      
      return new NextResponse(JSON.stringify({ 
        error: 'Failed to create reservation in database. Please try again.' 
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
      error: 'An unexpected error occurred. Please try again.' 
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
        { error: 'Reservation ID is required' },
        { status: 400 }
      )
    }

    // Check if reservation exists
    const existingReservation = await prisma.reservation.findUnique({
      where: { id: reservationId }
    })

    if (!existingReservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    // Delete the reservation
    await prisma.reservation.delete({
      where: { id: reservationId }
    })

    return NextResponse.json(
      { message: 'Reservation deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting reservation:', error)
    return NextResponse.json(
      { error: 'Failed to delete reservation' },
      { status: 500 }
    )
  }
} 