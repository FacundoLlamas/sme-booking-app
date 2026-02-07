/**
 * E2E Tests for New Booking Form
 * Tests the multi-step booking form at /bookings/new
 */

import { test, expect } from '@playwright/test';

test.describe('New Booking Form Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bookings/new');
  });

  test('should render the booking form page', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Book a Service/i })
    ).toBeVisible();
    await expect(
      page.getByText(/Schedule your appointment/i)
    ).toBeVisible();
  });

  test('should show step indicator', async ({ page }) => {
    // Should show step 1 of 4
    await expect(page.getByText(/1.*4|Step 1/i)).toBeVisible();
  });

  test('should show customer detail fields on step 1', async ({ page }) => {
    // Customer name field
    const nameInput = page.locator('input[name="customer_name"]');
    await expect(nameInput).toBeVisible();

    // Email field
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();

    // Phone field
    const phoneInput = page.locator('input[name="phone"]');
    await expect(phoneInput).toBeVisible();

    // Address field
    const addressInput = page.locator('input[name="address"], textarea[name="address"]');
    await expect(addressInput).toBeVisible();
  });

  test('should show Previous button disabled on step 1', async ({ page }) => {
    const prevBtn = page.getByRole('button', { name: /Previous/i });
    await expect(prevBtn).toBeDisabled();
  });

  test('should show Next button on step 1', async ({ page }) => {
    const nextBtn = page.getByRole('button', { name: /Next/i });
    await expect(nextBtn).toBeVisible();
    await expect(nextBtn).toBeEnabled();
  });

  test('should fill customer details and navigate to step 2', async ({ page }) => {
    await page.fill('input[name="customer_name"]', 'E2E Test User');
    await page.fill('input[name="email"]', 'e2e@test.com');
    await page.fill('input[name="phone"]', '555-0199');
    await page.fill('input[name="address"], textarea[name="address"]', '456 Test Ave, Suite 100');

    await page.getByRole('button', { name: /Next/i }).click();

    // Should be on step 2 (service selection)
    await page.waitForTimeout(500);
    // Step 2 should show service options
    await expect(page.getByText(/2.*4|Step 2/i)).toBeVisible();
  });

  test('should navigate back from step 2 to step 1', async ({ page }) => {
    // Fill step 1
    await page.fill('input[name="customer_name"]', 'E2E Test User');
    await page.fill('input[name="email"]', 'e2e@test.com');
    await page.fill('input[name="phone"]', '555-0199');
    await page.fill('input[name="address"], textarea[name="address"]', '456 Test Ave, Suite 100');
    await page.getByRole('button', { name: /Next/i }).click();
    await page.waitForTimeout(500);

    // Click Previous to go back
    await page.getByRole('button', { name: /Previous/i }).click();
    await page.waitForTimeout(500);

    // Should see step 1 fields still filled
    const nameValue = await page.inputValue('input[name="customer_name"]');
    expect(nameValue).toBe('E2E Test User');
  });

  test('should show auto-save tip', async ({ page }) => {
    await expect(page.getByText(/automatically saved/i)).toBeVisible();
  });

  test('should show Confirm Booking button on final step', async ({ page }) => {
    // Fill step 1
    await page.fill('input[name="customer_name"]', 'E2E Test User');
    await page.fill('input[name="email"]', 'e2e@test.com');
    await page.fill('input[name="phone"]', '555-0199');
    await page.fill('input[name="address"], textarea[name="address"]', '456 Test Ave, Suite 100');
    await page.getByRole('button', { name: /Next/i }).click();
    await page.waitForTimeout(500);

    // Step 2 - select service
    const serviceSelect = page.locator('select[name="service_type"]');
    const serviceRadio = page.locator('input[type="radio"]').first();
    if (await serviceSelect.isVisible()) {
      await serviceSelect.selectOption('plumbing');
    } else if (await serviceRadio.isVisible()) {
      await serviceRadio.click();
    }
    await page.getByRole('button', { name: /Next/i }).click();
    await page.waitForTimeout(500);

    // Step 3 - select date/time
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.isVisible()) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      await dateInput.fill(tomorrow.toISOString().split('T')[0]);
    }
    // Try to go to next step
    const nextBtn3 = page.getByRole('button', { name: /Next/i });
    if (await nextBtn3.isVisible()) {
      await nextBtn3.click();
      await page.waitForTimeout(500);
    }

    // Step 4 - should show Confirm Booking button
    const confirmBtn = page.getByRole('button', { name: /Confirm Booking/i });
    await expect(confirmBtn).toBeVisible({ timeout: 3000 });
  });
});

test.describe('New Booking Form - Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bookings/new');
  });

  test('should require customer name', async ({ page }) => {
    // Leave name empty, fill others
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="phone"]', '555-0199');
    await page.fill('input[name="address"], textarea[name="address"]', '456 Test Ave');

    await page.getByRole('button', { name: /Next/i }).click();

    // Should show some validation indication (error text, red border, etc.)
    await page.waitForTimeout(500);
    // Should still be on step 1
    const nameInput = page.locator('input[name="customer_name"]');
    await expect(nameInput).toBeVisible();
  });

  test('should require valid email', async ({ page }) => {
    await page.fill('input[name="customer_name"]', 'Test User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="phone"]', '555-0199');
    await page.fill('input[name="address"], textarea[name="address"]', '456 Test Ave');

    await page.getByRole('button', { name: /Next/i }).click();
    await page.waitForTimeout(500);

    // Should remain on step 1 or show error
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();
  });
});

test.describe('New Booking Form - Responsive', () => {
  test('should be usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/bookings/new');

    await expect(
      page.getByRole('heading', { name: /Book a Service/i })
    ).toBeVisible();

    // Form fields should be visible
    await expect(page.locator('input[name="customer_name"]')).toBeVisible();

    // Buttons should be clickable
    const nextBtn = page.getByRole('button', { name: /Next/i });
    await expect(nextBtn).toBeVisible();
    const box = await nextBtn.boundingBox();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(36);
    }
  });
});
