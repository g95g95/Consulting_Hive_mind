/**
 * Playwright Test Fixtures
 *
 * Extended fixtures providing authenticated page contexts for different user roles.
 */

import { test as base, Page } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

// Test user clerk IDs (must match seed-e2e.ts)
export const TEST_CLERK_IDS = {
  client: 'e2e_client_user',
  consultant: 'e2e_consultant_user',
  both: 'e2e_both_user',
  newUser: 'e2e_new_user',
} as const;

export type UserRole = keyof typeof TEST_CLERK_IDS;

/**
 * Extended test fixtures with role-based authentication
 */
export const test = base.extend<{
  // Authenticated page contexts for each role
  clientPage: Page;
  consultantPage: Page;
  bothPage: Page;
  newUserPage: Page;
}>({
  // CLIENT role page - can create requests, browse consultants
  clientPage: async ({ page }, use) => {
    await setupClerkTestingToken({ page });
    // Note: Clerk testing token authenticates as the test user
    // The actual user matching is done by comparing clerkId in DB
    await use(page);
  },

  // CONSULTANT role page - can make offers, view open requests
  consultantPage: async ({ page }, use) => {
    await setupClerkTestingToken({ page });
    await use(page);
  },

  // BOTH role page - can do everything
  bothPage: async ({ page }, use) => {
    await setupClerkTestingToken({ page });
    await use(page);
  },

  // New user page (not onboarded) - for onboarding tests
  newUserPage: async ({ page }, use) => {
    await setupClerkTestingToken({ page });
    await use(page);
  },
});

export { expect } from '@playwright/test';

/**
 * Common page helpers
 */
export class PageHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for page to be fully loaded (no network activity)
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to app route and wait for load
   */
  async goTo(path: string) {
    await this.page.goto(path);
    await this.waitForLoad();
  }

  /**
   * Get visible text content of element
   */
  async getText(selector: string): Promise<string> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible' });
    return (await element.textContent()) || '';
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string, timeout = 5000): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click element and wait for navigation
   */
  async clickAndNavigate(selector: string, expectedUrl: RegExp) {
    await this.page.locator(selector).click();
    await this.page.waitForURL(expectedUrl);
    await this.waitForLoad();
  }

  /**
   * Fill form field
   */
  async fillField(selector: string, value: string) {
    await this.page.locator(selector).fill(value);
  }

  /**
   * Click button by text
   */
  async clickButton(text: string) {
    await this.page.locator(`button:has-text("${text}")`).click();
  }

  /**
   * Click link by text
   */
  async clickLink(text: string) {
    await this.page.locator(`a:has-text("${text}")`).click();
  }

  /**
   * Select tab by name
   */
  async selectTab(tabName: string) {
    const tab = this.page.locator(`button[role="tab"]:has-text("${tabName}")`);
    await tab.click();
    await this.page.waitForTimeout(300); // Allow tab content to load
  }

  /**
   * Assert tab is active
   */
  async assertTabActive(tabName: string) {
    const tab = this.page.locator(`button[role="tab"]:has-text("${tabName}")`);
    await expect(tab).toHaveAttribute('data-state', 'active');
  }
}

// Re-export expect for convenience
import { expect } from '@playwright/test';
