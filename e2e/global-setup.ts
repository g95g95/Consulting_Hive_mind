import { clerkSetup } from '@clerk/testing/playwright';
import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';

async function globalSetup(config: FullConfig) {
  console.log('🔧 E2E Global Setup starting...');

  // Seed the E2E test database with deterministic test data
  console.log('📦 Seeding E2E test data...');
  try {
    execSync('npx tsx prisma/seed-e2e.ts', {
      stdio: 'inherit',
      env: { ...process.env },
    });
    console.log('✅ E2E test data seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed E2E test data:', error);
    throw error;
  }

  // Initialize Clerk for testing mode
  // This enables bypass auth via setupClerkTestingToken in tests
  console.log('🔐 Setting up Clerk testing mode...');
  await clerkSetup({
    debug: true,
  });

  console.log('✅ E2E Global Setup complete');
}

export default globalSetup;
