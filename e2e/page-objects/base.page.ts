/**
 * Base Page Object
 *
 * Common functionality shared by all page objects.
 */

import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a path and wait for load
   */
  async goto(path: string) {
    await this.page.goto(path);
    await this.waitForLoad();
  }

  /**
   * Wait for network to be idle
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get page heading (h1)
   */
  get heading(): Locator {
    return this.page.locator('h1');
  }

  /**
   * Get page subheading (first p after h1 or explicit subtitle)
   */
  get subheading(): Locator {
    return this.page.locator('h1 + p, [class*="subtitle"]').first();
  }

  /**
   * Click a button by its text
   */
  async clickButton(text: string) {
    await this.page.locator(`button:has-text("${text}")`).click();
  }

  /**
   * Click a link by its text
   */
  async clickLink(text: string) {
    await this.page.locator(`a:has-text("${text}")`).click();
  }

  /**
   * Fill a form input by id or name
   */
  async fillInput(idOrName: string, value: string) {
    const selector = `input#${idOrName}, input[name="${idOrName}"], textarea#${idOrName}, textarea[name="${idOrName}"]`;
    await this.page.locator(selector).fill(value);
  }

  /**
   * Select a tab by its label
   */
  async selectTab(label: string) {
    const tab = this.page.locator(`button[role="tab"]:has-text("${label}")`);
    await tab.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Assert a tab is active
   */
  async expectTabActive(label: string) {
    const tab = this.page.locator(`button[role="tab"]:has-text("${label}")`);
    await expect(tab).toHaveAttribute('data-state', 'active');
  }

  /**
   * Check if an element exists and is visible
   */
  async isVisible(selector: string, timeout = 3000): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for URL to match pattern
   */
  async waitForUrl(pattern: RegExp) {
    await this.page.waitForURL(pattern);
  }

  /**
   * Get current URL
   */
  get currentUrl(): string {
    return this.page.url();
  }

  /**
   * Take a screenshot for debugging
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png` });
  }
}
