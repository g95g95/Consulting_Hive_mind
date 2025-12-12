import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Seed Skill Tags
  const skillTags = [
    // AI/ML
    { name: 'Large Language Models', slug: 'llms', category: 'AI/ML' },
    { name: 'Machine Learning', slug: 'machine-learning', category: 'AI/ML' },
    { name: 'MLOps', slug: 'mlops', category: 'AI/ML' },
    { name: 'Computer Vision', slug: 'computer-vision', category: 'AI/ML' },
    { name: 'NLP', slug: 'nlp', category: 'AI/ML' },
    { name: 'RAG Systems', slug: 'rag', category: 'AI/ML' },
    { name: 'AI Agents', slug: 'ai-agents', category: 'AI/ML' },
    { name: 'Prompt Engineering', slug: 'prompt-engineering', category: 'AI/ML' },

    // Data
    { name: 'Data Engineering', slug: 'data-engineering', category: 'Data' },
    { name: 'Data Science', slug: 'data-science', category: 'Data' },
    { name: 'Analytics', slug: 'analytics', category: 'Data' },
    { name: 'Data Visualization', slug: 'data-viz', category: 'Data' },
    { name: 'ETL/ELT', slug: 'etl', category: 'Data' },

    // Infrastructure
    { name: 'Cloud Architecture', slug: 'cloud-architecture', category: 'Infrastructure' },
    { name: 'AWS', slug: 'aws', category: 'Infrastructure' },
    { name: 'GCP', slug: 'gcp', category: 'Infrastructure' },
    { name: 'Azure', slug: 'azure', category: 'Infrastructure' },
    { name: 'Kubernetes', slug: 'kubernetes', category: 'Infrastructure' },
    { name: 'DevOps', slug: 'devops', category: 'Infrastructure' },
    { name: 'Platform Engineering', slug: 'platform-engineering', category: 'Infrastructure' },

    // Security
    { name: 'Security Architecture', slug: 'security-architecture', category: 'Security' },
    { name: 'Penetration Testing', slug: 'pentesting', category: 'Security' },
    { name: 'Compliance', slug: 'compliance', category: 'Security' },
    { name: 'Identity Management', slug: 'iam', category: 'Security' },

    // Software Engineering
    { name: 'Backend Development', slug: 'backend', category: 'Engineering' },
    { name: 'Frontend Development', slug: 'frontend', category: 'Engineering' },
    { name: 'Full-Stack Development', slug: 'fullstack', category: 'Engineering' },
    { name: 'API Design', slug: 'api-design', category: 'Engineering' },
    { name: 'System Design', slug: 'system-design', category: 'Engineering' },
    { name: 'Code Review', slug: 'code-review', category: 'Engineering' },

    // Product & Architecture
    { name: 'Product Architecture', slug: 'product-architecture', category: 'Product' },
    { name: 'Technical Strategy', slug: 'tech-strategy', category: 'Product' },
    { name: 'Technical Due Diligence', slug: 'tech-due-diligence', category: 'Product' },
    { name: 'Roadmap Planning', slug: 'roadmap', category: 'Product' },

    // Enterprise
    { name: 'ERP Integration', slug: 'erp-integration', category: 'Enterprise' },
    { name: 'SAP', slug: 'sap', category: 'Enterprise' },
    { name: 'Salesforce', slug: 'salesforce', category: 'Enterprise' },
    { name: 'Legacy Modernization', slug: 'legacy-modernization', category: 'Enterprise' },
  ]

  for (const tag of skillTags) {
    await prisma.skillTag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    })
  }
  console.log(`Seeded ${skillTags.length} skill tags`)

  // Seed Product SKUs
  const productSKUs = [
    {
      name: '30-Minute Consult',
      description: 'Quick consultation for focused questions',
      duration: 30,
      priceAmount: 7500, // 75 EUR
      currency: 'EUR',
      type: 'SESSION' as const,
    },
    {
      name: '60-Minute Consult',
      description: 'Standard consultation for in-depth discussions',
      duration: 60,
      priceAmount: 14000, // 140 EUR
      currency: 'EUR',
      type: 'SESSION' as const,
    },
    {
      name: '90-Minute Consult',
      description: 'Extended consultation for complex topics',
      duration: 90,
      priceAmount: 19500, // 195 EUR
      currency: 'EUR',
      type: 'SESSION' as const,
    },
    {
      name: 'Architecture Audit',
      description: 'Comprehensive review of your system architecture',
      duration: 240, // 4 hours
      priceAmount: 50000, // 500 EUR
      currency: 'EUR',
      type: 'AUDIT' as const,
    },
    {
      name: 'Security Audit',
      description: 'Security assessment and recommendations',
      duration: 480, // 8 hours
      priceAmount: 95000, // 950 EUR
      currency: 'EUR',
      type: 'AUDIT' as const,
    },
  ]

  for (const sku of productSKUs) {
    await prisma.productSKU.upsert({
      where: {
        id: sku.name.toLowerCase().replace(/\s+/g, '-')
      },
      update: {},
      create: {
        id: sku.name.toLowerCase().replace(/\s+/g, '-'),
        ...sku,
      },
    })
  }
  console.log(`Seeded ${productSKUs.length} product SKUs`)

  // Create test user for development (user/user)
  const testUser = await prisma.user.upsert({
    where: { clerkId: 'test_user_clerk_id' },
    update: {},
    create: {
      clerkId: 'test_user_clerk_id',
      email: 'user@test.local',
      firstName: 'Test',
      lastName: 'User',
      role: 'BOTH',
      onboarded: true,
    },
  })
  console.log(`Created test user: ${testUser.email}`)

  // Create consultant profile for test user
  const consultantProfile = await prisma.consultantProfile.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      headline: 'Full-Stack Developer & AI Enthusiast',
      bio: 'Experienced developer with expertise in modern web technologies and AI integration.',
      hourlyRate: 15000, // 150 EUR
      languages: ['English', 'Italian'],
      timezone: 'Europe/Rome',
      isAvailable: true,
      consentDirectory: true,
      consentHiveMind: true,
    },
  })

  // Add skills to test consultant
  const testSkills = ['Full-Stack Development', 'Large Language Models', 'API Design', 'Cloud Architecture']
  for (const skillName of testSkills) {
    const skillTag = await prisma.skillTag.findFirst({ where: { name: skillName } })
    if (skillTag) {
      await prisma.consultantSkill.upsert({
        where: {
          profileId_skillTagId: {
            profileId: consultantProfile.id,
            skillTagId: skillTag.id,
          },
        },
        update: {},
        create: {
          profileId: consultantProfile.id,
          skillTagId: skillTag.id,
        },
      })
    }
  }
  console.log(`Added ${testSkills.length} skills to test consultant`)

  // Create client profile for test user
  await prisma.clientProfile.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      companyName: 'Test Company',
      companyRole: 'CTO',
    },
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
