/**
 * Claude LLM Client
 * Supports both real Anthropic API and mock responses
 */

import { ClaudeModel, DEFAULT_MODEL } from './models';
export { DEFAULT_MODEL };
import { generateMockResponse, estimateTokens } from './__mocks__/mock-claude';

export interface CreateMessageParams {
  prompt: string;
  system?: string;
  model?: ClaudeModel;
  stream?: boolean;
  maxTokens?: number;
}

export interface CreateMessageResponse {
  content: string;
  tokens: {
    input: number;
    output: number;
  };
  model: string;
  id: string;
}

/**
 * Check if we should use mock mode
 */
function shouldUseMock(): boolean {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return !apiKey || apiKey === '' || apiKey === 'mock';
}

/**
 * Create a message using Claude (real or mock)
 */
export async function createMessage(
  params: CreateMessageParams
): Promise<CreateMessageResponse> {
  const useMock = shouldUseMock();

  if (useMock) {
    return createMockMessage(params);
  } else {
    return createRealMessage(params);
  }
}

/**
 * Create a mock message response
 */
async function createMockMessage(
  params: CreateMessageParams
): Promise<CreateMessageResponse> {
  const { prompt, system, model = DEFAULT_MODEL } = params;

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

  // Generate mock response
  const content = await generateMockResponse(prompt);

  // Estimate tokens
  const inputText = (system || '') + prompt;
  const inputTokens = estimateTokens(inputText);
  const outputTokens = estimateTokens(content);

  console.log(`[MOCK LLM] Model: ${model} | Input: ${inputTokens} tokens | Output: ${outputTokens} tokens`);

  return {
    content,
    tokens: {
      input: inputTokens,
      output: outputTokens,
    },
    model,
    id: `mock_msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  };
}

/**
 * Create a real message using Anthropic SDK
 */
async function createRealMessage(
  params: CreateMessageParams
): Promise<CreateMessageResponse> {
  const { prompt, system, model = DEFAULT_MODEL, maxTokens = 4096 } = params;

  try {
    // Lazy load Anthropic SDK
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const key = process.env.ANTHROPIC_API_KEY || '';
    const isOAuthToken = key.startsWith('sk-ant-oat');
    const client = new Anthropic(
      isOAuthToken
        ? { authToken: key, apiKey: null as any }
        : { apiKey: key }
    );

    const message = await client.messages.create({
      model: model,
      max_tokens: maxTokens,
      system: system,
      messages: [{ role: 'user', content: prompt }],
    });

    // Extract text content
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    console.log(
      `[LLM] Model: ${message.model} | Input: ${message.usage.input_tokens} tokens | Output: ${message.usage.output_tokens} tokens`
    );

    return {
      content: textContent.text,
      tokens: {
        input: message.usage.input_tokens,
        output: message.usage.output_tokens,
      },
      model: message.model,
      id: message.id,
    };
  } catch (error) {
    console.error('[LLM] Error calling real Anthropic API:', error);
    throw error;
  }
}

/**
 * Parse a JSON response from Claude
 */
export function parseJSONResponse<T = any>(response: CreateMessageResponse): T {
  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error('[LLM] Failed to parse JSON response:', error);
    throw new Error('Invalid JSON response from LLM');
  }
}

/**
 * Export classification helper for convenience
 */
export { classifyServiceRequest } from './__mocks__/mock-claude';

// ─── Conversation + Tool Use Support ────────────────────────────────

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, any>;
  tool_use_id?: string;
  content?: string;
  is_error?: boolean;
}

export interface CreateConversationParams {
  messages: ConversationMessage[];
  system?: string;
  tools?: any[];
  model?: ClaudeModel;
  maxTokens?: number;
}

export interface CreateConversationResponse {
  content: ContentBlock[];
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';
  tokens: { input: number; output: number };
  model: string;
  id: string;
}

/**
 * Create a conversation message with tool support (real or mock)
 */
export async function createConversationMessage(
  params: CreateConversationParams
): Promise<CreateConversationResponse> {
  if (shouldUseMock()) {
    return createMockConversationMessage(params);
  }
  return createRealConversationMessage(params);
}

/**
 * Mock conversation message (no tool use, just text)
 */
async function createMockConversationMessage(
  params: CreateConversationParams
): Promise<CreateConversationResponse> {
  const { messages, model = DEFAULT_MODEL } = params;

  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const userText =
    typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : 'hello';

  const content = await generateMockResponse(userText);

  return {
    content: [{ type: 'text', text: content }],
    stop_reason: 'end_turn',
    tokens: {
      input: estimateTokens(JSON.stringify(messages)),
      output: estimateTokens(content),
    },
    model,
    id: `mock_msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  };
}

/**
 * Real conversation message with Anthropic SDK (supports tools)
 */
async function createRealConversationMessage(
  params: CreateConversationParams
): Promise<CreateConversationResponse> {
  const { messages, system, tools, model = DEFAULT_MODEL, maxTokens = 1024 } = params;

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const key = process.env.ANTHROPIC_API_KEY || '';
  const isOAuthToken = key.startsWith('sk-ant-oat');
  const client = new Anthropic(
    isOAuthToken
      ? { authToken: key, apiKey: null as any }
      : { apiKey: key }
  );

  const apiParams: any = {
    model,
    max_tokens: maxTokens,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  if (system) apiParams.system = system;
  if (tools && tools.length > 0) apiParams.tools = tools;

  const response = await client.messages.create(apiParams);

  const contentBlocks: ContentBlock[] = response.content.map((block: any) => {
    if (block.type === 'text') {
      return { type: 'text' as const, text: block.text };
    }
    if (block.type === 'tool_use') {
      return {
        type: 'tool_use' as const,
        id: block.id,
        name: block.name,
        input: block.input,
      };
    }
    return block;
  });

  return {
    content: contentBlocks,
    stop_reason: response.stop_reason as CreateConversationResponse['stop_reason'],
    tokens: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
    model: response.model,
    id: response.id,
  };
}
