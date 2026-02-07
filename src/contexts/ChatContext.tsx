/**
 * Chat Context - React Context for chat state management
 * Uses useReducer for predictable state transitions
 * Provides messaging, classification, theme, and streaming state management
 * 
 * State Transitions:
 * 1. User interaction → ADD_MESSAGE (user message added)
 * 2. API request → SET_LOADING (true) + SET_STREAMING_STATE (CONNECTING)
 * 3. Streaming starts → SET_STREAMING_STATE (STREAMING)
 * 4. Token received → UPDATE_STREAMING_MESSAGE (tokens appended)
 * 5. Complete/Error → SET_STREAMING_STATE (COMPLETE|ERROR) + SET_LOADING (false)
 */

'use client';

import React, { createContext, useReducer, ReactNode, useCallback } from 'react';
import type {
  ChatContextState,
  ChatAction,
  ChatMessage,
  ServiceClassification,
  StreamingState,
} from '@/types/chat';
import { StreamingState as StreamingStateEnum } from '@/types/chat';

/**
 * Initial chat context state
 * 
 * Default State:
 * - No messages (empty history)
 * - Not loading
 * - No errors
 * - System theme preference
 * - No classification (until API returns it)
 * - No conversation/session IDs (set on first message)
 * - Streaming is IDLE (no active streams)
 */
const initialState: ChatContextState = {
  messages: [],
  loading: false,
  error: null,
  theme: 'system',
  service_classification: null,
  conversation_id: null,
  session_id: null,
  streamingState: StreamingStateEnum.IDLE,
};

/**
 * Chat reducer for state transitions
 * 
 * Handles all state mutations for the chat context.
 * All actions follow immutable update patterns for React best practices.
 * 
 * @param state - Current chat state
 * @param action - Action to apply
 * @returns Updated chat state
 */
function chatReducer(state: ChatContextState, action: ChatAction): ChatContextState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      // Add new message to chat history
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case 'SET_LOADING':
      // Update loading state (typically during API requests)
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      // Set error message (null to clear)
      return {
        ...state,
        error: action.payload,
      };

    case 'SET_THEME':
      // Update theme preference (light/dark/system)
      return {
        ...state,
        theme: action.payload,
      };

    case 'SET_CLASSIFICATION':
      // Update service classification from API metadata
      return {
        ...state,
        service_classification: action.payload,
      };

    case 'SET_CONVERSATION_ID':
      // Set conversation ID from API response
      return {
        ...state,
        conversation_id: action.payload,
      };

    case 'SET_SESSION_ID':
      // Set session ID for tracking
      return {
        ...state,
        session_id: action.payload,
      };

    case 'SET_STREAMING_STATE':
      // Update explicit streaming state for lifecycle tracking
      // States: IDLE → CONNECTING → STREAMING → COMPLETE
      // Or: ... → STREAMING → ERROR
      return {
        ...state,
        streamingState: action.payload,
      };

    case 'UPDATE_STREAMING_MESSAGE':
      // Append new tokens to the last (assistant) message
      // Only updates if a message exists (safety check)
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1
            ? {
                ...msg,
                streamingTokens: action.payload.tokens,
              }
            : msg
        ),
      };

    case 'CLEAR_CHAT':
      // Reset all state to initial values
      return initialState;

    default:
      return state;
  }
}

/**
 * Chat context type - Provides state and action methods
 * 
 * Methods:
 * - addMessage: Add a new message to chat history
 * - setLoading: Update loading state
 * - setError: Set/clear error message
 * - setTheme: Change theme preference
 * - setClassification: Update service classification
 * - setConversationId: Set conversation ID
 * - setSessionId: Set session ID
 * - setStreamingState: Update streaming state lifecycle
 * - clearChat: Reset all state
 */
interface ChatContextType {
  state: ChatContextState;
  dispatch: React.Dispatch<ChatAction>;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setClassification: (classification: ServiceClassification) => void;
  setConversationId: (id: number) => void;
  setSessionId: (id: string) => void;
  setStreamingState: (state: StreamingState) => void;
  clearChat: () => void;
}

/**
 * Create chat context with undefined as default
 */
export const ChatContext = createContext<ChatContextType | undefined>(undefined);

/**
 * Chat context provider props
 */
interface ChatContextProviderProps {
  children: ReactNode;
  initialMessages?: ChatMessage[];
  initialTheme?: 'light' | 'dark' | 'system';
}

/**
 * Chat Context Provider component
 * Wraps the app with chat state management
 *
 * @param {ReactNode} children - Child components
 * @param {ChatMessage[]} initialMessages - Optional initial messages
 * @param {'light' | 'dark' | 'system'} initialTheme - Optional initial theme
 * @returns {JSX.Element} Provider component
 */
export function ChatContextProvider({
  children,
  initialMessages,
  initialTheme = 'system',
}: ChatContextProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(chatReducer, {
    ...initialState,
    messages: initialMessages || [],
    theme: initialTheme,
  });

  /**
   * Add a message to the chat
   */
  const addMessage = useCallback((message: ChatMessage) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  /**
   * Set loading state
   */
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  /**
   * Set error message
   */
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  /**
   * Set theme (light/dark/system)
   */
  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, []);

  /**
   * Set service classification
   */
  const setClassification = useCallback((classification: ServiceClassification) => {
    dispatch({ type: 'SET_CLASSIFICATION', payload: classification });
  }, []);

  /**
   * Set conversation ID
   */
  const setConversationId = useCallback((id: number) => {
    dispatch({ type: 'SET_CONVERSATION_ID', payload: id });
  }, []);

  /**
   * Set session ID
   */
  const setSessionId = useCallback((id: string) => {
    dispatch({ type: 'SET_SESSION_ID', payload: id });
  }, []);

  /**
   * Set streaming state - Explicit lifecycle tracking
   * Transitions: IDLE → CONNECTING → STREAMING → COMPLETE/ERROR
   */
  const setStreamingState = useCallback((streamingState: StreamingState) => {
    dispatch({ type: 'SET_STREAMING_STATE', payload: streamingState });
  }, []);

  /**
   * Clear all chat state
   */
  const clearChat = useCallback(() => {
    dispatch({ type: 'CLEAR_CHAT' });
  }, []);

  const value: ChatContextType = {
    state,
    dispatch,
    addMessage,
    setLoading,
    setError,
    setTheme,
    setClassification,
    setConversationId,
    setSessionId,
    setStreamingState,
    clearChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/**
 * Hook to use chat context
 * Must be used inside ChatContextProvider
 *
 * @returns {ChatContextType} Chat context
 * @throws {Error} If used outside of ChatContextProvider
 */
export function useChatContext(): ChatContextType {
  const context = React.useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within ChatContextProvider');
  }
  return context;
}
