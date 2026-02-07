/**
 * useChat Hook - Main chat management hook
 * Handles sending messages, streaming, and API interactions
 * Uses ChatContext for state management
 */

'use client';

import { useCallback } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useChatStorage } from './useChatStorage';
import type { ChatMessage, ServiceClassification, StreamEvent, TokenEvent } from '@/types/chat';

interface UseChatOptions {
  apiUrl?: string;
  streamApiUrl?: string;
  customerId?: number;
  businessId?: number;
  persistChat?: boolean;
}

/**
 * useChat hook - Manages chat state and API interactions
 *
 * @param {UseChatOptions} options - Configuration options
 * @returns {Object} Chat management functions and state
 */
export function useChat(options: UseChatOptions = {}) {
  const {
    apiUrl = '/api/v1/chat',
    streamApiUrl = '/api/v1/chat/stream',
    customerId,
    businessId,
    persistChat = true,
  } = options;

  const { state, addMessage, setLoading, setError, setClassification, setSessionId, clearChat: clearChatContext } =
    useChatContext();
  const { saveMessages, loadMessages, clearStorage } = useChatStorage();

  /**
   * Generate a unique message ID
   */
  const generateMessageId = useCallback((): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }, []);

  /**
   * Get or create session ID
   */
  const getSessionId = useCallback((): string => {
    if (state.session_id) return state.session_id;

    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    setSessionId(newSessionId);
    return newSessionId;
  }, [state.session_id, setSessionId]);

  /**
   * Send a regular (non-streaming) chat message
   */
  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim()) {
        setError('Message cannot be empty');
        return;
      }

      try {
        setError(null);
        setLoading(true);

        // Add user message immediately (optimistic update)
        const userMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'user',
          content: messageText,
          timestamp: new Date(),
        };
        addMessage(userMessage);

        // Prepare request
        const sessionId = getSessionId();
        const requestBody = {
          message: messageText,
          session_id: sessionId,
          customer_id: customerId,
          business_id: businessId,
        };

        // Send request
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-correlation-id': generateMessageId(),
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();

        // Add assistant message
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: data.data.response,
          timestamp: new Date(),
        };
        addMessage(assistantMessage);

        // Store classification
        const classification: ServiceClassification = {
          service_type: data.data.service_type,
          urgency: data.data.urgency,
          confidence: data.data.confidence,
          estimated_duration_minutes: data.data.estimated_duration_minutes,
        };
        setClassification(classification);

        // Persist messages if enabled
        if (persistChat) {
          saveMessages([userMessage, assistantMessage]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        console.error('[useChat] Error sending message:', err);
      } finally {
        setLoading(false);
      }
    },
    [
      apiUrl,
      addMessage,
      customerId,
      businessId,
      generateMessageId,
      getSessionId,
      setLoading,
      setError,
      setClassification,
      persistChat,
      saveMessages,
    ]
  );

  /**
   * Send a streaming chat message
   * Displays tokens as they arrive via Server-Sent Events
   */
  const sendStreamingMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim()) {
        setError('Message cannot be empty');
        return;
      }

      try {
        setError(null);
        setLoading(true);

        // Add user message
        const userMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'user',
          content: messageText,
          timestamp: new Date(),
        };
        addMessage(userMessage);

        // Create placeholder for streaming response
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          streaming: true,
          streamingTokens: [],
        };
        addMessage(assistantMessage);

        // Prepare request
        const sessionId = getSessionId();
        const requestBody = {
          message: messageText,
          session_id: sessionId,
          customer_id: customerId,
          business_id: businessId,
        };

        // Open EventSource
        const response = await fetch(streamApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-correlation-id': generateMessageId(),
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to start streaming`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        const tokens: string[] = [];

        // Read stream
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events
          const lines = buffer.split('\n');
          buffer = lines[lines.length - 1]; // Keep incomplete line in buffer

          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            if (line.startsWith('data: ')) {
              try {
                const event: StreamEvent = JSON.parse(line.substring(6));

                switch (event.type) {
                  case 'metadata':
                    if (event.data.conversation_id && !state.conversation_id) {
                      // Store conversation ID when received
                    }
                    if (event.data.service_type) {
                      setClassification({
                        service_type: event.data.service_type,
                        urgency: event.data.urgency || 'medium',
                        confidence: event.data.confidence || 0,
                        estimated_duration_minutes: event.data.duration_minutes,
                      });
                    }
                    break;

                  case 'message':
                    const tokenEvent = event.data as TokenEvent;
                    tokens.push(tokenEvent.token);
                    // Update message in context with new tokens
                    break;

                  case 'status':
                    // Handle status updates (classifying, generating, etc.)
                    break;

                  case 'error':
                    throw new Error(event.data.message || 'Stream error');

                  case 'done':
                    // Stream complete
                    break;
                }
              } catch (err) {
                console.warn('[useChat] Failed to parse SSE event:', line, err);
              }
            }
          }
        }

        // Finalize the assistant message
        const finalContent = tokens.join(' ');
        const finalMessage: ChatMessage = {
          id: assistantMessage.id,
          role: 'assistant',
          content: finalContent,
          timestamp: assistantMessage.timestamp,
          streaming: false,
          streamingTokens: tokens,
        };

        // Replace the streaming message with final version
        // Note: This requires updating messages in context
        if (persistChat) {
          saveMessages([userMessage, finalMessage]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Streaming failed';
        setError(errorMessage);
        console.error('[useChat] Error in streaming:', err);
      } finally {
        setLoading(false);
      }
    },
    [
      streamApiUrl,
      addMessage,
      customerId,
      businessId,
      generateMessageId,
      getSessionId,
      state.conversation_id,
      setLoading,
      setError,
      setClassification,
      persistChat,
      saveMessages,
    ]
  );

  /**
   * Load persisted messages on mount
   */
  const loadPersistedMessages = useCallback(() => {
    if (persistChat) {
      const savedMessages = loadMessages();
      if (savedMessages && savedMessages.length > 0) {
        // Load messages into state
        // This would typically be done during initialization
      }
    }
  }, [persistChat, loadMessages]);

  return {
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    theme: state.theme,
    service_classification: state.service_classification,
    sendMessage,
    sendStreamingMessage,
    loadPersistedMessages,
    clearChat: () => {
      clearStorage();
      clearChatContext();
    },
  };
}
