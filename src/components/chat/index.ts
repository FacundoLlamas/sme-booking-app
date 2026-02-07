/**
 * Chat Components - Barrel export
 * Exports all chat-related components for easy importing
 */

export { ChatWidget } from './ChatWidget';
export { MessageList } from './MessageList';
export { MessageInput } from './MessageInput';
export { StreamingMessage } from './StreamingMessage';
export { ErrorMessage } from './ErrorMessage';

// Export types from the types module
export type {
  ChatMessage,
  MessageRole,
  UrgencyLevel,
  ServiceClassification,
  ChatApiResponse,
  StreamEventType,
  StreamEvent,
  ChatWidgetProps,
} from '@/types/chat';
