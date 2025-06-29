import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // --- Add regular fishing spots (1-15) ---
  for (let number = 1; number <= 15; number++) {
    const spotData = {
      number,
      name: `Lovné místo ${number}`,
      description: `Standardní lovné místo číslo ${number}.`,
      isActive: true,
    };
    await prisma.fishingSpot.upsert({
      where: { number },
      update: spotData,
      create: spotData,
    });
  }
  console.log('Standardní lovná místa 1-15 byla přidána nebo aktualizována.');

  // --- Only add/update the VIP spot ---
  const vipNumber = 99;
  const vipData = {
    name: 'Lovné místo VIP',
    description: 'Exkluzivní VIP lovné místo s nejlepším přístupem a soukromím.',
    isActive: true,
  };
  const existingVip = await prisma.fishingSpot.findUnique({ where: { number: vipNumber } });
  if (existingVip) {
    await prisma.fishingSpot.update({
      where: { number: vipNumber },
      data: vipData,
    });
    console.log('VIP lovné místo bylo aktualizováno.');
  } else {
    await prisma.fishingSpot.create({
      data: { number: vipNumber, ...vipData },
    });
    console.log('VIP lovné místo bylo přidáno.');
  }

  // --- Admin user logic remains unchanged ---
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