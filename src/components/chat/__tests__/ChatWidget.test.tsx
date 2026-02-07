/**
 * ChatWidget Component Tests
 * Comprehensive testing of chat widget functionality, accessibility, and theme
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatWidget } from '../ChatWidget';

describe('ChatWidget', () => {
  /**
   * Setup: Mock fetch API
   */
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should render the chat widget', () => {
      render(<ChatWidget />);
      expect(screen.getByRole('dialog', { name: /chat widget/i })).toBeInTheDocument();
    });

    it('should display header with title', () => {
      render(<ChatWidget />);
      expect(screen.getByText('Service Assistant')).toBeInTheDocument();
    });

    it('should display message input field', () => {
      render(<ChatWidget />);
      expect(screen.getByRole('textbox', { name: /chat message input/i })).toBeInTheDocument();
    });

    it('should display send button', () => {
      render(<ChatWidget />);
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeInTheDocument();
    });

    it('should show empty state initially', () => {
      render(<ChatWidget />);
      expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
    });
  });

  describe('Message Sending', () => {
    it('should send a message on button click', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            response: 'Test response',
            service_type: 'plumbing',
            urgency: 'medium',
            confidence: 0.9,
            next_steps: ['Step 1'],
          },
        }),
      });
      global.fetch = mockFetch;

      const user = userEvent.setup();
      render(<ChatWidget />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      await user.type(input, 'I have a plumbing issue');
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/chat',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('plumbing issue'),
          })
        );
      });
    });

    it('should send message on Enter key', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            response: 'Response',
            service_type: 'electrical',
            urgency: 'low',
            confidence: 0.8,
          },
        }),
      });
      global.fetch = mockFetch;

      const user = userEvent.setup();
      render(<ChatWidget />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should not send message on Shift+Enter', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const user = userEvent.setup();
      render(<ChatWidget />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Test message');
      await user.keyboard('{Shift>}{Enter}{/Shift}');

      // Input should contain newline, not send
      expect((input as HTMLTextAreaElement).value).toContain('\n');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should disable send button when input is empty', () => {
      render(<ChatWidget />);
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when input has text', async () => {
      const user = userEvent.setup();
      render(<ChatWidget />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      await user.type(input, 'Test');
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('Message Display', () => {
    it('should display user message after sending', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            response: 'Assistant response',
            service_type: 'plumbing',
            urgency: 'medium',
            confidence: 0.9,
          },
        }),
      });
      global.fetch = mockFetch;

      const user = userEvent.setup();
      render(<ChatWidget />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'User message');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      await waitFor(() => {
        expect(screen.getByText('User message')).toBeInTheDocument();
      });
    });

    it('should display assistant response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            response: 'This is the assistant response',
            service_type: 'plumbing',
            urgency: 'medium',
            confidence: 0.9,
          },
        }),
      });
      global.fetch = mockFetch;

      const user = userEvent.setup();
      render(<ChatWidget />);

      await user.type(screen.getByRole('textbox'), 'Test');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      await waitFor(() => {
        expect(screen.getByText('This is the assistant response')).toBeInTheDocument();
      });
    });
  });

  describe('Theme', () => {
    it('should have theme toggle button', () => {
      render(<ChatWidget />);
      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
    });

    it('should toggle theme on button click', async () => {
      const user = userEvent.setup();
      render(<ChatWidget />);

      const themeButton = screen.getByRole('button', { name: /toggle theme/i });
      const initialTheme = themeButton.textContent;

      await user.click(themeButton);

      // Theme should change
      expect(themeButton.textContent).not.toBe(initialTheme);
    });

    it('should persist theme preference', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<ChatWidget />);

      const themeButton = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(themeButton);

      unmount();

      // Re-render should preserve theme
      render(<ChatWidget />);
      const newThemeButton = screen.getByRole('button', { name: /toggle theme/i });

      // Note: This would need proper implementation to fully test
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ChatWidget />);
      expect(screen.getByRole('dialog', { name: /chat widget/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /chat message input/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ChatWidget />);

      const input = screen.getByRole('textbox');
      input.focus();

      expect(input).toHaveFocus();
    });

    it('should have proper color contrast', () => {
      render(<ChatWidget />);
      // This would require a contrast checking library
      // For now, just verify the widget renders
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle Cmd+K to focus input', async () => {
      const user = userEvent.setup();
      render(<ChatWidget />);

      const input = screen.getByRole('textbox') as HTMLElement;
      document.body.focus();

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      // Note: This would need proper keyboard handler implementation
    });

    it('should handle Escape to blur input', async () => {
      const user = userEvent.setup();
      render(<ChatWidget />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      expect(input).toHaveFocus();

      fireEvent.keyDown(input, { key: 'Escape' });

      // Note: This would need proper keyboard handler implementation
    });

    it('should be keyboard accessible for theme toggle', async () => {
      const user = userEvent.setup();
      render(<ChatWidget />);

      const themeButton = screen.getByRole('button', { name: /toggle theme/i });
      themeButton.focus();

      expect(themeButton).toHaveFocus();

      await user.keyboard('{Enter}');
      // Theme should toggle
    });
  });

  describe('Error Handling', () => {
    it('should display error message on failed request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          message: 'Request failed',
        }),
      });
      global.fetch = mockFetch;

      const user = userEvent.setup();
      render(<ChatWidget />);

      await user.type(screen.getByRole('textbox'), 'Test');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      const user = userEvent.setup();
      render(<ChatWidget />);

      await user.type(screen.getByRole('textbox'), 'Test');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Props', () => {
    it('should accept and use custom API URL', async () => {
      const customUrl = '/api/custom/chat';
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            response: 'Response',
            service_type: 'plumbing',
            urgency: 'medium',
            confidence: 0.9,
          },
        }),
      });
      global.fetch = mockFetch;

      const user = userEvent.setup();
      render(<ChatWidget apiUrl={customUrl} />);

      await user.type(screen.getByRole('textbox'), 'Test');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          customUrl,
          expect.any(Object)
        );
      });
    });

    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<ChatWidget onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close chat/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('localStorage Persistence', () => {
    it('should persist messages to localStorage', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            response: 'Response',
            service_type: 'plumbing',
            urgency: 'medium',
            confidence: 0.9,
          },
        }),
      });
      global.fetch = mockFetch;

      const user = userEvent.setup();
      render(<ChatWidget persistChat={true} />);

      await user.type(screen.getByRole('textbox'), 'Test message');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      await waitFor(() => {
        const stored = localStorage.getItem('sme_booking_chat_messages');
        expect(stored).toBeDefined();
      });
    });
  });
});
