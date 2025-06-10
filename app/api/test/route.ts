import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    // Test 1: Basic response
    console.log('Test API route called')
    
    // Test 2: Environment variables
    const hasDbUrl = !!process.env.DATABASE_URL
    const dbUrlStart = process.env.DATABASE_URL?.substring(0, 30) || 'undefined'
    const fullDbUrl = process.env.DATABASE_URL || 'undefined'
    
    console.log('DATABASE_URL exists:', hasDbUrl)
    console.log('DATABASE_URL start:', dbUrlStart)
    console.log('Full DATABASE_URL:', fullDbUrl)
    
    // Test 3: Database connection
    let dbStatus = 'untested'
    let dbError = null
    let fishingSpotCount = 0
    
    try {
      console.log('Attempting database connection...')
      const spots = await prisma.fishingSpot.findMany()
      fishingSpotCount = spots.length
      dbStatus = 'connected'
      console.log('Database connected successfully, found', fishingSpotCount, 'fishing spots')
    } catch (error) {
      dbStatus = 'failed'
      dbError = error instanceof Error ? error.message : 'Unknown error'
      console.error('Database connection failed:', error)
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Test API route working',
      hasDbUrl,
      dbUrlStart,
      dbStatus,
      dbError,
      fishingSpotCount,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Test API failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 