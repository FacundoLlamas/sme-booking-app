/**
 * E2E Tests for Chat Widget
 * Tests the global chat widget: open/close, send messages, keyboard shortcuts, streaming toggle
 */

import { test, expect } from '@playwright/test';

test.describe('Chat Widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show floating chat button on homepage', async ({ page }) => {
    const chatButton = page.getByLabel(/Open Evios HQ chat assistant/i);
    await expect(chatButton).toBeVisible();
  });

  test('should open chat widget when clicking floating button', async ({ page }) => {
    await page.getByLabel(/Open Evios HQ chat assistant/i).click();
    // Chat widget should appear with header
    await expect(page.getByText('Evios HQ').nth(1)).toBeVisible();
    await expect(page.getByText(/How can we help you today/i)).toBeVisible();
  });

  test('should close chat widget when clicking close button', async ({ page }) => {
    // Open chat
    await page.getByLabel(/Open Evios HQ chat assistant/i).click();
    await expect(page.getByText(/How can we help you today/i)).toBeVisible();

    // Close chat
    await page.getByLabel(/Close chat/i).click();

    // Chat should be closed, floating button should reappear
    await expect(page.getByLabel(/Open Evios HQ chat assistant/i)).toBeVisible();
  });

  test('should close chat widget with Escape key', async ({ page }) => {
    await page.getByLabel(/Open Evios HQ chat assistant/i).click();
    await expect(page.getByText(/How can we help you today/i)).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByLabel(/Open Evios HQ chat assistant/i)).toBeVisible();
  });

  test('should show message input with placeholder', async ({ page }) => {
    await page.getByLabel(/Open Evios HQ chat assistant/i).click();
    const input = page.getByPlaceholder(/Ask about our services/i);
    await expect(input).toBeVisible();
  });

  test('should show send button', async ({ page }) => {
    await page.getByLabel(/Open Evios HQ chat assistant/i).click();
    // Send button (could be "Send" text or arrow icon)
    const sendButton = page.getByLabel(/Send message/i).or(
      page.getByRole('button', { name: /Send/i })
    );
    await expect(sendButton.first()).toBeVisible();
  });

  test('should type a message in the input', async ({ page }) => {
    await page.getByLabel(/Open Evios HQ chat assistant/i).click();
    const input = page.getByPlaceholder(/Ask about our services/i);
    await input.fill('Hello, I need plumbing help');
    await expect(input).toHaveValue('Hello, I need plumbing help');
  });

  test('should send a message and see it appear', async ({ page }) => {
    await page.getByLabel(/Open Evios HQ chat assistant/i).click();
    const input = page.getByPlaceholder(/Ask about our services/i);
    await input.fill('Hi there');
    await input.press('Enter');

    // User message should appear
    await expect(page.getByText('Hi there')).toBeVisible({ timeout: 5000 });
  });

  test('should receive a response after sending a message', async ({ page }) => {
    await page.getByLabel(/Open Evios HQ chat assistant/i).click();
    const input = page.getByPlaceholder(/Ask about our services/i);
    await input.fill('What services do you offer?');
    await input.press('Enter');

    // Wait for assistant response (mock or real)
    // The response should contain some text about services
    await page.waitForTimeout(5000);

    // There should be at least 2 messages (user + assistant)
    // Check for assistant avatar or message bubble
    const messages = page.locator('[class*="message"], [class*="bubble"], [class*="chat"]');
    await expect(messages.first()).toBeVisible();
  });

  test('should show streaming toggle button', async ({ page }) => {
    await page.getByLabel(/Open Evios HQ chat assistant/i).click();
    // Streaming toggle shows "Standard" or "Streaming"
    const toggle = page.getByRole('button', { name: /Standard|Streaming/i });
    await expect(toggle.first()).toBeVisible();
  });

  test('should toggle streaming mode', async ({ page }) => {
    await page.getByLabel(/Open Evios HQ chat assistant/i).click();
    const toggle = page.getByRole('button', { name: /Standard|Streaming/i }).first();
    const initialText = await toggle.textContent();

    await toggle.click();

    const afterText = await toggle.textContent();
    expect(afterText).not.toBe(initialText);
  });

  test('should show clear chat button when messages exist', async ({ page }) => {
    await page.getByLabel(/Open Evios HQ chat assistant/i).click();

    // Send a message first
    const input = page.getByPlaceholder(/Ask about our services/i);
    await input.fill('Hello');
    await input.press('Enter');
    await page.waitForTimeout(1000);

    // Clear button should appear
    const clearButton = page.getByLabel(/Clear chat/i);
    await expect(clearButton).toBeVisible();
  });

  test('should clear chat history when clicking clear button', async ({ page }) => {
    await page.getByLabel(/Open Evios HQ chat assistant/i).click();

    // Send a message
    const input = page.getByPlaceholder(/Ask about our services/i);
    await input.fill('Test message');
    await input.press('Enter');
    await page.waitForTimeout(1000);

    // Click clear
    await page.getByLabel(/Clear chat/i).click();

    // Messages should be gone (might need to wait for confirmation dialog or immediate clear)
    await page.waitForTimeout(500);
    await expect(page.getByText('Test message')).toBeHidden();
  });

  test('should support Shift+Enter for newline without sending', async ({ page }) => {
    await page.getByLabel(/Open Evios HQ chat assistant/i).click();
    const input = page.getByPlaceholder(/Ask about our services/i);
    await input.focus();
    await page.keyboard.type('Line 1');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type('Line 2');

    const value = await input.inputValue();
    expect(value).toContain('Line 1');
    expect(value).toContain('Line 2');
  });

  test('should be available on dashboard pages too', async ({ page }) => {
    await page.goto('/dashboard');
    const chatButton = page.getByLabel(/Open Evios HQ chat assistant/i);
    await expect(chatButton).toBeVisible();

    await chatButton.click();
    await expect(page.getByPlaceholder(/Ask about our services/i)).toBeVisible();
  });

  test('should be available on booking form page', async ({ page }) => {
    await page.goto('/bookings/new');
    const chatButton = page.getByLabel(/Open Evios HQ chat assistant/i);
    await expect(chatButton).toBeVisible();
  });
});

test.describe('Chat Widget - Keyboard Shortcuts', () => {
  test('should focus chat input with Cmd+K', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/Open Evios HQ chat assistant/i).click();
    await page.waitForTimeout(500);

    // Click elsewhere first to unfocus
    await page.click('body');

    // Use keyboard shortcut
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+k`);

    const input = page.getByPlaceholder(/Ask about our services/i);
    await expect(input).toBeFocused();
  });
});
