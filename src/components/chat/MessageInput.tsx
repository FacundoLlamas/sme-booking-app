/**
 * MessageInput Component - Chat input field with send button
 * Handles user input with keyboard shortcuts and accessibility
 */

'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { MessageInputProps } from '@/types/chat';

/**
 * MessageInput component
 *
 * @param {MessageInputProps} props - Component props
 * @returns {JSX.Element} Message input field
 */
export function MessageInput({
  onSendMessage,
  onSendStreaming,
  disabled = false,
  placeholder = 'Describe your issue...',
  className = '',
}: MessageInputProps): JSX.Element {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [useStreaming, setUseStreaming] = useState(false);

  /**
   * Handle send button click
   */
  const handleSend = useCallback(() => {
    if (!message.trim() || disabled) return;

    if (useStreaming) {
      onSendStreaming(message);
    } else {
      onSendMessage(message);
    }

    setMessage('');
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [message, disabled, useStreaming, onSendMessage, onSendStreaming]);

  /**
   * Handle textarea input with auto-expand
   */
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setMessage(textarea.value);

    // Auto-expand textarea
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }, []);

  /**
   * Handle keyboard shortcuts
   * Enter: send message
   * Shift+Enter: new line
   * Cmd+K (Mac) or Ctrl+K (Windows): focus input
   * Escape: blur input
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (disabled) return;

      // Cmd/Ctrl + K: Focus input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      // Escape: Blur input
      if (e.key === 'Escape') {
        e.preventDefault();
        inputRef.current?.blur();
        return;
      }

      // Enter (without Shift): Send message
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
        return;
      }

      // Shift+Enter: Add new line (default behavior)
    },
    [disabled, handleSend]
  );

  /**
   * Global keyboard handler for Cmd+K
   */
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <motion.div
      className={`px-4 py-3 border-t border-gray-200 dark:border-gray-700 
        bg-white dark:bg-gray-800 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex gap-2">
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`w-full px-3 py-2 border rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-primary-500
              resize-none overflow-hidden
              bg-gray-50 dark:bg-gray-700
              text-gray-900 dark:text-gray-100
              placeholder-gray-500 dark:placeholder-gray-400
              border-gray-200 dark:border-gray-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
              ${isFocused ? 'border-primary-400' : ''}`}
            aria-label="Chat message input"
            aria-disabled={disabled}
          />
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <button
              type="button"
              onClick={() => setUseStreaming(!useStreaming)}
              className={`px-2 py-1 rounded border transition-colors
                ${useStreaming
                  ? 'bg-primary-100 dark:bg-primary-900 border-primary-300 dark:border-primary-700'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              title={useStreaming ? 'Streaming enabled' : 'Streaming disabled'}
              aria-pressed={useStreaming}
            >
              {useStreaming ? '🔄 Streaming' : '📝 Standard'}
            </button>
            <span className="flex-1">
              Cmd+K to focus • Shift+Enter for newline
            </span>
          </div>
        </div>

        {/* Send Button */}
        <motion.button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          whileHover={{ scale: disabled || !message.trim() ? 1 : 1.05 }}
          whileTap={{ scale: disabled || !message.trim() ? 1 : 0.95 }}
          className={`h-10 px-4 rounded-lg font-medium text-white
            bg-primary-500 hover:bg-primary-600
            disabled:bg-gray-300 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            dark:focus:ring-offset-gray-800
            transition-all duration-200 flex-shrink-0 mt-auto`}
          title={message.trim() ? 'Send message (Enter)' : 'Type a message to send'}
          aria-label={useStreaming ? 'Send streaming message' : 'Send message'}
        >
          <span className="hidden sm:inline">Send</span>
          <span className="sm:hidden">→</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

export default MessageInput;
