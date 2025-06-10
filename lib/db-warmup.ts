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
    // Try the operation first
    return await operation()
  } catch (error) {
    console.error('Database operation failed, attempting warmup:', error)
    
    try {
      // Attempt to warm up the database
      await prisma.$connect()
      
      // Try the operation again
      const result = await operation()
      if (result === undefined || result === null) {
        throw new Error('Operation returned undefined or null')
      }
      return result
    } catch (warmupError) {
      console.error('Database warmup failed:', warmupError)
      // Return a safe default value based on the expected type
      if (Array.isArray(await operation())) {
        return [] as T
      }
      throw warmupError
    }
  }
} 