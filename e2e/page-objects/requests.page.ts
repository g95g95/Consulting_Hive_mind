/**
 * Requests Page Objects
 */

import { Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class RequestsListPage extends BasePage {
  readonly path = '/app/requests';

  // Tabs
  get myRequestsTab(): Locator {
    return this.page.locator('button[role="tab"]:has-text("My Requests")');
  }

  get openRequestsTab(): Locator {
    return this.page.locator('button[role="tab"]:has-text("Open Requests")');
  }

  get myOffersTab(): Locator {
    return this.page.locator('button[role="tab"]:has-text("My Offers")');
  }

  // Buttons
  get newRequestButton(): Locator {
    return this.page.locator('a:has-text("New Request"), button:has-text("New Request")');
  }

  // Request cards
  get requestCards(): Locator {
    return this.page.locator('a[href^="/app/requests/"]');
  }

  // Navigation
  async navigate() {
    await this.goto(this.path);
  }

  // Assertions
  async expectHeading() {
    await expect(this.heading).toContainText('Requests');
  }

  async expectMyRequestsTabVisible() {
    await expect(this.myRequestsTab).toBeVisible();
  }

  async expectOpenRequestsTabVisible() {
    await expect(this.openRequestsTab).toBeVisible();
  }

  async expectOpenRequestsTabHidden() {
    await expect(this.openRequestsTab).not.toBeVisible();
  }

  async expectMyOffersTabVisible() {
    await expect(this.myOffersTab).toBeVisible();
  }

  async expectMyOffersTabHidden() {
    await expect(this.myOffersTab).not.toBeVisible();
  }

  // Actions
  async clickNewRequest() {
    await this.newRequestButton.click();
    await this.waitForUrl(/\/app\/requests\/new/);
  }

  async selectMyRequestsTab() {
    await this.myRequestsTab.click();
    await this.expectTabActive('My Requests');
  }

  async selectOpenRequestsTab() {
    await this.openRequestsTab.click();
    await this.expectTabActive('Open Requests');
  }

  async selectMyOffersTab() {
    await this.myOffersTab.click();
    await this.expectTabActive('My Offers');
  }

  async clickFirstRequest() {
    await this.requestCards.first().click();
    await this.waitForUrl(/\/app\/requests\/[a-z0-9-]+/);
  }
}

export class NewRequestPage extends BasePage {
  readonly path = '/app/requests/new';

  // Step indicators
  get stepIndicator(): Locator {
    return this.page.locator('text=/Step [1-3] of 3/');
  }

  get progressBar(): Locator {
    return this.page.locator('.h-1.flex-1.rounded-full');
  }

  // Step 1: Basic info
  get titleInput(): Locator {
    return this.page.locator('input#title');
  }

  get descriptionInput(): Locator {
    return this.page.locator('textarea#rawDescription');
  }

  get aiRefineButton(): Locator {
    return this.page.locator('button:has-text("Let AI help structure this")');
  }

  // Step 2: Refined summary
  get refinedSummaryInput(): Locator {
    return this.page.locator('textarea#refinedSummary');
  }

  get constraintsInput(): Locator {
    return this.page.locator('textarea#constraints');
  }

  get desiredOutcomeInput(): Locator {
    return this.page.locator('textarea#desiredOutcome');
  }

  // Step 3: Preferences
  get duration30Button(): Locator {
    return this.page.locator('button:has-text("30 min")');
  }

  get duration60Button(): Locator {
    return this.page.locator('button:has-text("60 min")');
  }

  get duration90Button(): Locator {
    return this.page.locator('button:has-text("90 min")');
  }

  get urgencyNormalRadio(): Locator {
    return this.page.locator('label:has-text("Normal")');
  }

  get urgencyHighRadio(): Locator {
    return this.page.locator('label:has-text("High")');
  }

  get budgetInput(): Locator {
    return this.page.locator('input#budget');
  }

  // Navigation buttons
  get continueButton(): Locator {
    return this.page.locator('button:has-text("Continue")');
  }

  get backButton(): Locator {
    return this.page.locator('button:has-text("Back")');
  }

  get createRequestButton(): Locator {
    return this.page.locator('button:has-text("Create Request")');
  }

  // Navigation
  async navigate() {
    await this.goto(this.path);
  }

  async navigateWithConsultant(consultantId: string) {
    await this.goto(`${this.path}?consultant=${consultantId}`);
  }

  // Assertions
  async expectHeading() {
    await expect(this.page.locator('text=Create a Request')).toBeVisible();
  }

  async expectStep(step: 1 | 2 | 3) {
    await expect(this.stepIndicator).toContainText(`Step ${step} of 3`);
  }

  async expectContinueEnabled() {
    await expect(this.continueButton).toBeEnabled();
  }

  async expectContinueDisabled() {
    await expect(this.continueButton).toBeDisabled();
  }

  async expectAiRefineButtonVisible() {
    await expect(this.aiRefineButton).toBeVisible();
  }

  // Step 1 Actions
  async fillStep1(title: string, description: string) {
    await this.titleInput.fill(title);
    await this.descriptionInput.fill(description);
  }

  async clickContinue() {
    await this.continueButton.click();
  }

  // Step 2 Actions
  async fillStep2(summary: string, constraints?: string, outcome?: string) {
    await this.refinedSummaryInput.fill(summary);
    if (constraints) await this.constraintsInput.fill(constraints);
    if (outcome) await this.desiredOutcomeInput.fill(outcome);
  }

  // Step 3 Actions
  async selectDuration(minutes: 30 | 60 | 90) {
    switch (minutes) {
      case 30:
        await this.duration30Button.click();
        break;
      case 60:
        await this.duration60Button.click();
        break;
      case 90:
        await this.duration90Button.click();
        break;
    }
  }

  async selectUrgencyNormal() {
    await this.urgencyNormalRadio.click();
  }

  async clickBack() {
    await this.backButton.click();
  }

  async submitRequest() {
    await this.createRequestButton.click();
    await this.waitForUrl(/\/app\/requests(\/[a-z0-9-]+)?$/);
  }

  // Complete flow
  async completeFullFlow(data: {
    title: string;
    description: string;
    summary: string;
    duration: 30 | 60 | 90;
  }) {
    // Step 1
    await this.fillStep1(data.title, data.description);
    await this.clickContinue();

    // Step 2
    await this.expectStep(2);
    await this.fillStep2(data.summary);
    await this.clickContinue();

    // Step 3
    await this.expectStep(3);
    await this.selectDuration(data.duration);
    await this.selectUrgencyNormal();
    await this.submitRequest();
  }
}

export class RequestDetailPage extends BasePage {
  // Navigation
  get backButton(): Locator {
    return this.page.locator('text=Back to Requests');
  }

  // Request info
  get title(): Locator {
    return this.page.locator('h1, h2').first();
  }

  get statusBadge(): Locator {
    return this.page.locator('[class*="badge"]:has-text("PUBLISHED"), [class*="badge"]:has-text("MATCHING"), [class*="badge"]:has-text("BOOKED")');
  }

  // Offer section (for consultants viewing open requests)
  get offerSection(): Locator {
    return this.page.locator('text=Interested?');
  }

  get offerMessageInput(): Locator {
    return this.page.locator('textarea[placeholder*="message"]');
  }

  get offerRateInput(): Locator {
    return this.page.locator('input[placeholder*="rate"], input#proposedRate');
  }

  get submitOfferButton(): Locator {
    return this.page.locator('button:has-text("Submit Offer")');
  }

  // Offers list (for request owner)
  get offersSection(): Locator {
    return this.page.locator('text=Offers');
  }

  get offerCards(): Locator {
    return this.page.locator('[class*="card"]:has-text("offer")');
  }

  get acceptOfferButton(): Locator {
    return this.page.locator('button:has-text("Accept")');
  }

  get declineOfferButton(): Locator {
    return this.page.locator('button:has-text("Decline")');
  }

  // Assertions
  async expectBackButtonVisible() {
    await expect(this.backButton).toBeVisible();
  }

  async expectOfferSectionVisible() {
    await expect(this.offerSection).toBeVisible();
  }

  async expectOfferSectionHidden() {
    await expect(this.offerSection).not.toBeVisible();
  }

  async expectAcceptButtonVisible() {
    await expect(this.acceptOfferButton).toBeVisible();
  }

  // Actions
  async goBack() {
    await this.backButton.click();
    await this.waitForUrl(/\/app\/requests$/);
  }

  async submitOffer(message: string, rate?: number) {
    await this.offerMessageInput.fill(message);
    if (rate && await this.offerRateInput.isVisible()) {
      await this.offerRateInput.fill(rate.toString());
    }
    await this.submitOfferButton.click();
    await this.waitForLoad();
  }

  async acceptFirstOffer() {
    await this.acceptOfferButton.first().click();
    await this.waitForLoad();
  }
}
