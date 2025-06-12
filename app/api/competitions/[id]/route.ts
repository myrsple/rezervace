import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const competitionId = parseInt(params.id)
    
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        registrations: true
      }
    })

    if (!competition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(competition)
  } catch (error) {
    console.error('Error fetching competition:', error)
    return NextResponse.json(
      { error: 'Failed to fetch competition' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const competitionId = parseInt(params.id)
    const body = await request.json()
    
    // Check if competition exists
    const existingCompetition = await prisma.competition.findUnique({
      where: { id: competitionId }
    })

    if (!existingCompetition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.date !== undefined) updateData.date = new Date(body.date)
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate)
    if (body.capacity !== undefined) updateData.capacity = parseInt(body.capacity)
    if (body.entryFee !== undefined) updateData.entryFee = parseFloat(body.entryFee)
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const updatedCompetition = await prisma.competition.update({
      where: { id: competitionId },
      data: updateData,
      include: {
        registrations: true
      }
    })

    return NextResponse.json(updatedCompetition)
  } catch (error) {
    console.error('Error updating competition:', error)
    return NextResponse.json(
      { error: 'Failed to update competition' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const competitionId = parseInt(params.id)
    
    // Check if competition exists
    const existingCompetition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        registrations: true
      }
    })

    if (!existingCompetition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      )
    }

    // Delete all registrations first (cascade delete)
    await prisma.competitionRegistration.deleteMany({
      where: { competitionId }
    })

    // Then delete the competition
    await prisma.competition.delete({
      where: { id: competitionId }
    })

    return NextResponse.json({ message: 'Competition deleted successfully' })
  } catch (error) {
    console.error('Error deleting competition:', error)
    return NextResponse.json(
      { error: 'Failed to delete competition' },
      { status: 500 }
    )
  }
} 