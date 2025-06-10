import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Generate a random 6-digit variable symbol
function generateVariableSymbol(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function GET() {
  try {
    const registrations = await prisma.competitionRegistration.findMany({
      include: {
        competition: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(registrations)
  } catch (error) {
    console.error('Error fetching competition registrations:', error)
    return NextResponse.json(
      { error: 'Chyba při načítání registrací' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      competitionId, 
      customerName, 
      customerEmail, 
      customerPhone, 
      totalPrice,
      rentedGear,
      gearPrice 
    } = body

    // Validate required fields
    if (!competitionId || !customerName || !customerEmail || !customerPhone || !totalPrice) {
      return NextResponse.json(
        { error: 'Chybějící povinná pole' },
        { status: 400 }
      )
    }

    // Check if competition exists and is active
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: { registrations: true }
    })

    if (!competition) {
      return NextResponse.json(
        { error: 'Závod nenalezen' },
        { status: 404 }
      )
    }

    if (!competition.isActive) {
      return NextResponse.json(
        { error: 'Závod není aktivní' },
        { status: 400 }
      )
    }

    // Check capacity
    if (competition.registrations.length >= competition.capacity) {
      return NextResponse.json(
        { error: 'Závod je plně obsazen' },
        { status: 400 }
      )
    }

    // Check if already registered
    const existingRegistration = competition.registrations.find(
      r => r.customerEmail === customerEmail
    )

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Na tento závod jste již registrován' },
        { status: 400 }
      )
    }

    // Generate variable symbol for payment
    const variableSymbol = generateVariableSymbol()

    // Create registration
    const registration = await prisma.competitionRegistration.create({
      data: {
        competitionId,
        customerName,
        customerEmail,
        customerPhone,
        totalPrice,
        variableSymbol,
        rentedGear: rentedGear || '',
        gearPrice: gearPrice || 0
      },
      include: {
        competition: true
      }
    })

    return NextResponse.json(registration, { status: 201 })
  } catch (error) {
    console.error('Error creating competition registration:', error)
    return NextResponse.json(
      { error: 'Chyba při registraci na závod' },
      { status: 500 }
    )
  }
} 