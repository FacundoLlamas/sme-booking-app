/**
 * MessageList Component - Displays chat messages with animations
 * Shows user and assistant messages with staggered fade-in animations
 */

'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StreamingMessage } from './StreamingMessage';
import type { MessageListProps, ChatMessage } from '@/types/chat';

/**
 * MessageList component
 *
 * @param {MessageListProps} props - Component props
 * @returns {JSX.Element} Message list display
 */
export function MessageList({
  messages,
  loading = false,
  onMessagesChange,
  className = '',
}: MessageListProps): JSX.Element {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }, []);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Notify parent component of message changes
   */
  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  /**
   * Format timestamp for display
   */
  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();

    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

    return new Date(date).toLocaleDateString();
  };

  return (
    <motion.div
      className={`flex-1 overflow-y-auto px-4 py-4 space-y-4 
        bg-white dark:bg-gray-900 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {messages.length === 0 ? (
        <motion.div
          className="flex items-center justify-center h-full text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-gray-500 dark:text-gray-400">
            <div className="text-2xl mb-2">💬</div>
            <p className="text-sm">Start a conversation to get help with your service request</p>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.2,
                delay: prefersReducedMotion ? 0 : index * 0.05,
              }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex gap-2 max-w-[85%] md:max-w-[70%] items-start ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center 
                    text-xs font-bold text-white
                    ${
                      message.role === 'user'
                        ? 'bg-primary-500'
                        : 'bg-gray-400 dark:bg-gray-600'
                    }`}
                  role="img"
                  aria-label={message.role === 'user' ? 'You' : 'Assistant'}
                >
                  {message.role === 'user' ? '👤' : '🤖'}
                </div>

                {/* Message bubble */}
                <div className="flex flex-col gap-1">
                  <motion.div
                    className={`px-4 py-2 rounded-lg text-sm break-words
                      ${
                        message.role === 'user'
                          ? 'bg-primary-500 text-white rounded-br-none'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                      }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    {message.streaming ? (
                      <StreamingMessage
                        tokens={message.streamingTokens || []}
                        isStreaming={message.streaming}
                      />
                    ) : (
                      <p className="text-base leading-relaxed">{message.content}</p>
                    )}
                  </motion.div>

                  {/* Timestamp */}
                  <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <motion.div
              key="loading"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="flex justify-start"
            >
              <div className="flex gap-2 items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs 
                  font-bold text-white bg-gray-400 dark:bg-gray-600">
                  🤖
                </div>
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </motion.div>
  );
}

export default MessageList;
