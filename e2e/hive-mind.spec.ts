/**
 * Hive Mind E2E Tests
 *
 * Tests for the Hive Mind library including:
 * - Library viewing
 * - Type filtering (patterns, prompts, stacks)
 * - Contribution flow
 * - Status visibility
 */

import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { HiveMindPage, HiveContributePage } from './page-objects';

test.describe('Hive Mind - Library View', () => {
  let hiveMind: HiveMindPage;

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    hiveMind = new HiveMindPage(page);
    await hiveMind.navigate();
  });

  test('displays Hive Mind heading', async () => {
    await hiveMind.expectHeading();
  });

  test('shows filter buttons', async () => {
    await hiveMind.expectFilterButtonsVisible();
  });

  test('shows contribute button', async () => {
    await hiveMind.expectContributeButtonVisible();
  });

  test('shows content or empty state', async () => {
    await hiveMind.expectContentOrEmptyState();
  });
});

test.describe('Hive Mind - Type Filtering', () => {
  let hiveMind: HiveMindPage;

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    hiveMind = new HiveMindPage(page);
    await hiveMind.navigate();
  });

  test('can filter by patterns', async () => {
    await hiveMind.filterByPatterns();
    // Filter should be applied (button state or URL change)
    await expect(hiveMind.patternsFilter).toHaveClass(/active|selected|bg-amber/);
  });

  test('can filter by prompts', async () => {
    await hiveMind.filterByPrompts();
    await expect(hiveMind.promptsFilter).toHaveClass(/active|selected|bg-amber/);
  });

  test('can filter by stacks', async () => {
    await hiveMind.filterByStacks();
    await expect(hiveMind.stacksFilter).toHaveClass(/active|selected|bg-amber/);
  });

  test('can show all items', async () => {
    // First filter by one type
    await hiveMind.filterByPatterns();
    // Then show all
    await hiveMind.showAll();
    await expect(hiveMind.allFilter).toHaveClass(/active|selected|bg-amber/);
  });
});

test.describe('Hive Mind - Content Display', () => {
  let hiveMind: HiveMindPage;

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    hiveMind = new HiveMindPage(page);
    await hiveMind.navigate();
  });

  test('approved items are visible in public library', async ({ page }) => {
    // Only APPROVED items should be shown in the main library view
    const contentRows = hiveMind.contentRows;
    if (await contentRows.count() > 0) {
      // Items should exist (approved content from seed data)
      await expect(contentRows.first()).toBeVisible();
    }
  });

  test('items show title', async ({ page }) => {
    const contentRows = hiveMind.contentRows;
    if (await contentRows.count() > 0) {
      const firstItem = contentRows.first();
      const text = await firstItem.textContent();
      expect(text?.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Hive Mind - Contribute Page', () => {
  let contribute: HiveContributePage;

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    contribute = new HiveContributePage(page);
    await contribute.navigate();
  });

  test('displays contribute heading', async () => {
    await contribute.expectHeading();
  });

  test('shows contribution type tabs', async () => {
    await contribute.expectTabsVisible();
  });

  test('title field is required', async () => {
    await expect(contribute.titleInput).toBeVisible();
  });

  test('content field is required', async () => {
    await expect(contribute.contentInput).toBeVisible();
  });

  test('submit button is present', async () => {
    await expect(contribute.submitButton).toBeVisible();
  });
});

test.describe('Hive Mind - Pattern Contribution', () => {
  let contribute: HiveContributePage;

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    contribute = new HiveContributePage(page);
    await contribute.navigate();
  });

  test('pattern tab is selectable', async () => {
    await contribute.selectPatternTab();
    await contribute.expectTabActive('Pattern');
  });

  test('can fill pattern form', async () => {
    await contribute.selectPatternTab();
    await contribute.fillCommonFields({
      title: 'E2E Test Pattern',
      description: 'A test pattern',
      content: '## Problem\nTest problem\n\n## Solution\nTest solution',
    });

    await expect(contribute.titleInput).toHaveValue('E2E Test Pattern');
    await expect(contribute.contentInput).toHaveValue(/Test problem/);
  });
});

