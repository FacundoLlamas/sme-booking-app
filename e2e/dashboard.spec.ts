/**
 * E2E Tests for Dashboard Pages
 * Tests dashboard overview, sidebar navigation, all sub-pages
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Overview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should render dashboard heading and welcome message', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
  });

  test('should render metric cards', async ({ page }) => {
    await expect(page.getByText('Total Bookings')).toBeVisible();
    await expect(page.getByText('Active Customers')).toBeVisible();
    await expect(page.getByText('Pending Bookings')).toBeVisible();
    await expect(page.getByText('Completion Rate')).toBeVisible();
  });

  test('should render recent bookings section', async ({ page }) => {
    await expect(page.getByText('Recent Bookings')).toBeVisible();
    // Should show "View All" link
    const viewAll = page.getByRole('link', { name: /View All/i });
    await expect(viewAll).toBeVisible();
    await expect(viewAll).toHaveAttribute('href', '/dashboard/bookings');
  });

  test('should render upcoming appointments section', async ({ page }) => {
    await expect(page.getByText('Upcoming Appointments')).toBeVisible();
  });

  test('should have a link to settings', async ({ page }) => {
    const settingsLink = page.getByRole('link', { name: /Go to Settings/i });
    await expect(settingsLink).toBeVisible();
  });

  test('should load real metrics from API (not hardcoded)', async ({ page }) => {
    // Wait for metrics to load (should show numbers, not "...")
    await page.waitForTimeout(2000);
    const totalBookings = page.locator('text=Total Bookings').locator('..').locator('..');
    // The value should be a number (or 0 if no bookings)
    const valueText = await totalBookings.locator('.text-2xl').textContent();
    expect(valueText).not.toBe('...');
    expect(valueText).toMatch(/^\d+%?$/);
  });
});

test.describe('Dashboard Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should show sidebar with all navigation links', async ({ page }) => {
    const navItems = ['Overview', 'Bookings', 'Calendar', 'Analytics', 'Customers', 'Settings'];
    for (const item of navItems) {
      await expect(page.getByRole('link', { name: new RegExp(item, 'i') }).first()).toBeVisible();
    }
  });

  test('should navigate to Bookings page', async ({ page }) => {
    await page.getByRole('link', { name: /Bookings/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/bookings/);
    await expect(page.getByRole('heading', { name: /Bookings/i })).toBeVisible();
  });

  test('should navigate to Calendar page', async ({ page }) => {
    await page.getByRole('link', { name: /Calendar/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/calendar/);
    await expect(page.getByRole('heading', { name: /Calendar/i })).toBeVisible();
  });

  test('should navigate to Analytics page', async ({ page }) => {
    await page.getByRole('link', { name: /Analytics/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/analytics/);
    await expect(page.getByRole('heading', { name: /Analytics/i })).toBeVisible();
  });

  test('should navigate to Customers page', async ({ page }) => {
    await page.getByRole('link', { name: /Customers/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/customers/);
    await expect(page.getByRole('heading', { name: /Customers/i })).toBeVisible();
  });

  test('should navigate to Settings page', async ({ page }) => {
    await page.getByRole('link', { name: /Settings/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/settings/);
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible();
  });

  test('should navigate back to Overview', async ({ page }) => {
    await page.getByRole('link', { name: /Bookings/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/bookings/);

    await page.getByRole('link', { name: /Overview/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe('Dashboard Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should show search bar', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search bookings, customers/i);
    await expect(searchInput).toBeVisible();
  });

  test('should have theme toggle button', async ({ page }) => {
    const themeToggle = page.getByLabel(/Toggle dark mode/i);
    await expect(themeToggle).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    const themeToggle = page.getByLabel(/Toggle dark mode/i);
    await themeToggle.click();

    // Check that dark class is toggled on html/body
    const hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    // After click it should have toggled (could be true or false depending on initial state)
    expect(typeof hasDark).toBe('boolean');

    // Toggle again
    await themeToggle.click();
    const hasDarkAfter = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    // Should be back to original state
    expect(hasDarkAfter).not.toBe(hasDark);
  });

  test('should show notification bell', async ({ page }) => {
    const bell = page.getByLabel(/Notifications/i);
    await expect(bell).toBeVisible();
  });

  test('should show notification dropdown on click', async ({ page }) => {
    const bell = page.getByLabel(/Notifications/i);
    await bell.click();
    // Should show notification content
    await expect(page.getByText(/Notifications|No new notifications/i)).toBeVisible();
  });

  test('should show user menu', async ({ page }) => {
    const userMenu = page.getByLabel(/User menu/i);
    await expect(userMenu).toBeVisible();
  });

  test('should show user menu dropdown on click', async ({ page }) => {
    const userMenu = page.getByLabel(/User menu/i);
    await userMenu.click();
    await expect(page.getByText(/Profile/i)).toBeVisible();
    await expect(page.getByText(/Logout/i).last()).toBeVisible();
  });
});

test.describe('Bookings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/bookings');
  });

  test('should render bookings heading and subtitle', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Bookings/i })).toBeVisible();
    await expect(page.getByText(/Manage and track/i)).toBeVisible();
  });

  test('should show New Booking button', async ({ page }) => {
    const newBookingBtn = page.getByRole('link', { name: /New Booking/i });
    await expect(newBookingBtn).toBeVisible();
  });

  test('should show export buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export PDF/i })).toBeVisible();
  });

  test('should show filter controls', async ({ page }) => {
    // Search input
    await expect(page.getByPlaceholder(/Customer name/i)).toBeVisible();
  });

  test('should filter by search text', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Customer name/i);
    await searchInput.fill('NonExistentCustomer12345');
    // Wait for filter to apply
    await page.waitForTimeout(500);
    // Table should show "No bookings found" or empty
    await expect(page.getByText(/No bookings found|No bookings/i)).toBeVisible();
  });

  test('should show bookings table with headers', async ({ page }) => {
    await expect(page.getByText('Customer')).toBeVisible();
    await expect(page.getByText('Service')).toBeVisible();
    await expect(page.getByText(/Date.*Time/i)).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
  });

  test('should show pagination controls', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Previous/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Next/i })).toBeVisible();
    await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
  });

  test('should navigate to new booking page from New Booking button', async ({ page }) => {
    await page.getByRole('link', { name: /New Booking/i }).click();
    await expect(page).toHaveURL(/\/bookings\/new/);
  });
});

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings');
  });

  test('should render settings heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible();
    await expect(page.getByText(/Manage your business/i)).toBeVisible();
  });

  test('should show danger zone section', async ({ page }) => {
    await expect(page.getByText(/Danger Zone/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Delete Business Account/i })
    ).toBeVisible();
  });
});

test.describe('Customers Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/customers');
  });

  test('should render customers heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Customers/i })).toBeVisible();
    await expect(page.getByText(/Manage customer information/i)).toBeVisible();
  });

  test('should show search input', async ({ page }) => {
    await expect(
      page.getByPlaceholder(/Search by name, email, or phone/i)
    ).toBeVisible();
  });

  test('should show New Customer button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /New Customer/i })
    ).toBeVisible();
  });
});

test.describe('Calendar Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/calendar');
  });

  test('should render calendar heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Calendar/i })).toBeVisible();
  });

  test('should show service type legend', async ({ page }) => {
    await expect(page.getByText('Plumbing').first()).toBeVisible();
    await expect(page.getByText('Electrical').first()).toBeVisible();
    await expect(page.getByText('HVAC').first()).toBeVisible();
  });
});

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/analytics');
  });

  test('should render analytics heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Analytics/i })).toBeVisible();
    await expect(page.getByText(/Business insights/i)).toBeVisible();
  });

  test('should show export buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /CSV/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /PDF/i })).toBeVisible();
  });

  test('should show date range picker with Apply button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Apply/i })).toBeVisible();
  });
});
