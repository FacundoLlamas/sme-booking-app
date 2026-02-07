/**
 * StreamingMessage Component - Displays real-time token rendering
 * Shows streaming chat messages with animated token arrival
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { StreamingMessageProps } from '@/types/chat';

/**
 * StreamingMessage component
 *
 * @param {StreamingMessageProps} props - Component props
 * @returns {JSX.Element} Streaming message display
 */
export function StreamingMessage({
  tokens,
  isStreaming,
  className = '',
}: StreamingMessageProps): JSX.Element {
  /**
   * Render streaming content with animated indicators
   */
  const content = useMemo(() => {
    if (tokens.length === 0) {
      return (
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
      );
    }

    return (
      <div className="flex flex-wrap gap-1">
        {tokens.map((token, idx) => (
          <motion.span
            key={`${idx}-${token}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.1, delay: idx * 0.02 }}
            className="inline text-gray-800 dark:text-gray-200"
          >
            {token}
          </motion.span>
        ))}
        {isStreaming && (
          <motion.span
            animate={{ opacity: [0.5, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="text-gray-400 dark:text-gray-600"
          >
            █
          </motion.span>
        )}
      </div>
    );
  }, [tokens, isStreaming]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`text-sm leading-relaxed ${className}`}
    >
      {content}
    </motion.div>
  );
}

export default StreamingMessage;
