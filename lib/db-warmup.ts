import { prisma } from './prisma'

let isWarmedUp = false
let warmupPromise: Promise<boolean> | null = null

export async function warmupDatabase() {
  // If already warming up, wait for that attempt
  if (warmupPromise) {
    return warmupPromise
  }

  // If already warmed up, return immediately
  if (isWarmedUp) {
    return true
  }

  // Start new warmup attempt
  warmupPromise = (async () => {
    try {
      // Retry logic
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          // Simple query to establish connection
          await prisma.$queryRaw`SELECT 1`
          isWarmedUp = true
          console.log('Database connection warmed up successfully')
          return true
        } catch (error) {
          console.error(`Database warmup attempt ${attempt + 1} failed:`, error)
          if (attempt < 2) {
            // Wait before retrying, increasing delay with each attempt
            await new Promise(res => setTimeout(res, 1000 * (attempt + 1)))
          }
        }
      }
      return false
    } catch (error) {
      console.error('Database warmup failed:', error)
      return false
    } finally {
      warmupPromise = null
    }
  })()

  return warmupPromise
}

export async function withDatabaseWarmup<T>(operation: () => Promise<T>): Promise<T> {
  try {
    // Try to warm up first
    if (!isWarmedUp) {
      await warmupDatabase()
    }
    
    // Execute the actual operation with retries
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await operation()
      } catch (error) {
        if (attempt < 2) {
          console.warn(`Operation failed on attempt ${attempt + 1}, retrying...`, error)
          // Reset warmup status on connection errors
          if (error instanceof Error && error.message.includes('connection')) {
            isWarmedUp = false
            await warmupDatabase()
          }
          await new Promise(res => setTimeout(res, 1000 * (attempt + 1)))
        } else {
          throw error
        }
      }
    }
    throw new Error('All retry attempts failed')
  } catch (error) {
    console.error('Operation failed after all retries:', error)
    throw error
  }
} 