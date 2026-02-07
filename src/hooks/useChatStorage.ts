/**
 * useChatStorage Hook - localStorage persistence for chat messages
 * Handles saving, loading, and clearing chat history
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ChatMessage, ChatStorage } from '@/types/chat';

const STORAGE_KEY = 'sme_booking_chat_messages';
const THEME_KEY = 'sme_booking_chat_theme';
const MAX_STORED_MESSAGES = 100;

interface UseChatStorageReturn {
  saveMessages: (messages: ChatMessage[]) => void;
  loadMessages: () => ChatMessage[] | null;
  clearStorage: () => void;
  saveTheme: (theme: 'light' | 'dark' | 'system') => void;
  loadTheme: () => 'light' | 'dark' | 'system';
  isStorageAvailable: boolean;
}

/**
 * useChatStorage hook - Manages localStorage persistence for chat
 *
 * @returns {UseChatStorageReturn} Storage management functions
 */
export function useChatStorage(): UseChatStorageReturn {
  const [isStorageAvailable, setIsStorageAvailable] = useState(false);

  /**
   * Check if localStorage is available
   */
  useEffect(() => {
    const available = (() => {
      try {
        const testKey = '__localStorage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
      } catch {
        return false;
      }
    })();
    setIsStorageAvailable(available);
  }, []);

  /**
   * Save messages to localStorage
   * Keeps only the most recent MAX_STORED_MESSAGES
   */
  const saveMessages = useCallback(
    (messages: ChatMessage[]) => {
      if (!isStorageAvailable) return;

      try {
        // Serialize messages and trim to max size
        const messagesToSave = messages.slice(-MAX_STORED_MESSAGES);
        const storage: ChatStorage = {
          messages: messagesToSave.map((msg) => ({
            ...msg,
            // Ensure timestamp is serializable
            timestamp: new Date(msg.timestamp),
          })),
          theme: 'system',
          service_classification: null,
          lastUpdated: Date.now(),
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
      } catch (err) {
        console.warn('[useChatStorage] Failed to save messages:', err);
      }
    },
    [isStorageAvailable]
  );

  /**
   * Load messages from localStorage
   */
  const loadMessages = useCallback((): ChatMessage[] | null => {
    if (!isStorageAvailable) return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed: ChatStorage = JSON.parse(stored);

      // Validate and parse timestamps
      const messages = parsed.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));

      return messages;
    } catch (err) {
      console.warn('[useChatStorage] Failed to load messages:', err);
      return null;
    }
  }, [isStorageAvailable]);

  /**
   * Clear all chat storage
   */
  const clearStorage = useCallback(() => {
    if (!isStorageAvailable) return;

    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(THEME_KEY);
    } catch (err) {
      console.warn('[useChatStorage] Failed to clear storage:', err);
    }
  }, [isStorageAvailable]);

  /**
   * Save theme preference to localStorage
   */
  const saveTheme = useCallback(
    (theme: 'light' | 'dark' | 'system') => {
      if (!isStorageAvailable) return;

      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (err) {
        console.warn('[useChatStorage] Failed to save theme:', err);
      }
    },
    [isStorageAvailable]
  );

  /**
   * Load theme preference from localStorage
   */
  const loadTheme = useCallback((): 'light' | 'dark' | 'system' => {
    if (!isStorageAvailable) return 'system';

    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
      return 'system';
    } catch (err) {
      console.warn('[useChatStorage] Failed to load theme:', err);
      return 'system';
    }
  }, [isStorageAvailable]);

  return {
    saveMessages,
    loadMessages,
    clearStorage,
    saveTheme,
    loadTheme,
    isStorageAvailable,
  };
}
