/**
 * Hive Mind Page Objects
 */

import { Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class HiveMindPage extends BasePage {
  readonly path = '/app/hive';

  // Type filter buttons
  get allFilter(): Locator {
    return this.page.locator('button:has-text("All")');
  }

  get patternsFilter(): Locator {
    return this.page.locator('button:has-text("Patterns")');
  }

  get promptsFilter(): Locator {
    return this.page.locator('button:has-text("Prompts")');
  }

  get stacksFilter(): Locator {
    return this.page.locator('button:has-text("Stacks")');
  }

  // Contribute button
  get contributeButton(): Locator {
    return this.page.locator('a:has-text("Contribute"), button:has-text("Contribute")');
  }

  // Content cards/rows
  get contentRows(): Locator {
    return this.page.locator('[class*="row"], [class*="card"]').filter({ has: this.page.locator('text=/Pattern|Prompt|Stack/') });
  }

  get patternItems(): Locator {
    return this.page.locator('[class*="row"]:has-text("Pattern")');
  }

  get promptItems(): Locator {
    return this.page.locator('[class*="row"]:has-text("Prompt")');
  }

  get stackItems(): Locator {
    return this.page.locator('[class*="row"]:has-text("Stack")');
  }

  // Status badges
  get approvedBadges(): Locator {
    return this.page.locator('[class*="badge"]:has-text("APPROVED")');
  }

  get pendingBadges(): Locator {
    return this.page.locator('[class*="badge"]:has-text("PENDING")');
  }

  // Empty state
  get emptyState(): Locator {
    return this.page.locator('text=No contributions yet');
  }

  // Navigation
  async navigate() {
    await this.goto(this.path);
  }

  // Assertions
  async expectHeading() {
    await expect(this.heading).toContainText('Hive Mind');
  }

  async expectFilterButtonsVisible() {
    await expect(this.allFilter).toBeVisible();
    await expect(this.patternsFilter).toBeVisible();
    await expect(this.promptsFilter).toBeVisible();
    await expect(this.stacksFilter).toBeVisible();
  }

  async expectContributeButtonVisible() {
    await expect(this.contributeButton).toBeVisible();
  }

  async expectContentOrEmptyState() {
    await this.waitForLoad();
    const hasContent = await this.contentRows.count() > 0;
    const hasEmpty = await this.isVisible('text=No contributions yet');
    expect(hasContent || hasEmpty).toBe(true);
  }

  // Actions
  async filterByPatterns() {
    await this.patternsFilter.click();
    await this.waitForLoad();
  }

  async filterByPrompts() {
    await this.promptsFilter.click();
    await this.waitForLoad();
  }

  async filterByStacks() {
    await this.stacksFilter.click();
    await this.waitForLoad();
  }

  async showAll() {
    await this.allFilter.click();
    await this.waitForLoad();
  }

  async clickContribute() {
    await this.contributeButton.click();
    await this.waitForUrl(/\/app\/hive\/contribute/);
  }

  async clickFirstItem() {
    await this.contentRows.first().click();
  }
}

export class HiveContributePage extends BasePage {
  readonly path = '/app/hive/contribute';

  // Common fields
  get titleInput(): Locator {
    return this.page.locator('input#title, input[name="title"]');
  }

  get descriptionInput(): Locator {
    return this.page.locator('textarea#description, textarea[name="description"]');
  }

  get contentInput(): Locator {
    return this.page.locator('textarea#content, textarea[name="content"]');
  }

  get tagsInput(): Locator {
    return this.page.locator('input#tags, input[name="tags"]');
  }

  // Tabs for contribution type
  get patternTab(): Locator {
    return this.page.locator('button[role="tab"]:has-text("Pattern")');
  }

  get promptTab(): Locator {
    return this.page.locator('button[role="tab"]:has-text("Prompt")');
  }

  get stackTab(): Locator {
    return this.page.locator('button[role="tab"]:has-text("Stack")');
  }

  // Stack-specific fields
  get uiTechInput(): Locator {
    return this.page.locator('input#uiTech, input[name="uiTech"]');
  }

  get backendTechInput(): Locator {
    return this.page.locator('input#backendTech, input[name="backendTech"]');
  }

  get databaseTechInput(): Locator {
    return this.page.locator('input#databaseTech, input[name="databaseTech"]');
  }

  get releaseTechInput(): Locator {
    return this.page.locator('input#releaseTech, input[name="releaseTech"]');
  }

  // Prompt-specific
  get promptTextInput(): Locator {
    return this.page.locator('textarea#promptText, textarea[name="promptText"]');
  }

  // Submit
  get submitButton(): Locator {
    return this.page.locator('button:has-text("Submit"), button[type="submit"]');
  }

  get aiRefineButton(): Locator {
    return this.page.locator('button:has-text("AI"), button:has-text("Refine")');
  }

  // Navigation
  async navigate() {
    await this.goto(this.path);
  }

  // Assertions
  async expectHeading() {
    await expect(this.page.locator('text=Contribute')).toBeVisible();
  }

  async expectTabsVisible() {
    await expect(this.patternTab).toBeVisible();
    await expect(this.promptTab).toBeVisible();
    await expect(this.stackTab).toBeVisible();
  }

  // Actions
  async selectPatternTab() {
    await this.patternTab.click();
    await this.expectTabActive('Pattern');
  }

  async selectPromptTab() {
    await this.promptTab.click();
    await this.expectTabActive('Prompt');
  }

  async selectStackTab() {
    await this.stackTab.click();
    await this.expectTabActive('Stack');
  }

  async fillCommonFields(data: { title: string; description?: string; content: string; tags?: string[] }) {
    await this.titleInput.fill(data.title);
    if (data.description) await this.descriptionInput.fill(data.description);
    await this.contentInput.fill(data.content);
    if (data.tags) {
      for (const tag of data.tags) {
        await this.tagsInput.fill(tag);
        await this.tagsInput.press('Enter');
      }
    }
  }

  async fillStackFields(data: { uiTech?: string; backendTech?: string; databaseTech?: string; releaseTech?: string }) {
    if (data.uiTech) await this.uiTechInput.fill(data.uiTech);
    if (data.backendTech) await this.backendTechInput.fill(data.backendTech);
    if (data.databaseTech) await this.databaseTechInput.fill(data.databaseTech);
    if (data.releaseTech) await this.releaseTechInput.fill(data.releaseTech);
  }

  async submit() {
    await this.submitButton.click();
    await this.waitForUrl(/\/app\/hive$/);
  }

  async submitPattern(data: { title: string; description?: string; content: string; tags?: string[] }) {
    await this.selectPatternTab();
    await this.fillCommonFields(data);
    await this.submit();
  }

  async submitPrompt(data: { title: string; description?: string; content: string; tags?: string[] }) {
    await this.selectPromptTab();
    await this.fillCommonFields(data);
    await this.submit();
  }

  async submitStack(data: {
    title: string;
    description?: string;
    content: string;
    tags?: string[];
    uiTech?: string;
    backendTech?: string;
    databaseTech?: string;
    releaseTech?: string;
  }) {
    await this.selectStackTab();
    await this.fillCommonFields(data);
    await this.fillStackFields(data);
    await this.submit();
  }
}
