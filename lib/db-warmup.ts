import { prisma } from './prisma'

let isWarmedUp = false

export async function warmupDatabase() {
  if (isWarmedUp) {
    return true
  }

  try {
    // Simple query to establish connection
    await prisma.$queryRaw`SELECT 1`
    isWarmedUp = true
    console.log('Database connection warmed up successfully')
    return true
  } catch (error) {
    console.error('Database warmup failed:', error)
    // Don't throw - let the actual query handle the error
    return false
  }
}

export async function withDatabaseWarmup<T>(operation: () => Promise<T>): Promise<T> {
  // Try to warm up first (non-blocking)
  if (!isWarmedUp) {
    await warmupDatabase()
  }
  
  // Execute the actual operation
  return operation()
} 