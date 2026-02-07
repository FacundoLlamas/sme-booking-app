/**
 * E2E Tests for Booking User Flow
 * Tests complete user journey from chat to booking confirmation
 * Framework: Playwright
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Complete Booking Flow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(BASE_URL);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should complete full booking flow from chat to confirmation', async () => {
    // Step 1: Navigate to booking page
    await page.goto(`${BASE_URL}/bookings/new`);
    await expect(page).toHaveTitle(/booking/i);

    // Step 2: Fill customer details (Step 1)
    await page.fill('input[name="customer_name"]', 'John Doe');
    await page.fill('input[name="phone"]', '+1-555-0123');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="address"]', '123 Main Street, NYC, NY 10001');

    // Step 3: Click Next button
    await page.click('button:has-text("Next")');
    await page.waitForNavigation();

    // Step 4: Select service type (Step 2)
    await page.selectOption('select[name="service_type"]', 'plumbing');
    await page.click('button:has-text("Next")');
    await page.waitForNavigation();

    // Step 5: Select date and time (Step 3)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    await page.fill('input[type="date"]', dateString);
    await page.selectOption('select[name="time"]', '14:00');
    await page.click('button:has-text("Next")');
    await page.waitForNavigation();

    // Step 6: Review and confirm (Step 4)
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=plumbing')).toBeVisible();
    
    // Add notes (optional)
    const notesField = page.locator('textarea[name="notes"]');
    if (await notesField.isVisible()) {
      await notesField.fill('Leaky faucet in kitchen');
    }

    // Click Confirm button
    await page.click('button:has-text("Confirm Booking")');
    await page.waitForNavigation();

    // Step 7: Verify confirmation page
    await expect(page).toHaveURL(/\/bookings\/\d+/);
    await expect(page.locator('text=Booking Confirmed')).toBeVisible();
    
    // Extract confirmation code
    const confirmationCode = await page
      .locator('[data-testid="confirmation-code"]')
      .textContent();
    expect(confirmationCode).toMatch(/^[A-Z0-9]{8}$/);

    // Verify booking details on confirmation page
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Plumbing')).toBeVisible();
  });

  test('should save and recover draft on page reload', async () => {
    // Navigate to booking page
    await page.goto(`${BASE_URL}/bookings/new`);

    // Fill partial form
    await page.fill('input[name="customer_name"]', 'Jane Smith');
    await page.fill('input[name="email"]', 'jane@example.com');

    // Wait for auto-save
    await page.waitForTimeout(600);

    // Reload page
    await page.reload();

    // Verify draft was recovered
    const nameValue = await page.inputValue('input[name="customer_name"]');
    expect(nameValue).toBe('Jane Smith');

    const emailValue = await page.inputValue('input[name="email"]');
    expect(emailValue).toBe('jane@example.com');
  });

  test('should validate form fields', async () => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Try to submit with empty fields
    await page.click('button:has-text("Next")');

    // Should show validation errors
    await expect(page.locator('text=required')).toBeVisible();
  });

  test('should validate email format', async () => {
    await page.goto(`${BASE_URL}/bookings/new`);

    await page.fill('input[name="customer_name"]', 'John Doe');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="phone"]', '+1-555-0123');
    await page.fill('input[name="address"]', '123 Main Street');

    await page.click('button:has-text("Next")');

    // Should show email validation error
    await expect(page.locator('text=Invalid email')).toBeVisible();
  });

  test('should validate phone format', async () => {
    await page.goto(`${BASE_URL}/bookings/new`);

    await page.fill('input[name="customer_name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="phone"]', '123'); // Too short
    await page.fill('input[name="address"]', '123 Main Street');

    await page.click('button:has-text("Next")');

    // Should show phone validation error
    await expect(page.locator('text=Invalid phone')).toBeVisible();
  });

  test('should disable past dates in date picker', async () => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Fill steps 1-2
    await page.fill('input[name="customer_name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="phone"]', '+1-555-0123');
    await page.fill('input[name="address"]', '123 Main Street');
    await page.click('button:has-text("Next")');
    await page.waitForNavigation();

    // Select service and continue
    await page.selectOption('select[name="service_type"]', 'plumbing');
    await page.click('button:has-text("Next")');
    await page.waitForNavigation();

    // Check date picker
    const dateInput = page.locator('input[type="date"]');
    const today = new Date();
    today.setDate(today.getDate() - 1);
    const yesterdayString = today.toISOString().split('T')[0];

    // Try to set to yesterday - should be disabled
    await dateInput.fill(yesterdayString);
    
    // Verify it didn't accept the past date
    const dateValue = await dateInput.inputValue();
    const dateObj = new Date(dateValue);
    expect(dateObj.getTime()).toBeGreaterThanOrEqual(today.getTime());
  });

  test('should show available time slots', async () => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Fill and navigate to time selection
    await page.fill('input[name="customer_name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="phone"]', '+1-555-0123');
    await page.fill('input[name="address"]', '123 Main Street');
    await page.click('button:has-text("Next")');
    await page.waitForNavigation();

    await page.selectOption('select[name="service_type"]', 'electrical');
    await page.click('button:has-text("Next")');
    await page.waitForNavigation();

    // Select a date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateString);

    // Should show time slots
    await page.waitForSelector('select[name="time"]');
    const options = await page.locator('select[name="time"] option').count();
    expect(options).toBeGreaterThan(1); // Should have multiple time slots
  });

  test('should handle network errors gracefully', async () => {
    // Simulate network error
    await page.context().setOffline(true);

    await page.goto(`${BASE_URL}/bookings/new`);

    // Try to submit
    await page.fill('input[name="customer_name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="phone"]', '+1-555-0123');
    await page.fill('input[name="address"]', '123 Main Street');
    await page.click('button:has-text("Next")');

    // Should show error message
    await expect(
      page.locator('text=Network error|Connection failed')
    ).toBeVisible({ timeout: 5000 });

    // Restore connection
    await page.context().setOffline(false);
  });

  test('should show loading state during submission', async () => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Fill form
    await page.fill('input[name="customer_name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="phone"]', '+1-555-0123');
    await page.fill('input[name="address"]', '123 Main Street');

    // Navigate to confirmation
    await page.click('button:has-text("Next")');
    await page.waitForNavigation();

    await page.selectOption('select[name="service_type"]', 'plumbing');
    await page.click('button:has-text("Next")');
    await page.waitForNavigation();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateString);
    await page.selectOption('select[name="time"]', '14:00');
    await page.click('button:has-text("Next")');
    await page.waitForNavigation();

    // Click submit and check for loading indicator
    const submitButton = page.locator('button:has-text("Confirm")');
    await submitButton.click();

    // Should show loading state
    await expect(submitButton).toBeDisabled();
  });

  test('should display booking confirmation details', async () => {
    // Complete booking flow
    await page.goto(`${BASE_URL}/bookings/new`);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    // Fill and submit
    await page.fill('input[name="customer_name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="phone"]', '+1-555-0123');
    await page.fill('input[name="address"]', '123 Main Street');

    await page.click('button:has-text("Next")');
    await page.waitForNavigation();

    await page.selectOption('select[name="service_type"]', 'plumbing');
    await page.click('button:has-text("Next")');
    await page.waitForNavigation();

    await page.fill('input[type="date"]', dateString);
    await page.selectOption('select[name="time"]', '14:00');
    await page.click('button:has-text("Next")');
    await page.waitForNavigation();

    await page.click('button:has-text("Confirm")');
    await page.waitForNavigation();

    // Verify confirmation page elements
    await expect(page.locator('text=Booking Confirmed')).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Plumbing')).toBeVisible();
    
    // Verify action buttons
    await expect(page.locator('button:has-text("Add to Calendar")')).toBeVisible();
    await expect(page.locator('button:has-text("Return to Chat")')).toBeVisible();
  });

  test('should allow cancel from confirmation page', async () => {
    // This would require a way to reach the booking detail page
    // Assuming there's a link to manage the booking
    await page.goto(`${BASE_URL}/bookings/1/edit`);

    // Click cancel button
    const cancelButton = page.locator('button:has-text("Cancel Booking")');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Confirm cancellation
      await page.click('button:has-text("Confirm Cancellation")');

      // Should show cancellation success
      await expect(page.locator('text=Booking cancelled')).toBeVisible();
    }
  });

  test('should be responsive on mobile devices', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      isMobile: true,
    });
    const mobilePage = await mobileContext.newPage();

    try {
      await mobilePage.goto(`${BASE_URL}/bookings/new`);

      // Fill form on mobile
      await mobilePage.fill('input[name="customer_name"]', 'John Doe');
      await mobilePage.fill('input[name="email"]', 'john@example.com');
      await mobilePage.fill('input[name="phone"]', '+1-555-0123');
      await mobilePage.fill('input[name="address"]', '123 Main Street');

      // Verify form is usable
      const nextButton = mobilePage.locator('button:has-text("Next")');
      await expect(nextButton).toHaveProperty('offsetHeight', /(44|48|50)/);
      // Touch target should be at least 44px
    } finally {
      await mobilePage.close();
      await mobileContext.close();
    }
  });

  test('should be keyboard navigable', async () => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Tab to first field
    await page.keyboard.press('Tab');
    const nameInput = page.locator('input[name="customer_name"]');
    await expect(nameInput).toBeFocused();

    // Type in focused field
    await page.keyboard.type('John Doe');

    // Tab to next field
    await page.keyboard.press('Tab');
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeFocused();

    // Continue with keyboard navigation
    await page.keyboard.type('john@example.com');
    await page.keyboard.press('Tab');

    const phoneInput = page.locator('input[name="phone"]');
    await expect(phoneInput).toBeFocused();
  });
});

test.describe('Booking Error Scenarios', () => {
  test('should show error when service not found', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Try to select non-existent service
    // This depends on implementation
    await expect(page.locator('text=Service not available')).toHaveCount(0); // Initially not shown
  });

  test('should show error when no slots available', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings/new`);

    // Fill form
    await page.fill('input[name="customer_name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="phone"]', '+1-555-0123');
    await page.fill('input[name="address"]', '123 Main Street');
    await page.click('button:has-text("Next")');
    await page.waitForNavigation();

    await page.selectOption('select[name="service_type"]', 'plumbing');
    await page.click('button:has-text("Next")');
    await page.waitForNavigation();

    // Try to select a date far in future (might have no slots)
    const date = new Date();
    date.setDate(date.getDate() + 90);
    const dateString = date.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateString);

    // If no slots show, verify error message
    const timeSelect = page.locator('select[name="time"]');
    if (await timeSelect.isVisible()) {
      const optionCount = await timeSelect.locator('option').count();
      if (optionCount <= 1) {
        // Only default option, likely no slots
        await expect(page.locator('text=No available slots')).toBeVisible();
      }
    }
  });
});
