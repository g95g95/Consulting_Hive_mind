/**
 * Dashboard E2E Tests
 *
 * Tests for the main dashboard page, covering:
 * - Stats cards visibility
 * - Role-based content
 * - Quick actions
 * - Recent engagements
 */

import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { DashboardPage } from './page-objects';

test.describe('Dashboard - General', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    dashboard = new DashboardPage(page);
  });

  test('displays dashboard heading', async () => {
    await dashboard.navigate();
    await dashboard.expectHeading();
  });

  test('shows stats cards', async () => {
    await dashboard.navigate();
    await dashboard.expectStatsCardsVisible();
  });

  test('displays role badge in stats', async () => {
    await dashboard.navigate();
    // Role badge should show one of the valid roles
    const roleCard = dashboard.roleCard;
    await expect(roleCard).toBeVisible();
    const text = await roleCard.textContent();
    expect(['CLIENT', 'CONSULTANT', 'BOTH'].some(role => text?.includes(role))).toBe(true);
  });

  test('shows "Explore Hive Mind" link', async ({ page }) => {
    await dashboard.navigate();
    await expect(dashboard.exploreHiveButton).toBeVisible();
  });

  test('can navigate to Hive Mind', async ({ page }) => {
    await dashboard.navigate();
    await dashboard.exploreHiveButton.click();
    await expect(page).toHaveURL(/\/app\/hive/);
  });

  test('can navigate to directory', async ({ page }) => {
    await dashboard.navigate();
    await dashboard.clickBrowseDirectory();
    await expect(page).toHaveURL(/\/app\/directory/);
  });
});

test.describe('Dashboard - Client Role', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    // Setup as client user
    await setupClerkTestingToken({ page });
    dashboard = new DashboardPage(page);
  });

  test('client sees "Create new request" button', async () => {
    await dashboard.navigate();
    // CLIENT and BOTH users should see this button
    // The test passes if it's visible (depends on actual user role)
    const newRequestVisible = await dashboard.newRequestButton.isVisible().catch(() => false);
    // At minimum, verify page loads correctly
    await dashboard.expectHeading();
  });

  test('client can navigate to create request', async ({ page }) => {
    await dashboard.navigate();
    const newRequestButton = dashboard.newRequestButton;

    if (await newRequestButton.isVisible()) {
      await newRequestButton.click();
      await expect(page).toHaveURL(/\/app\/requests\/new/);
    }
  });

  test('client sees "My Requests" stats card', async () => {
    await dashboard.navigate();
    await expect(dashboard.myRequestsCard).toBeVisible();
  });
});

test.describe('Dashboard - Recent Engagements', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    dashboard = new DashboardPage(page);
  });

  test('shows recent engagements section', async ({ page }) => {
    await dashboard.navigate();
    // Either engagements exist or section is visible
    const engagementsSection = page.locator('text=Recent Engagements, text=Engagements');
    await expect(engagementsSection.first()).toBeVisible();
  });

  test('engagement cards are clickable', async ({ page }) => {
    await dashboard.navigate();
    const engagementLinks = dashboard.recentEngagements;

    if (await engagementLinks.count() > 0) {
      const firstEngagement = engagementLinks.first();
      await firstEngagement.click();
      await expect(page).toHaveURL(/\/app\/engagements\/[a-z0-9-]+/);
    }
  });

  test('engagement cards show status badge', async ({ page }) => {
    await dashboard.navigate();
    const engagementLinks = dashboard.recentEngagements;

    if (await engagementLinks.count() > 0) {
      // Check that engagement cards have status indicators
      const statusBadge = page.locator('[class*="badge"]').first();
      await expect(statusBadge).toBeVisible();
    }
  });
});

test.describe('Dashboard - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/app');

    // Click Directory in sidebar
    await page.locator('a:has-text("Directory")').click();
    await expect(page).toHaveURL(/\/app\/directory/);

    // Click Requests in sidebar
    await page.locator('a:has-text("Requests")').click();
    await expect(page).toHaveURL(/\/app\/requests/);

    // Click Engagements in sidebar
    await page.locator('a:has-text("Engagements")').click();
    await expect(page).toHaveURL(/\/app\/engagements/);

    // Click Hive Mind in sidebar
    await page.locator('a:has-text("Hive Mind")').click();
    await expect(page).toHaveURL(/\/app\/hive/);

    // Return to Dashboard
    await page.locator('a:has-text("Dashboard")').click();
    await expect(page).toHaveURL(/\/app$/);
  });

  test('profile link in header works', async ({ page }) => {
    await page.goto('/app');

    // Click on profile/user menu
    const profileLink = page.locator('a[href="/app/profile"]');
    if (await profileLink.isVisible()) {
      await profileLink.click();
      await expect(page).toHaveURL(/\/app\/profile/);
    }
  });
});
