/**
 * Directory Page Object
 */

import { Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class DirectoryPage extends BasePage {
  readonly path = '/app/directory';

  // Search
  get searchInput(): Locator {
    return this.page.locator('input[name="q"]');
  }

  // Tabs (for CONSULTANT/BOTH users)
  get consultantsTab(): Locator {
    return this.page.locator('button[role="tab"]:has-text("Available Consultants")');
  }

  get clientsTab(): Locator {
    return this.page.locator('button[role="tab"]:has-text("Clients")');
  }

  // Skill filter badges
  get allSkillsFilter(): Locator {
    return this.page.locator('a[href="/app/directory"]:has-text("All")');
  }

  get skillFilterBadges(): Locator {
    return this.page.locator('a[href*="skill="]');
  }

  // Consultant cards
  get consultantCards(): Locator {
    return this.page.locator('a[href^="/app/directory/"]');
  }

  // Empty state
  get emptyState(): Locator {
    return this.page.locator('text=No consultants found');
  }

  // Navigation
  async navigate() {
    await this.goto(this.path);
  }

  // Assertions
  async expectHeading() {
    await expect(this.heading).toContainText('Directory');
  }

  async expectSubheading() {
    await expect(this.page.locator('text=Find and connect with experts')).toBeVisible();
  }

  async expectSearchInputVisible() {
    await expect(this.searchInput).toBeVisible();
    await expect(this.searchInput).toHaveAttribute('placeholder', /Search/);
  }

  async expectConsultantCardsOrEmptyState() {
    await this.waitForLoad();
    const hasCards = await this.consultantCards.count() > 0;
    const hasEmpty = await this.isVisible('text=No consultants found');
    expect(hasCards || hasEmpty).toBe(true);
  }

  async expectTabsVisible() {
    await expect(this.consultantsTab).toBeVisible();
    await expect(this.clientsTab).toBeVisible();
  }

  async expectNoTabs() {
    await expect(this.consultantsTab).not.toBeVisible();
  }

  // Actions
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForLoad();
  }

  async clickSkillFilter(index: number) {
    await this.skillFilterBadges.nth(index).click();
    await this.waitForLoad();
  }

  async clickFirstConsultant() {
    await this.consultantCards.first().click();
    await this.waitForUrl(/\/app\/directory\/[a-z0-9-]+/);
  }

  async switchToClientsTab() {
    await this.clientsTab.click();
    await this.expectTabActive('Clients');
  }
}

export class ConsultantProfilePage extends BasePage {
  // Profile elements
  get backButton(): Locator {
    return this.page.locator('text=Back to Directory');
  }

  get headline(): Locator {
    return this.page.locator('h1, h2').first();
  }

  get bio(): Locator {
    return this.page.locator('[class*="bio"], p').filter({ hasText: /Expert|experience|years/ });
  }

  get bookButton(): Locator {
    return this.page.locator('a:has-text("Book Session"), button:has-text("Book Session")');
  }

  get skillBadges(): Locator {
    return this.page.locator('[class*="badge"]');
  }

  get ratingDisplay(): Locator {
    return this.page.locator('text=/[0-5]\\.[0-9]|No reviews/');
  }

  // Assertions
  async expectBackButtonVisible() {
    await expect(this.backButton).toBeVisible();
  }

  async expectProfileDetailsVisible() {
    await expect(this.headline).toBeVisible();
  }

  async expectBookButtonVisible() {
    await expect(this.bookButton).toBeVisible();
  }

  // Actions
  async goBack() {
    await this.backButton.click();
    await this.waitForUrl(/\/app\/directory$/);
  }

  async clickBookSession() {
    await this.bookButton.click();
    await this.waitForUrl(/\/app\/requests\/new\?consultant=/);
  }
}
