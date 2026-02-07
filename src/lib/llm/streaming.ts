/**
 * LLM Streaming Support
 * Handles streaming responses from Claude API
 */

import { Readable } from 'stream';

export interface StreamChunk {
  type: 'text' | 'error' | 'stop';
  data?: string;
  error?: Error;
}

/**
 * Create a mock streaming response
 */
export async function* createMockStream(content: string): AsyncGenerator<StreamChunk> {
  // Simulate streaming by yielding chunks
  const words = content.split(' ');
  for (const word of words) {
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 50));
    yield {
      type: 'text',
      data: word + ' ',
    };
  }
  yield { type: 'stop' };
}

/**
 * Create a real streaming response from Anthropic API
 * This is a stub for future implementation
 */
export async function* createRealStream(
  prompt: string,
  system?: string,
  model: string = process.env.LLM_MODEL || 'claude-haiku-4-5'
): AsyncGenerator<StreamChunk> {
  try {
    // TODO: Implement real Anthropic streaming
    // const Anthropic = require('@anthropic-ai/sdk');
    // const client = new Anthropic({
    //   apiKey: process.env.ANTHROPIC_API_KEY,
    // });
    //
    // const stream = client.messages.stream({
    //   model: model,
    //   max_tokens: 4096,
    //   system: system,
    //   messages: [{ role: 'user', content: prompt }],
    // });
    //
    // for await (const chunk of stream) {
    //   if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
    //     yield {
    //       type: 'text',
    //       data: chunk.delta.text,
    //     };
    //   } else if (chunk.type === 'message_stop') {
    //     yield { type: 'stop' };
    //   }
    // }

    throw new Error(
      'Real Anthropic streaming not yet implemented. Install @anthropic-ai/sdk and uncomment the code above.'
    );
  } catch (error) {
    yield {
      type: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Create a streaming response (chooses between real and mock)
 */
export async function* createStream(
  prompt: string,
  system?: string,
  model: string = process.env.LLM_MODEL || 'claude-haiku-4-5'
): AsyncGenerator<StreamChunk> {
  const useMock = !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === '' || process.env.ANTHROPIC_API_KEY === 'mock';

  if (useMock) {
    // Generate mock response first
    const mockContent =
      `Mock response for: ${prompt.substring(0, 50)}...`;
    yield* createMockStream(mockContent);
  } else {
    yield* createRealStream(prompt, system, model);
  }
}

/**
 * Collect all chunks from a stream into a single string
 */
export async function collectStream(
  stream: AsyncGenerator<StreamChunk>
): Promise<string> {
  let result = '';
  for await (const chunk of stream) {
    if (chunk.type === 'text' && chunk.data) {
      result += chunk.data;
    } else if (chunk.type === 'error') {
      throw chunk.error || new Error('Stream error');
    }
  }
  return result;
}

/**
 * Convert a stream to a Node.js readable stream
 */
export function streamToReadable(
  stream: AsyncGenerator<StreamChunk>
): Readable {
  let ended = false;
  const readable = new Readable({
    async read() {
      if (ended) return;

      try {
        const { value, done } = await stream.next();
        if (done) {
          this.push(null);
          ended = true;
          return;
        }

        const chunk = value as StreamChunk;
        if (chunk.type === 'text' && chunk.data) {
          this.push(chunk.data);
        } else if (chunk.type === 'error') {
          this.destroy(chunk.error || new Error('Stream error'));
        }
      } catch (error) {
        this.destroy(error instanceof Error ? error : new Error(String(error)));
      }
    },
  });

  return readable;
}