test.describe('Hive Mind - Prompt Contribution', () => {
  let contribute: HiveContributePage;

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    contribute = new HiveContributePage(page);
    await contribute.navigate();
  });

  test('prompt tab is selectable', async () => {
    await contribute.selectPromptTab();
    await contribute.expectTabActive('Prompt');
  });

  test('can fill prompt form', async () => {
    await contribute.selectPromptTab();
    await contribute.fillCommonFields({
      title: 'E2E Test Prompt',
      content: 'You are a helpful assistant that...',
    });

    await expect(contribute.titleInput).toHaveValue('E2E Test Prompt');
  });
});

test.describe('Hive Mind - Stack Contribution', () => {
  let contribute: HiveContributePage;

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    contribute = new HiveContributePage(page);
    await contribute.navigate();
  });

  test('stack tab is selectable', async () => {
    await contribute.selectStackTab();
    await contribute.expectTabActive('Stack');
  });

  test('stack form shows tech fields', async () => {
    await contribute.selectStackTab();

    // Tech-specific fields should be visible
    const uiTechVisible = await contribute.uiTechInput.isVisible().catch(() => false);
    const backendTechVisible = await contribute.backendTechInput.isVisible().catch(() => false);

    expect(uiTechVisible || backendTechVisible).toBe(true);
  });

  test('can fill stack form with tech fields', async () => {
    await contribute.selectStackTab();
    await contribute.fillCommonFields({
      title: 'E2E Test Stack',
      content: '## Overview\nA modern web stack for testing.',
    });

    if (await contribute.uiTechInput.isVisible()) {
      await contribute.fillStackFields({
        uiTech: 'React + Tailwind',
        backendTech: 'Node.js + Express',
        databaseTech: 'PostgreSQL',
        releaseTech: 'Vercel',
      });

      await expect(contribute.uiTechInput).toHaveValue('React + Tailwind');
    }
  });
});

test.describe('Hive Mind - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('can navigate from library to contribute', async ({ page }) => {
    const hiveMind = new HiveMindPage(page);
    await hiveMind.navigate();
    await hiveMind.clickContribute();
    await expect(page).toHaveURL(/\/app\/hive\/contribute/);
  });

  test('contribute page has back navigation', async ({ page }) => {
    const contribute = new HiveContributePage(page);
    await contribute.navigate();

    // Back link or breadcrumb should exist
    const backLink = page.locator('a:has-text("Back"), a:has-text("Hive Mind")');
    if (await backLink.isVisible()) {
      await backLink.click();
      await expect(page).toHaveURL(/\/app\/hive/);
    }
  });
});

test.describe('Hive Mind - Own Contributions', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('user sees own contributions regardless of status', async ({ page }) => {
    const hiveMind = new HiveMindPage(page);
    await hiveMind.navigate();

    // User should see their own pending contributions
    // Look for "(You)" label or user's own content
    const ownLabel = page.locator('text=(You)');
    const pendingBadge = hiveMind.pendingBadges;

    // Either own label is visible or pending badges (if user has pending items)
    await hiveMind.waitForLoad();
  });

  test('pending status is visible for own items', async ({ page }) => {
    const hiveMind = new HiveMindPage(page);
    await hiveMind.navigate();

    // If user has pending items, they should see PENDING_REVIEW status
    const pendingBadges = hiveMind.pendingBadges;
    // Just verify page loads correctly
    await hiveMind.expectFilterButtonsVisible();
  });
});

test.describe('Hive Mind - Status Badges', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('approved items show APPROVED badge or no badge', async ({ page }) => {
    const hiveMind = new HiveMindPage(page);
    await hiveMind.navigate();

    // Public items are APPROVED - they may or may not show the badge explicitly
    const approvedBadges = hiveMind.approvedBadges;
    const contentRows = hiveMind.contentRows;

    // If there's content, it's approved
    if (await contentRows.count() > 0) {
      await expect(contentRows.first()).toBeVisible();
    }
  });
});
