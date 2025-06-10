import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
  __internal: {
    engine: {
      connect_timeout: 10000 // 10 seconds
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 

// Middleware to handle retries
prisma.$use(async (params, next) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await next(params)
    } catch (error) {
      if (attempt < 2) {
        console.warn(`Prisma query failed on attempt ${attempt + 1}, retrying...`, error)
        await new Promise(res => setTimeout(res, 1000))
      } else {
        throw error
      }
    }
  }
}) 