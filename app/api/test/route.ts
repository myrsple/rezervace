import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test 1: Basic response
    console.log('Test API route called')
    
    // Test 2: Environment variables
    const hasDbUrl = !!process.env.DATABASE_URL
    const dbUrlStart = process.env.DATABASE_URL?.substring(0, 30) || 'undefined'
    
    console.log('DATABASE_URL exists:', hasDbUrl)
    console.log('DATABASE_URL start:', dbUrlStart)
    
    return NextResponse.json({
      status: 'success',
      message: 'Test API route working',
      hasDbUrl,
      dbUrlStart,
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