/**
 * E2E Test Database Seeder
 *
 * Creates deterministic test data for E2E tests.
 * Run with: npx ts-node prisma/seed-e2e.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_USERS = {
  client: {
    clerkId: 'e2e_client_user',
    email: 'e2e-client@test.local',
    firstName: 'Elena',
    lastName: 'Client',
    role: 'CLIENT' as const,
    onboarded: true,
  },
  consultant: {
    clerkId: 'e2e_consultant_user',
    email: 'e2e-consultant@test.local',
    firstName: 'Marco',
    lastName: 'Consultant',
    role: 'CONSULTANT' as const,
    onboarded: true,
  },
  both: {
    clerkId: 'e2e_both_user',
    email: 'e2e-both@test.local',
    firstName: 'Sofia',
    lastName: 'Both',
    role: 'BOTH' as const,
    onboarded: true,
  },
  newUser: {
    clerkId: 'e2e_new_user',
    email: 'e2e-new@test.local',
    firstName: 'New',
    lastName: 'User',
    role: 'CLIENT' as const,
    onboarded: false,
  },
};

async function cleanE2EData() {
  console.log('Cleaning existing E2E test data...');

  // Delete in order respecting foreign keys
  const e2eUserIds = Object.values(TEST_USERS).map((u) => u.clerkId);

  // Get user IDs from clerkIds
  const users = await prisma.user.findMany({
    where: { clerkId: { in: e2eUserIds } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);

  if (userIds.length > 0) {
    // Delete related data
    await prisma.message.deleteMany({ where: { authorId: { in: userIds } } });
    await prisma.note.deleteMany({ where: { authorId: { in: userIds } } });
    await prisma.review.deleteMany({
      where: { OR: [{ authorId: { in: userIds } }, { targetId: { in: userIds } }] },
    });
    // Delete entitlements BEFORE payments (FK constraint)
    await prisma.entitlement.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.payment.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.pattern.deleteMany({ where: { creatorId: { in: userIds } } });
    await prisma.prompt.deleteMany({ where: { creatorId: { in: userIds } } });
    await prisma.stackTemplate.deleteMany({ where: { creatorId: { in: userIds } } });

    // Delete engagements via bookings
    const bookings = await prisma.booking.findMany({
      where: { OR: [{ clientId: { in: userIds } }, { consultantId: { in: userIds } }] },
      select: { id: true },
    });
    const bookingIds = bookings.map((b) => b.id);
    if (bookingIds.length > 0) {
      await prisma.engagement.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    }

    // Delete offers via consultant profiles
    const profiles = await prisma.consultantProfile.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    });
    const profileIds = profiles.map((p) => p.id);
    if (profileIds.length > 0) {
      await prisma.offer.deleteMany({ where: { consultantId: { in: profileIds } } });
    }

    // Delete requests
    await prisma.request.deleteMany({ where: { creatorId: { in: userIds } } });

    // Delete profiles
    await prisma.consultantProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.clientProfile.deleteMany({ where: { userId: { in: userIds } } });

    // Delete users
    await prisma.user.deleteMany({ where: { clerkId: { in: e2eUserIds } } });
  }

  console.log('E2E data cleaned.');
}

async function seedE2EData() {
  console.log('Seeding E2E test data...');

  // Ensure skill tags exist (use existing seed)
  const requiredSkills = [
    'Full-Stack Development',
    'Large Language Models',
    'Cloud Architecture',
    'Machine Learning',
    'RAG Systems',
    'API Design',
    'Kubernetes',
    'DevOps',
    'Security Architecture',
  ];

  for (const skillName of requiredSkills) {
    const slug = skillName.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
    const existing = await prisma.skillTag.findFirst({
      where: { OR: [{ slug }, { name: skillName }] },
    });
    if (!existing) {
      await prisma.skillTag.create({
        data: { name: skillName, slug, category: 'Engineering' },
      });
    }
  }

  // Create CLIENT user
  const clientUser = await prisma.user.create({
    data: {
      ...TEST_USERS.client,
      clientProfile: {
        create: {
          companyName: 'Acme Corp',
          companyRole: 'CTO',
        },
      },
    },
  });
  console.log(`Created CLIENT user: ${clientUser.email}`);

  // Create CONSULTANT user with profile and skills
  const consultantUser = await prisma.user.create({
    data: {
      ...TEST_USERS.consultant,
      consultantProfile: {
        create: {
          headline: 'Senior Full-Stack Developer',
          bio: 'Expert in React, Node.js, and cloud architecture.',
          hourlyRate: 15000,
          languages: ['English', 'Italian'],
          timezone: 'Europe/Rome',
          yearsExperience: 10,
          isAvailable: true,
          consentDirectory: true,
          consentHiveMind: true,
        },
      },
    },
    include: { consultantProfile: true },
  });

  // Add skills to consultant
  const consultantSkills = ['Full-Stack Development', 'Large Language Models', 'Cloud Architecture'];
  for (const skillName of consultantSkills) {
    const skillTag = await prisma.skillTag.findFirst({ where: { name: skillName } });
    if (skillTag && consultantUser.consultantProfile) {
      await prisma.consultantSkill.create({
        data: {
          profileId: consultantUser.consultantProfile.id,
          skillTagId: skillTag.id,
          level: 'EXPERT',
        },
      });
    }
  }
  console.log(`Created CONSULTANT user: ${consultantUser.email}`);

  // Create BOTH user with both profiles
  const bothUser = await prisma.user.create({
    data: {
      ...TEST_USERS.both,
      clientProfile: {
        create: {
          companyName: 'StartupXYZ',
          companyRole: 'Founder',
        },
      },
      consultantProfile: {
        create: {
          headline: 'AI/ML Consultant',
          bio: 'Helping startups integrate AI into their products.',
          hourlyRate: 20000,
          languages: ['English', 'Spanish'],
          timezone: 'Europe/Madrid',
          yearsExperience: 8,
          isAvailable: true,
          consentDirectory: true,
          consentHiveMind: true,
        },
      },
    },
    include: { consultantProfile: true },
  });

  // Add skills to both user's consultant profile
  const bothSkills = ['Machine Learning', 'RAG Systems', 'API Design'];
  for (const skillName of bothSkills) {
    const skillTag = await prisma.skillTag.findFirst({ where: { name: skillName } });
    if (skillTag && bothUser.consultantProfile) {
      await prisma.consultantSkill.create({
        data: {
          profileId: bothUser.consultantProfile.id,
          skillTagId: skillTag.id,
          level: 'ADVANCED',
        },
      });
    }
  }
  console.log(`Created BOTH user: ${bothUser.email}`);

  // Create new user (not onboarded)
  const newUser = await prisma.user.create({
    data: TEST_USERS.newUser,
  });
  console.log(`Created NEW user: ${newUser.email}`);

  // Create open request (by client)
  const ragSkill = await prisma.skillTag.findFirst({ where: { name: 'RAG Systems' } });
  const llmSkill = await prisma.skillTag.findFirst({ where: { name: 'Large Language Models' } });

  const openRequest = await prisma.request.create({
    data: {
      creatorId: clientUser.id,
      title: 'Help with RAG Pipeline Implementation',
      rawDescription: 'I need help setting up a RAG pipeline for my document Q&A system.',
      refinedSummary: 'Implement a Retrieval-Augmented Generation pipeline for document-based Q&A.',
      constraints: 'Must use open-source tools. Budget limited.',
      desiredOutcome: 'Working RAG system with >80% accuracy on test queries.',
      suggestedDuration: 60,
      urgency: 'NORMAL',
      status: 'PUBLISHED',
      isPublic: true,
      skills: {
        create: [
          ...(ragSkill ? [{ skillTagId: ragSkill.id }] : []),
          ...(llmSkill ? [{ skillTagId: llmSkill.id }] : []),
        ],
      },
    },
  });
  console.log(`Created open request: ${openRequest.title}`);

  // Create request with offers (MATCHING status) - by BOTH user
  const k8sSkill = await prisma.skillTag.findFirst({ where: { name: 'Kubernetes' } });
  const devopsSkill = await prisma.skillTag.findFirst({ where: { name: 'DevOps' } });

  const matchingRequest = await prisma.request.create({
    data: {
      creatorId: bothUser.id,
      title: 'Kubernetes Deployment Strategy',
      rawDescription: 'Need help designing blue-green deployment for our K8s cluster.',
      refinedSummary: 'Design and implement blue-green deployment strategy for Kubernetes.',
      constraints: 'Using ArgoCD for GitOps.',
      desiredOutcome: 'Zero-downtime deployments with easy rollback.',
      suggestedDuration: 90,
      urgency: 'HIGH',
      status: 'MATCHING',
      isPublic: true,
      skills: {
        create: [
          ...(k8sSkill ? [{ skillTagId: k8sSkill.id }] : []),
          ...(devopsSkill ? [{ skillTagId: devopsSkill.id }] : []),
        ],
      },
    },
  });

  // Create offer on matching request from consultant
  if (consultantUser.consultantProfile) {
    await prisma.offer.create({
      data: {
        requestId: matchingRequest.id,
        consultantId: consultantUser.consultantProfile.id,
        message: 'I have 5+ years experience with Kubernetes and ArgoCD. Would love to help!',
        proposedRate: 18000,
        status: 'PENDING',
      },
    });
    console.log('Created pending offer on matching request');
  }

  // Get product SKU for 60 min session
  let productSKU = await prisma.productSKU.findFirst({ where: { duration: 60 } });
  if (!productSKU) {
    productSKU = await prisma.productSKU.create({
      data: {
        name: '60-Minute Consult',
        description: 'Standard consultation',
        duration: 60,
        priceAmount: 14000,
        currency: 'EUR',
        type: 'SESSION',
      },
    });
  }

  // Create a booked request with engagement (paid)
  const bookedRequest = await prisma.request.create({
    data: {
      creatorId: clientUser.id,
      title: 'API Security Audit',
      rawDescription: 'Review our REST API for security vulnerabilities.',
      refinedSummary: 'Comprehensive security audit of REST API endpoints.',
      suggestedDuration: 60,
      urgency: 'URGENT',
      status: 'BOOKED',
      isPublic: false,
    },
  });

  // Create booking and engagement
  const booking = await prisma.booking.create({
    data: {
      requestId: bookedRequest.id,
      clientId: clientUser.id,
      consultantId: consultantUser.id,
      duration: 60,
      status: 'CONFIRMED',
      videoLink: 'https://meet.google.com/e2e-test-meeting',
    },
  });

  // Create payment (succeeded)
  const payment = await prisma.payment.create({
    data: {
      userId: clientUser.id,
      bookingId: booking.id,
      productSKUId: productSKU.id,
      amount: 14000,
      currency: 'EUR',
      status: 'SUCCEEDED',
      stripeSessionId: 'e2e_stripe_session_paid',
    },
  });

  // Create entitlement
  await prisma.entitlement.create({
    data: {
      userId: clientUser.id,
      paymentId: payment.id,
      type: 'SESSION_60',
      status: 'ACTIVE',
    },
  });

  // Create engagement with messages, notes, checklist
  const engagement = await prisma.engagement.create({
    data: {
      bookingId: booking.id,
      status: 'ACTIVE',
      videoLink: 'https://meet.google.com/e2e-test-meeting',
      messages: {
        create: [
          { authorId: clientUser.id, content: 'Hello! Looking forward to our session.' },
          { authorId: consultantUser.id, content: 'Hi! Me too. Let me share my screen.' },
        ],
      },
      notes: {
        create: [
          {
            authorId: consultantUser.id,
            title: 'Key Points',
            content: 'Discussed architecture options.',
            isPrivate: false,
          },
        ],
      },
      checklistItems: {
        create: [
          { text: 'Review current implementation', isCompleted: true, order: 1 },
          { text: 'Identify bottlenecks', isCompleted: false, order: 2 },
          { text: 'Propose solutions', isCompleted: false, order: 3 },
        ],
      },
    },
  });
  console.log(`Created engagement: ${engagement.id}`);

  // Create unpaid engagement
  const unpaidBooking = await prisma.booking.create({
    data: {
      clientId: bothUser.id,
      consultantId: consultantUser.id,
      duration: 30,
      status: 'PENDING',
    },
  });

  await prisma.payment.create({
    data: {
      userId: bothUser.id,
      bookingId: unpaidBooking.id,
      productSKUId: productSKU.id,
      amount: 7500,
      currency: 'EUR',
      status: 'PENDING',
      stripeSessionId: 'e2e_stripe_session_unpaid',
    },
  });

  await prisma.engagement.create({
    data: {
      bookingId: unpaidBooking.id,
      status: 'ACTIVE',
    },
  });
  console.log('Created unpaid engagement');

  // Create Hive Mind items
  await prisma.pattern.create({
    data: {
      creatorId: consultantUser.id,
      title: 'E2E Test Pattern',
      description: 'A pattern created for E2E testing.',
      content: '## Problem\nTest pattern content.\n\n## Solution\nTest solution.',
      category: 'Testing',
      tags: ['E2E', 'Testing', 'Automation'],
      status: 'APPROVED',
    },
  });

  await prisma.prompt.create({
    data: {
      creatorId: consultantUser.id,
      title: 'E2E Test Prompt',
      description: 'A prompt for testing.',
      content: 'You are a test assistant. Help with testing.',
      useCase: 'Testing',
      tags: ['Testing', 'QA'],
      status: 'APPROVED',
    },
  });

  await prisma.stackTemplate.create({
    data: {
      creatorId: consultantUser.id,
      title: 'E2E Test Stack',
      description: 'A stack template for testing.',
      content: '## Overview\nTest stack for E2E testing.',
      category: 'Testing',
      tags: ['Testing', 'E2E'],
      uiTech: 'Playwright',
      backendTech: 'Next.js',
      databaseTech: 'PostgreSQL',
      releaseTech: 'Vercel',
      status: 'APPROVED',
    },
  });

  // Create pending pattern (for testing status filtering)
  await prisma.pattern.create({
    data: {
      creatorId: bothUser.id,
      title: 'Pending Pattern for Review',
      description: 'This pattern is pending review.',
      content: '## Pending\nThis content is under review.',
      category: 'Testing',
      tags: ['Pending'],
      status: 'PENDING_REVIEW',
    },
  });
  console.log('Created Hive Mind items');

  console.log('E2E test data seeded successfully!');
}

async function main() {
  try {
    await cleanE2EData();
    await seedE2EData();
  } catch (error) {
    console.error('Error seeding E2E data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
