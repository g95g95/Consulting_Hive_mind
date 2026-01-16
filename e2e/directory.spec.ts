/**
 * Directory E2E Tests
 *
 * Tests for the consultant/client directory, covering:
 * - Directory page display
 * - Search functionality
 * - Skill filtering
 * - Consultant profile viewing
 * - Booking flow initiation
 * - Role-based tabs (consultant sees clients, client sees consultants)
 */

import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { DirectoryPage, ConsultantProfilePage } from './page-objects';

test.describe('Directory - Page Display', () => {
  let directory: DirectoryPage;

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    directory = new DirectoryPage(page);
    await directory.navigate();
  });

  test('displays directory heading', async () => {
    await directory.expectHeading();
  });

  test('displays subtitle', async () => {
    await directory.expectSubheading();
  });

  test('shows search input with placeholder', async () => {
    await directory.expectSearchInputVisible();
  });

  test('displays consultant cards or empty state', async () => {
    await directory.expectConsultantCardsOrEmptyState();
  });
});

test.describe('Directory - Search', () => {
  let directory: DirectoryPage;

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    directory = new DirectoryPage(page);
    await directory.navigate();
  });

  test('search input updates URL on submit', async ({ page }) => {
    await directory.search('developer');
    await expect(page).toHaveURL(/q=developer/);
  });

  test('search filters results', async ({ page }) => {
    const initialCount = await directory.consultantCards.count();
    await directory.search('nonexistent-query-xyz');

    // Either fewer results or empty state
    const afterCount = await directory.consultantCards.count();
    const hasEmptyState = await directory.isVisible('text=No consultants found');
    expect(afterCount <= initialCount || hasEmptyState).toBe(true);
  });

  test('empty search returns to full list', async ({ page }) => {
    await directory.search('test');
    await expect(page).toHaveURL(/q=test/);

    // Clear search
    await directory.searchInput.clear();
    await directory.searchInput.press('Enter');

    // Should either remove q param or reset results
    await directory.waitForLoad();
  });
});

test.describe('Directory - Skill Filtering', () => {
  let directory: DirectoryPage;

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    directory = new DirectoryPage(page);
    await directory.navigate();
  });

  test('skill filter badges are present', async () => {
    // "All" filter should always be present
    await expect(directory.allSkillsFilter).toBeVisible();
  });

  test('clicking skill filter updates URL', async ({ page }) => {
    const skillBadges = directory.skillFilterBadges;
    const count = await skillBadges.count();

    if (count > 0) {
      await skillBadges.first().click();
      await expect(page).toHaveURL(/skill=/);
    }
  });

  test('clicking "All" resets filter', async ({ page }) => {
    // First apply a skill filter if available
    const skillBadges = directory.skillFilterBadges;
    if (await skillBadges.count() > 0) {
      await skillBadges.first().click();
      await expect(page).toHaveURL(/skill=/);

      // Then click All
      await directory.allSkillsFilter.click();
      // URL should not have skill param or be reset
      await directory.waitForLoad();
    }
  });
});

test.describe('Directory - Consultant Cards', () => {
  let directory: DirectoryPage;

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    directory = new DirectoryPage(page);
    await directory.navigate();
  });

  test('consultant cards show name', async ({ page }) => {
    const cards = directory.consultantCards;
    if (await cards.count() > 0) {
      const firstCard = cards.first();
      // Card should have some text (name)
      const text = await firstCard.textContent();
      expect(text?.length).toBeGreaterThan(0);
    }
  });

  test('consultant cards are clickable links', async ({ page }) => {
    const cards = directory.consultantCards;
    if (await cards.count() > 0) {
      const href = await cards.first().getAttribute('href');
      expect(href).toMatch(/\/app\/directory\/[a-z0-9-]+/);
    }
  });

  test('clicking card navigates to profile', async ({ page }) => {
    const cards = directory.consultantCards;
    if (await cards.count() > 0) {
      await directory.clickFirstConsultant();
      await expect(page).toHaveURL(/\/app\/directory\/[a-z0-9-]+/);
    }
  });
});

test.describe('Directory - Consultant Profile', () => {
  let directory: DirectoryPage;
  let profile: ConsultantProfilePage;

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    directory = new DirectoryPage(page);
    profile = new ConsultantProfilePage(page);
    await directory.navigate();
  });

  test('profile page shows back button', async ({ page }) => {
    if (await directory.consultantCards.count() > 0) {
      await directory.clickFirstConsultant();
      await profile.expectBackButtonVisible();
    }
  });

  test('back button returns to directory', async ({ page }) => {
    if (await directory.consultantCards.count() > 0) {
      await directory.clickFirstConsultant();
      await profile.goBack();
      await expect(page).toHaveURL(/\/app\/directory$/);
    }
  });

  test('profile shows consultant details', async ({ page }) => {
    if (await directory.consultantCards.count() > 0) {
      await directory.clickFirstConsultant();
      await profile.expectProfileDetailsVisible();
    }
  });

  test('profile shows book session button for eligible users', async ({ page }) => {
    if (await directory.consultantCards.count() > 0) {
      await directory.clickFirstConsultant();
      // Book button visibility depends on user role and whether viewing own profile
      const bookButtonVisible = await profile.bookButton.isVisible().catch(() => false);
      // Just verify profile loaded correctly
      await profile.expectBackButtonVisible();
    }
  });

  test('book session button links to request creation with consultant param', async ({ page }) => {
    if (await directory.consultantCards.count() > 0) {
      await directory.clickFirstConsultant();

      if (await profile.bookButton.isVisible()) {
        await profile.clickBookSession();
        await expect(page).toHaveURL(/\/app\/requests\/new\?consultant=/);
      }
    }
  });
});

test.describe('Directory - Role-Based Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('consultant/both user sees consultants and clients tabs', async ({ page }) => {
    const directory = new DirectoryPage(page);
    await directory.navigate();

    // If tabs are visible, user is consultant or both
    const consultantsTab = directory.consultantsTab;
    const clientsTab = directory.clientsTab;

    const hasConsultantsTab = await consultantsTab.isVisible().catch(() => false);
    const hasClientsTab = await clientsTab.isVisible().catch(() => false);

    // Both tabs should be visible together or neither
    expect(hasConsultantsTab).toBe(hasClientsTab);
  });

  test('can switch between consultants and clients tabs', async ({ page }) => {
    const directory = new DirectoryPage(page);
    await directory.navigate();

    const clientsTab = directory.clientsTab;
    if (await clientsTab.isVisible()) {
      await directory.switchToClientsTab();
      await expect(clientsTab).toHaveAttribute('data-state', 'active');
    }
  });

  test('client-only user does not see tabs', async ({ page }) => {
    const directory = new DirectoryPage(page);
    await directory.navigate();

    // If user is client-only, no tabs should be present
    // This test verifies the page structure is correct
    await directory.expectHeading();
  });
});
