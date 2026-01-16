import { Page } from '@playwright/test';
import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';

export async function setupAuth(page: Page) {
  await setupClerkTestingToken({ page });
}

export { clerkSetup };
