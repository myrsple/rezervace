import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { isPaid } = body

    // Create update data object with only provided fields
    const updateData: any = {}
    if (isPaid !== undefined) updateData.isPaid = isPaid

    const registration = await prisma.competitionRegistration.update({
      where: { id: params.id },
      data: updateData,
      include: {
        competition: true
      }
    })

    return NextResponse.json(registration)
  } catch (error) {
    console.error('Error updating competition registration:', error)
    return NextResponse.json(
      { error: 'Failed to update competition registration' },
      { status: 500 }
    )
  }
} 