/**
 * Chat Widget Type Definitions
 * Comprehensive types for chat state, messages, and API interactions
 */

/**
 * Streaming state enum - Represents different states during message streaming
 * Used to track the lifecycle of streamed messages from API
 * 
 * States:
 * - IDLE: Not streaming, no active streaming message
 * - CONNECTING: Attempting to connect to streaming endpoint
 * - STREAMING: Active streaming in progress, receiving tokens
 * - COMPLETE: Streaming finished, message fully received
 * - ERROR: Streaming encountered an error
 */
export enum StreamingState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  STREAMING = 'STREAMING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

/**
 * Message role types
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Service urgency levels
 */
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'emergency';

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  streaming?: boolean;
  streamingTokens?: string[];
}

/**
 * Service classification data
 */
export interface ServiceClassification {
  service_type: string;
  urgency: UrgencyLevel;
  confidence: number;
  estimated_duration_minutes?: number;
  reasoning?: string;
}

/**
 * Chat API response
 */
export interface ChatApiResponse {
  id: number;
  conversation_id: number;
  message_id: number;
  response: string;
  service_type: string;
  urgency: UrgencyLevel;
  confidence: number;
  next_steps: string[];
  timestamp: string;
}

/**
 * Streaming event types from Server-Sent Events
 */
export type StreamEventType = 'metadata' | 'message' | 'status' | 'error' | 'done';

/**
 * Streaming event structure
 */
export interface StreamEvent {
  type: StreamEventType;
  data: any;
  timestamp?: string;
}

/**
 * Metadata event data
 */
export interface MetadataEvent {
  conversation_id?: string | number;
  message_id?: string | number;
  session_id?: string;
  service_type?: string;
  urgency?: UrgencyLevel;
  confidence?: number;
  duration_minutes?: number;
  timestamp?: string;
}

/**
 * Message token event data
 */
export interface TokenEvent {
  token: string;
  index: number;
  total: number;
  percentage: string;
}

/**
 * Status event data
 */
export interface StatusEvent {
  status: 'classifying' | 'generating' | 'complete';
  message: string;
  total_duration?: string;
}

/**
 * Chat context state
 * 
 * State Flow:
 * 1. User sends message → loading = true, error = null
 * 2. API starts streaming → streamingState = STREAMING
 * 3. Tokens arrive → UPDATE_STREAMING_MESSAGE action
 * 4. Streaming complete → streamingState = COMPLETE, loading = false
 * 5. Error occurs → streamingState = ERROR, error = message, loading = false
 */
export interface ChatContextState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  theme: 'light' | 'dark' | 'system';
  service_classification: ServiceClassification | null;
  conversation_id: number | null;
  session_id: string | null;
  /**
   * Current streaming state - tracks the lifecycle of streamed messages
   * Explicit state management for streaming operations
   */
  streamingState: StreamingState;
}

/**
 * Chat context actions
 * 
 * Action Types:
 * - ADD_MESSAGE: Adds a new message to the chat history
 * - SET_LOADING: Updates the global loading state
 * - SET_ERROR: Sets an error message (or null to clear)
 * - SET_THEME: Changes the theme preference
 * - SET_CLASSIFICATION: Updates service classification metadata
 * - SET_CONVERSATION_ID: Sets the conversation ID from API
 * - SET_SESSION_ID: Sets the session identifier
 * - SET_STREAMING_STATE: Explicitly updates the streaming state lifecycle
 * - UPDATE_STREAMING_MESSAGE: Appends tokens to the current streaming message
 * - CLEAR_CHAT: Resets all chat state to initial values
 */
export type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'SET_CLASSIFICATION'; payload: ServiceClassification }
  | { type: 'SET_CONVERSATION_ID'; payload: number }
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'SET_STREAMING_STATE'; payload: StreamingState }
  | { type: 'UPDATE_STREAMING_MESSAGE'; payload: { tokens: string[] } }
  | { type: 'CLEAR_CHAT' };

/**
 * Chat hook return type
 */
export interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  theme: 'light' | 'dark' | 'system';
  service_classification: ServiceClassification | null;
  sendMessage: (message: string) => Promise<void>;
  sendStreamingMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

/**
 * Chat storage structure
 */
export interface ChatStorage {
  messages: ChatMessage[];
  theme: 'light' | 'dark' | 'system';
  service_classification: ServiceClassification | null;
  lastUpdated: number;
}

/**
 * Component props
 */
export interface ChatWidgetProps {
  onClose?: () => void;
  initialMessage?: string;
  apiUrl?: string;
  streamApiUrl?: string;
  persistChat?: boolean;
  maxMessages?: number;
  className?: string;
}

/**
 * Message list props
 */
export interface MessageListProps {
  messages: ChatMessage[];
  loading?: boolean;
  onMessagesChange?: (messages: ChatMessage[]) => void;
  className?: string;
}

/**
 * Message input props
 */
export interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onSendStreaming: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Streaming message props
 */
export interface StreamingMessageProps {
  tokens: string[];
  isStreaming: boolean;
  className?: string;
}
