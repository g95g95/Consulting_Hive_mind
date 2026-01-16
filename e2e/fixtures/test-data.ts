/**
 * E2E Test Data Definitions
 *
 * Deterministic test users and data for automated E2E tests.
 * These users are seeded before tests run and cleaned up after.
 */

export const TEST_USERS = {
  // Client-only user - can create requests, browse consultants
  client: {
    clerkId: 'e2e_client_user',
    email: 'e2e-client@test.local',
    firstName: 'Elena',
    lastName: 'Client',
    role: 'CLIENT' as const,
    onboarded: true,
    clientProfile: {
      companyName: 'Acme Corp',
      companyRole: 'CTO',
    },
  },

  // Consultant-only user - can make offers, view open requests
  consultant: {
    clerkId: 'e2e_consultant_user',
    email: 'e2e-consultant@test.local',
    firstName: 'Marco',
    lastName: 'Consultant',
    role: 'CONSULTANT' as const,
    onboarded: true,
    consultantProfile: {
      headline: 'Senior Full-Stack Developer',
      bio: 'Expert in React, Node.js, and cloud architecture with 10 years experience.',
      hourlyRate: 15000, // €150
      languages: ['English', 'Italian'],
      timezone: 'Europe/Rome',
      yearsExperience: 10,
      isAvailable: true,
      consentDirectory: true,
      consentHiveMind: true,
      skills: ['Full-Stack Development', 'Large Language Models', 'Cloud Architecture'],
    },
  },

  // Both roles user - can do everything
  both: {
    clerkId: 'e2e_both_user',
    email: 'e2e-both@test.local',
    firstName: 'Sofia',
    lastName: 'Both',
    role: 'BOTH' as const,
    onboarded: true,
    clientProfile: {
      companyName: 'StartupXYZ',
      companyRole: 'Founder',
    },
    consultantProfile: {
      headline: 'AI/ML Consultant',
      bio: 'Helping startups integrate AI into their products.',
      hourlyRate: 20000, // €200
      languages: ['English', 'Spanish'],
      timezone: 'Europe/Madrid',
      yearsExperience: 8,
      isAvailable: true,
      consentDirectory: true,
      consentHiveMind: true,
      skills: ['Machine Learning', 'RAG Systems', 'API Design'],
    },
  },

  // New user for onboarding tests (not onboarded yet)
  newUser: {
    clerkId: 'e2e_new_user',
    email: 'e2e-new@test.local',
    firstName: 'New',
    lastName: 'User',
    role: 'CLIENT' as const,
    onboarded: false,
  },
} as const;

export const TEST_REQUESTS = {
  // Published request available for offers
  openRequest: {
    title: 'Help with RAG Pipeline Implementation',
    rawDescription: 'I need help setting up a RAG pipeline for my document Q&A system. I have PDFs and want semantic search.',
    refinedSummary: 'Implement a Retrieval-Augmented Generation pipeline for document-based Q&A with semantic search capabilities.',
    constraints: 'Must use open-source tools. Budget limited.',
    desiredOutcome: 'Working RAG system with >80% accuracy on test queries.',
    suggestedDuration: 60,
    urgency: 'NORMAL' as const,
    status: 'PUBLISHED' as const,
    isPublic: true,
    skills: ['RAG Systems', 'Large Language Models'],
  },

  // Request with offers (MATCHING status)
  requestWithOffers: {
    title: 'Kubernetes Deployment Strategy',
    rawDescription: 'Need help designing blue-green deployment for our K8s cluster.',
    refinedSummary: 'Design and implement blue-green deployment strategy for Kubernetes using GitOps.',
    constraints: 'Using ArgoCD for GitOps.',
    desiredOutcome: 'Zero-downtime deployments with easy rollback.',
    suggestedDuration: 90,
    urgency: 'HIGH' as const,
    status: 'MATCHING' as const,
    isPublic: true,
    skills: ['Kubernetes', 'DevOps'],
  },

  // Booked request
  bookedRequest: {
    title: 'API Security Audit',
    rawDescription: 'Review our REST API for security vulnerabilities.',
    refinedSummary: 'Comprehensive security audit of REST API endpoints.',
    suggestedDuration: 60,
    urgency: 'URGENT' as const,
    status: 'BOOKED' as const,
    isPublic: false,
    skills: ['Security Architecture', 'API Design'],
  },
} as const;

export const TEST_OFFERS = {
  // Pending offer on requestWithOffers
  pendingOffer: {
    message: 'I have 5+ years of experience with Kubernetes and ArgoCD. Would love to help!',
    proposedRate: 18000, // €180/hr
    status: 'PENDING' as const,
  },
} as const;

export const TEST_ENGAGEMENTS = {
  // Active engagement (paid)
  activeEngagement: {
    status: 'ACTIVE' as const,
    duration: 60,
    videoLink: 'https://meet.google.com/test-meeting',
    isPaid: true,
    messages: [
      { content: 'Hello! Looking forward to our session.', isClient: true },
      { content: 'Hi! Me too. Let me share my screen.', isClient: false },
    ],
    notes: [
      { title: 'Key Points', content: 'Discussed architecture options.', isPrivate: false },
    ],
    checklist: [
      { text: 'Review current implementation', isCompleted: true },
      { text: 'Identify bottlenecks', isCompleted: false },
      { text: 'Propose solutions', isCompleted: false },
    ],
  },

  // Unpaid engagement (workspace locked)
  unpaidEngagement: {
    status: 'ACTIVE' as const,
    duration: 30,
    isPaid: false,
  },
} as const;

export const TEST_HIVE_ITEMS = {
  pattern: {
    title: 'E2E Test Pattern',
    description: 'A pattern created for E2E testing.',
    content: '## Problem\nTest pattern content.\n\n## Solution\nTest solution.',
    category: 'Testing',
    tags: ['E2E', 'Testing', 'Automation'],
    status: 'APPROVED' as const,
  },
  prompt: {
    title: 'E2E Test Prompt',
    description: 'A prompt for testing.',
    content: 'You are a test assistant. Help with testing.',
    useCase: 'Testing',
    tags: ['Testing', 'QA'],
    status: 'APPROVED' as const,
  },
  stack: {
    title: 'E2E Test Stack',
    description: 'A stack template for testing.',
    content: '## Overview\nTest stack for E2E testing.',
    category: 'Testing',
    tags: ['Testing', 'E2E'],
    uiTech: 'Playwright',
    backendTech: 'Next.js',
    databaseTech: 'PostgreSQL',
    releaseTech: 'Vercel',
    status: 'APPROVED' as const,
  },
  pendingPattern: {
    title: 'Pending Pattern for Review',
    description: 'This pattern is pending review.',
    content: '## Pending\nThis content is under review.',
    category: 'Testing',
    tags: ['Pending'],
    status: 'PENDING_REVIEW' as const,
  },
} as const;

export type TestUser = typeof TEST_USERS[keyof typeof TEST_USERS];
export type TestRequest = typeof TEST_REQUESTS[keyof typeof TEST_REQUESTS];
