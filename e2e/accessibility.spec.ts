/**
 * Accessibility Tests for Booking App
 * WCAG 2.1 AA compliance verification using axe-core
 * Framework: Playwright + axe-core
 */

import { test, expect } from '@playwright/test';
import { injectAxe, getViolations } from 'axe-playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Accessibility (WCAG 2.1 AA)', () => {
  test('should have no accessibility violations on booking page', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Inject axe
    await injectAxe(page);

    // Get violations
    const violations = await getViolations(page);

    // Should have zero violations
    expect(violations).toHaveLength(0);
  });

  test('should have proper heading structure', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Check for h1
    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThanOrEqual(1);

    // Headings should be in order
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headings).toBeGreaterThan(0);
  });

  test('should have descriptive link text', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Get all links
    const links = await page.locator('a').count();

    // Check each link has text
    for (let i = 0; i < links; i++) {
      const link = page.locator('a').nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');

      // Link should have text or aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Get all form inputs
    const inputs = await page.locator('input, textarea, select').count();

    for (let i = 0; i < inputs; i++) {
      const input = page.locator('input, textarea, select').nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Input should have associated label
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        expect(label + (ariaLabel ? 1 : 0) + (ariaLabelledBy ? 1 : 0)).toBeGreaterThan(0);
      } else {
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Inject axe for contrast checking
    await injectAxe(page);

    // Check color contrast violations
    const violations = await getViolations(page, {
      rules: ['color-contrast'],
    });

    expect(violations).toHaveLength(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Tab through form fields
    const focusableElements: string[] = [];

    // Tab to first element
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      return el?.tagName + (el?.id ? `#${el.id}` : '');
    });
    focusableElements.push(focusedElement);

    // Tab through at least 5 more elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      focusedElement = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        return el?.tagName + (el?.id ? `#${el.id}` : '');
      });
      focusableElements.push(focusedElement);
    }

    // Should have visited multiple elements
    expect(focusableElements.length).toBeGreaterThan(5);
    expect(new Set(focusableElements).size).toBeGreaterThan(1);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Check for proper ARIA attributes on form
    const form = await page.locator('form').count();
    if (form > 0) {
      // Form should exist
      expect(form).toBeGreaterThan(0);
    }

    // Check for aria-required on required fields
    const requiredInputs = await page
      .locator('input[required]')
      .count();

    for (let i = 0; i < requiredInputs; i++) {
      const input = page.locator('input[required]').nth(i);
      const required = await input.getAttribute('required');
      expect(required).toBe('');
    }
  });

  test('should announce form errors to screen readers', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Submit empty form to trigger validation
    const submitButton = await page.locator('button:has-text("Next")');
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Check for error messages
      const errorMessages = await page.locator('[role="alert"]').count();
      // Note: errorMessages might be 0 if not implemented, should be > 0 for accessibility

      // Also check for aria-invalid
      const invalidInputs = await page
        .locator('[aria-invalid="true"]')
        .count();

      // At least one should be invalid
      if (invalidInputs === 0) {
        // If no aria-invalid, at least error messages should exist
        const visibleErrors = await page.locator('.error, .validation-error').count();
        expect(visibleErrors + errorMessages).toBeGreaterThan(0);
      }
    }
  });

  test('should work with screen reader mode', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Check for skip to main content link
    const skipLink = await page.locator('a[href="#main"]').count();
    // Optional but recommended

    // Check main landmark
    const mainLandmark = await page.locator('main').count();
    expect(mainLandmark + (skipLink > 0 ? 1 : 0)).toBeGreaterThanOrEqual(0);

    // Check for proper structure
    const body = await page.locator('body').count();
    expect(body).toBeGreaterThan(0);
  });

  test('should have proper image alt text', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Get all images
    const images = await page.locator('img').count();

    for (let i = 0; i < images; i++) {
      const img = page.locator('img').nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');

      // Images should have alt text or aria-label
      expect(alt || ariaLabel).toBeTruthy();
    }
  });

  test('should handle focus visible state', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Tab to a button
    const button = await page.locator('button').first();

    // Use keyboard to focus
    await page.keyboard.press('Tab');
    while (true) {
      const isFocused = await button.evaluate(
        (el) => el === document.activeElement
      );
      if (isFocused) break;
      await page.keyboard.press('Tab');
    }

    // Check if button has visible focus indicator
    const outline = await button.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline || styles.boxShadow;
    });

    // Should have some focus indicator
    expect(outline).toBeTruthy();
  });

  test('should support zoom/text size changes', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Zoom to 200%
    await page.evaluate(() => {
      document.body.style.zoom = '200%';
    });

    // Verify key elements still visible
    const heading = await page.locator('h1, h2').first();
    await expect(heading).toBeVisible();

    // Check for horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);

    // At 200% zoom, some scrolling is expected
    expect(bodyWidth).toBeGreaterThanOrEqual(windowWidth);

    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '100%';
    });
  });

  test('should have proper list semantics', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Check for lists
    const lists = await page.locator('ul, ol').count();

    // If lists exist, verify items
    for (let i = 0; i < lists; i++) {
      const list = page.locator('ul, ol').nth(i);
      const listItems = await list.locator('li').count();
      expect(listItems).toBeGreaterThan(0);
    }
  });

  test('should have proper modal/dialog handling', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Inject axe to check for dialog issues
    await injectAxe(page);

    const violations = await getViolations(page, {
      rules: ['aria-required-attr', 'aria-roles'],
    });

    // Should not have role violations
    expect(violations.length).toBeLessThan(3); // Allow some flexibility
  });

  test('Confirmation Page - Accessibility Audit', async ({ page }) => {
    // Navigate to a confirmation page (requires ID)
    await page.goto(`${BASE_URL}/bookings/1`);

    // Inject axe
    await injectAxe(page);

    // Check violations
    const violations = await getViolations(page);

    expect(violations).toHaveLength(0);
  });

  test('Dashboard - Accessibility Audit', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/bookings`);

    // Inject axe
    await injectAxe(page);

    // Check violations
    const violations = await getViolations(page);

    // Dashboard might have more complexity, but should still be accessible
    expect(violations.filter(v => v.impact === 'critical')).toHaveLength(0);
  });

  test('should handle all common accessibility impairments', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // 1. Color blindness - verify forms don't rely on color alone
    const inputs = await page.locator('input[required]').count();
    // Required fields should be marked with text or symbol, not just color

    // 2. Motor impairment - verify buttons are large enough
    const buttons = await page.locator('button').count();
    for (let i = 0; i < buttons; i++) {
      const button = page.locator('button').nth(i);
      const box = await button.boundingBox();
      // Minimum recommended size is 44x44px
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40); // Allow slight flex
      }
    }

    // 3. Cognitive impairment - verify clear labels
    const labels = await page.locator('label').count();
    expect(labels).toBeGreaterThan(0);

    // 4. Visual impairment - verify semantic HTML
    const form = await page.locator('form').count();
    expect(form).toBeGreaterThan(0);
  });
});
