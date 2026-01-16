/**
 * Engagement Page Objects
 */

import { Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class EngagementsListPage extends BasePage {
  readonly path = '/app/engagements';

  // Engagement cards
  get engagementCards(): Locator {
    return this.page.locator('a[href^="/app/engagements/"]');
  }

  // Empty state
  get emptyState(): Locator {
    return this.page.locator('text=No engagements yet');
  }

  // Navigation
  async navigate() {
    await this.goto(this.path);
  }

  // Assertions
  async expectHeading() {
    await expect(this.heading).toContainText('Engagements');
  }

  async expectSubheading() {
    await expect(this.page.locator('text=Your consultation workspaces')).toBeVisible();
  }

  async expectEngagementsOrEmptyState() {
    await this.waitForLoad();
    const hasCards = await this.engagementCards.count() > 0;
    const hasEmpty = await this.isVisible('text=No engagements yet');
    expect(hasCards || hasEmpty).toBe(true);
  }

  // Actions
  async clickFirstEngagement() {
    await this.engagementCards.first().click();
    await this.waitForUrl(/\/app\/engagements\/[a-z0-9-]+/);
  }
}

export class EngagementWorkspacePage extends BasePage {
  // Navigation
  get backButton(): Locator {
    return this.page.locator('text=Back to Engagements');
  }

  // Participant info
  get participantName(): Locator {
    return this.page.locator('text=/with .+/');
  }

  get participantAvatar(): Locator {
    return this.page.locator('[class*="avatar"]').first();
  }

  // Status
  get statusBadge(): Locator {
    return this.page.locator('[class*="badge"]:has-text("ACTIVE"), [class*="badge"]:has-text("COMPLETED"), [class*="badge"]:has-text("TRANSFERRED")');
  }

  get paymentBadge(): Locator {
    return this.page.locator('text=Paid, text=Unpaid');
  }

  // Payment lock message
  get paymentLockMessage(): Locator {
    return this.page.locator('text=Waiting for client to complete payment');
  }

  // Tabs
  get chatTab(): Locator {
    return this.page.locator('button[role="tab"]:has-text("Chat")');
  }

  get notesTab(): Locator {
    return this.page.locator('button[role="tab"]:has-text("Notes")');
  }

  get checklistTab(): Locator {
    return this.page.locator('button[role="tab"]:has-text("Checklist")');
  }

  get transferPackTab(): Locator {
    return this.page.locator('button[role="tab"]:has-text("Transfer Pack")');
  }

  // Chat
  get messageInput(): Locator {
    return this.page.locator('textarea[placeholder*="message"], input[placeholder*="message"]');
  }

  get sendButton(): Locator {
    return this.page.locator('button:has-text("Send")');
  }

  get messages(): Locator {
    return this.page.locator('[class*="message"]');
  }

  // Notes
  get noteInput(): Locator {
    return this.page.locator('textarea[placeholder*="note"], input[placeholder*="note"]');
  }

  get addNoteButton(): Locator {
    return this.page.locator('button:has-text("Add Note"), button:has-text("Add")');
  }

  get notes(): Locator {
    return this.page.locator('[class*="note"]');
  }

  // Checklist
  get checklistItems(): Locator {
    return this.page.locator('[class*="checklist"] input[type="checkbox"]');
  }

  get addChecklistItemInput(): Locator {
    return this.page.locator('input[placeholder*="item"], input[placeholder*="task"]');
  }

  // Transfer Pack
  get generateTransferPackButton(): Locator {
    return this.page.locator('button:has-text("Generate Transfer Pack")');
  }

  get transferPackContent(): Locator {
    return this.page.locator('[class*="transfer-pack"]');
  }

  // Video call
  get videoCallSection(): Locator {
    return this.page.locator('text=Video Call');
  }

  get videoLink(): Locator {
    return this.page.locator('a[href*="meet"], a[href*="zoom"], input[placeholder*="video"]');
  }

  // Assertions
  async expectBackButtonVisible() {
    await expect(this.backButton).toBeVisible();
  }

  async expectTabsVisible() {
    await expect(this.chatTab).toBeVisible();
    await expect(this.notesTab).toBeVisible();
    await expect(this.checklistTab).toBeVisible();
    await expect(this.transferPackTab).toBeVisible();
  }

  async expectChatTabActive() {
    await expect(this.chatTab).toHaveAttribute('data-state', 'active');
  }

  async expectVideoCallSectionVisible() {
    await expect(this.videoCallSection).toBeVisible();
  }

  async expectPaymentStatusVisible() {
    const paidVisible = await this.isVisible('text=Paid');
    const unpaidVisible = await this.isVisible('text=Unpaid');
    expect(paidVisible || unpaidVisible).toBe(true);
  }

  async expectMessageInputVisible() {
    await expect(this.messageInput).toBeVisible();
  }

  async expectMessageInputHidden() {
    // Either hidden or payment lock message shows
    const inputVisible = await this.isVisible('textarea[placeholder*="message"], input[placeholder*="message"]', 1000);
    const lockVisible = await this.isVisible('text=Waiting for client to complete payment', 1000);
    expect(!inputVisible || lockVisible).toBe(true);
  }

  // Actions
  async goBack() {
    await this.backButton.click();
    await this.waitForUrl(/\/app\/engagements$/);
  }

  async selectChatTab() {
    await this.chatTab.click();
    await this.expectTabActive('Chat');
  }

  async selectNotesTab() {
    await this.notesTab.click();
    await this.expectTabActive('Notes');
  }

  async selectChecklistTab() {
    await this.checklistTab.click();
    await this.expectTabActive('Checklist');
  }

  async selectTransferPackTab() {
    await this.transferPackTab.click();
    await this.expectTabActive('Transfer Pack');
  }

  async sendMessage(content: string) {
    await this.messageInput.fill(content);
    await this.sendButton.click();
    await this.waitForLoad();
  }

  async addNote(content: string) {
    await this.noteInput.fill(content);
    await this.addNoteButton.click();
    await this.waitForLoad();
  }
}
