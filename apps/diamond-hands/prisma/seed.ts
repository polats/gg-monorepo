import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with initial beneficiaries...')

  // Create initial beneficiary organizations
  const beneficiaries = [
    {
      name: 'International Committee of the Red Cross',
      description: 'The International Committee of the Red Cross (ICRC) is a humanitarian organization that provides protection and assistance to victims of armed conflict and other situations of violence.',
      walletAddress: '0x1234567890123456789012345678901234567890', // Placeholder - would be real Red Cross wallet
      websiteUrl: 'https://www.icrc.org',
      isVerified: true,
    },
    {
      name: 'Oxfam International',
      description: 'Oxfam is a British founded confederation of 21 independent charitable organizations focusing on the alleviation of global poverty.',
      walletAddress: '0x2345678901234567890123456789012345678901', // Placeholder - would be real Oxfam wallet
      websiteUrl: 'https://www.oxfam.org',
      isVerified: true,
    },
    {
      name: 'UNICEF',
      description: 'The United Nations International Children\'s Emergency Fund (UNICEF) is a United Nations agency responsible for providing humanitarian aid to children worldwide.',
      walletAddress: '0x3456789012345678901234567890123456789012', // Placeholder - would be real UNICEF wallet
      websiteUrl: 'https://www.unicef.org',
      isVerified: true,
    },
  ]

  for (const beneficiaryData of beneficiaries) {
    const existingBeneficiary = await prisma.beneficiary.findUnique({
      where: { walletAddress: beneficiaryData.walletAddress },
    })

    if (!existingBeneficiary) {
      const beneficiary = await prisma.beneficiary.create({
        data: beneficiaryData,
      })
      console.log(`✅ Created beneficiary: ${beneficiary.name}`)
    } else {
      console.log(`⏭️  Beneficiary already exists: ${existingBeneficiary.name}`)
    }
  }

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })