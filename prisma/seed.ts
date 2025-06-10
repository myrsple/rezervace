import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Update existing fishing spots or create new ones
  const fishingSpots = []
  
  for (let i = 1; i <= 15; i++) {
    const spot = await prisma.fishingSpot.upsert({
      where: { number: i },
      update: {
        name: `Lovné místo ${i}`,
        description: `Prémiová lovná lokalita s výborným přístupem k vodě. Místo ${i} nabízí skvělé příležitosti jak pro začátečníky, tak pro zkušené rybáře.`,
        isActive: true,
      },
      create: {
        number: i,
        name: `Lovné místo ${i}`,
        description: `Prémiová lovná lokalita s výborným přístupem k vodě. Místo ${i} nabízí skvělé příležitosti jak pro začátečníky, tak pro zkušené rybáře.`,
        isActive: true,
      },
    })
    fishingSpots.push(spot)
  }
  
  console.log(`Aktualizováno ${fishingSpots.length} lovných míst`)
  
  // Create or update admin user (you should change this password in production)
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@rybarstvo.cz' },
    update: {
      name: 'Administrátor lovných míst',
    },
    create: {
      email: 'admin@rybarstvo.cz',
      password: 'admin123', // In production, this should be hashed
      name: 'Administrátor lovných míst',
    },
  })
  
  console.log('Aktualizován admin uživatel:', admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 