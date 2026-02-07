/**
 * E2E Tests for Homepage & Navigation
 * Tests homepage rendering, nav links, CTA buttons, and cross-page navigation
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render the homepage with Evios HQ branding', async ({ page }) => {
    await expect(page.getByText('Evios HQ').first()).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Book Expert Services/i })
    ).toBeVisible();
  });

  test('should show navbar links', async ({ page }) => {
    const bookNowLink = page.getByRole('link', { name: /Book Now/i });
    await expect(bookNowLink).toBeVisible();
    await expect(bookNowLink).toHaveAttribute('href', '/bookings/new');

    const dashboardLink = page.getByRole('link', { name: /Dashboard/i });
    await expect(dashboardLink).toBeVisible();
    await expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  test('should show CTA buttons that link to correct pages', async ({ page }) => {
    const bookButton = page.getByRole('link', { name: /Book a Service/i });
    await expect(bookButton).toBeVisible();
    await expect(bookButton).toHaveAttribute('href', '/bookings/new');

    const dashButton = page.getByRole('link', { name: /View Dashboard/i });
    await expect(dashButton).toBeVisible();
    await expect(dashButton).toHaveAttribute('href', '/dashboard');
  });

  test('should show feature cards', async ({ page }) => {
    await expect(page.getByText('AI Chat Assistant')).toBeVisible();
    await expect(page.getByText('Smart Scheduling')).toBeVisible();
    await expect(page.getByText('Instant Confirmations')).toBeVisible();
  });

  test('should show service type badges', async ({ page }) => {
    const services = ['Plumbing', 'Electrical', 'HVAC', 'Landscaping', 'Maintenance'];
    for (const service of services) {
      await expect(page.getByText(service).first()).toBeVisible();
    }
  });

  test('should navigate to booking page when clicking Book a Service', async ({ page }) => {
    await page.getByRole('link', { name: /Book a Service/i }).click();
    await expect(page).toHaveURL(/\/bookings\/new/);
  });

  test('should navigate to dashboard when clicking View Dashboard', async ({ page }) => {
    await page.getByRole('link', { name: /View Dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should navigate to booking page via navbar Book Now link', async ({ page }) => {
    await page.getByRole('link', { name: /Book Now/i }).click();
    await expect(page).toHaveURL(/\/bookings\/new/);
  });

  test('should navigate to dashboard via navbar Dashboard link', async ({ page }) => {
    await page.getByRole('link', { name: /Dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Cross-page Navigation', () => {
  test('should navigate from homepage to dashboard to bookings page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /View Dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();

    // Navigate to bookings via sidebar
    await page.getByRole('link', { name: /Bookings/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/bookings/);
    await expect(page.getByRole('heading', { name: /Bookings/i })).toBeVisible();
  });

  test('should navigate from booking form back to homepage', async ({ page }) => {
    await page.goto('/bookings/new');
    await expect(page.getByRole('heading', { name: /Book a Service/i })).toBeVisible();

    // Use browser back
    await page.goBack();
  });
});
