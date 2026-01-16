/**
 * Dashboard Page Object
 */

import { Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  readonly path = '/app';

  // Stats cards
  get statsCards(): Locator {
    return this.page.locator('[class*="card"]').filter({ hasText: /My Requests|Engagements|Available|Your Role/ });
  }

  get myRequestsCard(): Locator {
    return this.page.locator('text=My Requests').locator('..');
  }

  get engagementsCard(): Locator {
    return this.page.locator('text=Engagements').locator('..');
  }

  get roleCard(): Locator {
    return this.page.locator('text=Your Role').locator('..');
  }

  // Quick actions
  get newRequestButton(): Locator {
    return this.page.locator('a:has-text("Create new request"), button:has-text("Create new request")');
  }

  get browseDirectoryButton(): Locator {
    return this.page.locator('a:has-text("Browse"), a:has-text("directory")');
  }

  get exploreHiveButton(): Locator {
    return this.page.locator('a:has-text("Explore Hive Mind")');
  }

  // Recent engagements
  get recentEngagements(): Locator {
    return this.page.locator('a[href^="/app/engagements/"]');
  }

  // Navigation
  async navigate() {
    await this.goto(this.path);
  }

  // Assertions
  async expectHeading() {
    await expect(this.heading).toContainText('Dashboard');
  }

  async expectStatsCardsVisible() {
    await expect(this.myRequestsCard).toBeVisible();
    await expect(this.engagementsCard).toBeVisible();
    await expect(this.roleCard).toBeVisible();
  }

  async expectRoleBadge(role: 'CLIENT' | 'CONSULTANT' | 'BOTH') {
    await expect(this.roleCard).toContainText(role);
  }

  async expectNewRequestButtonVisible() {
    await expect(this.newRequestButton).toBeVisible();
  }

  async expectNewRequestButtonHidden() {
    await expect(this.newRequestButton).not.toBeVisible();
  }

  // Actions
  async clickNewRequest() {
    await this.newRequestButton.click();
    await this.waitForUrl(/\/app\/requests\/new/);
  }

  async clickBrowseDirectory() {
    await this.browseDirectoryButton.click();
    await this.waitForUrl(/\/app\/directory/);
  }

  async clickFirstEngagement() {
    await this.recentEngagements.first().click();
    await this.waitForUrl(/\/app\/engagements\/[a-z0-9-]+/);
  }
}
