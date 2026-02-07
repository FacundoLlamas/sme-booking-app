/**
 * ChatWidget Component - Main chat widget container
 * Orchestrates all chat components with theme support and accessibility features
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatContextProvider, useChatContext } from '@/contexts/ChatContext';
import { useChat } from '@/hooks/useChat';
import { useChatStorage } from '@/hooks/useChatStorage';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ErrorMessage } from './ErrorMessage';
import type { ChatWidgetProps, ChatMessage } from '@/types/chat';

/**
 * Inner ChatWidget component (uses context hooks)
 */
function ChatWidgetInner({
  onClose,
  initialMessage,
  apiUrl = '/api/v1/chat',
  streamApiUrl = '/api/v1/chat/stream',
  persistChat = true,
  maxMessages = 100,
  className = '',
}: Omit<ChatWidgetProps, 'className'> & { className: string }): JSX.Element {
  const { state, setTheme, setSessionId, setError } = useChatContext();
  const {
    sendMessage,
    sendStreamingMessage,
    loadPersistedMessages,
    clearChat,
  } = useChat({
    apiUrl,
    streamApiUrl,
    persistChat,
  });

  const { loadTheme, saveTheme } = useChatStorage();
  const [mounted, setMounted] = useState(false);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  /**
   * Detect system theme preference
   */
  useEffect(() => {
    setMounted(true);
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setSystemTheme(isDark ? 'dark' : 'light');

    // Load saved theme
    const savedTheme = loadTheme();
    setTheme(savedTheme);

    // Load persisted messages
    loadPersistedMessages();

    // Initialize session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    setSessionId(sessionId);
  }, [setTheme, loadTheme, setSessionId, loadPersistedMessages]);

  /**
   * Determine active theme
   */
  const activeTheme = state.theme === 'system' ? systemTheme : state.theme;

  /**
   * Handle theme toggle
   */
  const toggleTheme = useCallback(() => {
    const newTheme = state.theme === 'light' ? 'dark' : state.theme === 'dark' ? 'system' : 'light';
    setTheme(newTheme);
    saveTheme(newTheme);
  }, [state.theme, setTheme, saveTheme]);

  /**
   * Handle initial message on load
   */
  useEffect(() => {
    if (initialMessage && state.messages.length === 0 && mounted) {
      sendMessage(initialMessage);
    }
  }, [initialMessage, mounted, state.messages.length, sendMessage]);

  if (!mounted) {
    return <div className="w-full h-full bg-white dark:bg-gray-900" />;
  }

  return (
    <motion.div
      className={`flex flex-col h-full w-full 
        bg-white dark:bg-gray-900
        rounded-lg border border-gray-200 dark:border-gray-700
        shadow-lg
        ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-label="Chat widget"
      aria-modal="true"
    >
      {/* Header */}
      <motion.div
        className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 
          bg-gray-50 dark:bg-gray-800 rounded-t-lg"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Evios HQ
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              How can we help you today?
            </p>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 
                focus:outline-none focus:ring-2 focus:ring-primary-500
                transition-colors duration-200"
              title={`Switch to ${
                state.theme === 'light' ? 'dark' : state.theme === 'dark' ? 'system' : 'light'
              } theme`}
              aria-label="Toggle theme"
            >
              {state.theme === 'light' ? '🌙' : state.theme === 'dark' ? '🖥️' : '☀️'}
            </motion.button>

            {/* Clear Chat */}
            {state.messages.length > 0 && (
              <motion.button
                onClick={() => {
                  clearChat();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                  transition-colors duration-200"
                title="Clear chat history"
                aria-label="Clear chat"
              >
                🗑️
              </motion.button>
            )}

            {/* Close Button */}
            {onClose && (
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                  transition-colors duration-200"
                title="Close chat (Esc)"
                aria-label="Close chat"
              >
                ✕
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {state.error && (
          <ErrorMessage
            message={state.error}
            onDismiss={() => setError(null)}
            severity="error"
            showRetry={false}
          />
        )}
      </AnimatePresence>

      {/* Messages */}
      <MessageList messages={state.messages} loading={state.loading} />

      {/* Input */}
      <MessageInput
        onSendMessage={sendMessage}
        onSendStreaming={sendStreamingMessage}
        disabled={state.loading}
        placeholder="Ask about our services..."
      />
    </motion.div>
  );
}

/**
 * ChatWidget component - Main export
 * Wraps everything in context provider
 *
 * @param {ChatWidgetProps} props - Widget configuration props
 * @returns {JSX.Element} Chat widget
 */
export function ChatWidget(props: ChatWidgetProps): JSX.Element {
  const { className = '', ...innerProps } = props;

  return (
    <ChatContextProvider initialTheme="system">
      <ChatWidgetInner className={className} {...innerProps} />
    </ChatContextProvider>
  );
}

export default ChatWidget;
