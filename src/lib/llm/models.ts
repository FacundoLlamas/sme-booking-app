/**
 * Claude Model Configuration
 * Defines available models, pricing, and token limits
 * Pricing can be overridden via environment variables:
 * - CLAUDE_PRICING_OPUS_INPUT/OUTPUT
 * - CLAUDE_PRICING_SONNET_INPUT/OUTPUT
 * - CLAUDE_PRICING_HAIKU_INPUT/OUTPUT
 * - LLM_MODEL for model selection
 */

export enum ClaudeModel {
  OPUS_4_5 = 'claude-opus-4-5',
  SONNET_4_5 = 'claude-sonnet-4-5',
  HAIKU_4_5 = 'claude-haiku-4-5',
}

/**
 * Get pricing from environment or use defaults
 */
function getPricingFromEnv(modelPrefix: string): { input: number; output: number } {
  const inputKey = `CLAUDE_PRICING_${modelPrefix}_INPUT`;
  const outputKey = `CLAUDE_PRICING_${modelPrefix}_OUTPUT`;
  
  const input = process.env[inputKey];
  const output = process.env[outputKey];
  
  // Return env values if both are set, otherwise use defaults
  if (input && output) {
    return {
      input: parseFloat(input),
      output: parseFloat(output),
    };
  }
  
  return { input: 0, output: 0 }; // Caller will use defaults
}

export interface ModelConfig {
  name: ClaudeModel;
  maxTokens: number;
  pricing: {
    input: number; // per million tokens
    output: number; // per million tokens
  };
  contextWindow: number;
  tokenEstimationRatio: number; // approximate characters per token
}

/**
 * Default pricing (per million tokens)
 * Can be overridden via environment variables
 */
const DEFAULT_PRICING = {
  [ClaudeModel.OPUS_4_5]: { input: 15.0, output: 75.0 },
  [ClaudeModel.SONNET_4_5]: { input: 3.0, output: 15.0 },
  [ClaudeModel.HAIKU_4_5]: { input: 0.25, output: 1.25 },
};

export const MODEL_CONFIGS: Record<ClaudeModel, ModelConfig> = {
  [ClaudeModel.OPUS_4_5]: {
    name: ClaudeModel.OPUS_4_5,
    maxTokens: 4096,
    pricing: getPricingFromEnv('OPUS') || DEFAULT_PRICING[ClaudeModel.OPUS_4_5],
    contextWindow: 200000,
    tokenEstimationRatio: 3.5, // Opus: ~3.5 characters per token
  },
  [ClaudeModel.SONNET_4_5]: {
    name: ClaudeModel.SONNET_4_5,
    maxTokens: 4096,
    pricing: getPricingFromEnv('SONNET') || DEFAULT_PRICING[ClaudeModel.SONNET_4_5],
    contextWindow: 200000,
    tokenEstimationRatio: 3.8, // Sonnet: ~3.8 characters per token
  },
  [ClaudeModel.HAIKU_4_5]: {
    name: ClaudeModel.HAIKU_4_5,
    maxTokens: 4096,
    pricing: getPricingFromEnv('HAIKU') || DEFAULT_PRICING[ClaudeModel.HAIKU_4_5],
    contextWindow: 200000,
    tokenEstimationRatio: 4.0, // Haiku: ~4.0 characters per token
  },
};

/**
 * Get the default model from environment or use SONNET_4_5
 */
export function getDefaultModel(): ClaudeModel {
  const modelEnv = process.env.LLM_MODEL;
  if (modelEnv === 'claude-opus-4-5') return ClaudeModel.OPUS_4_5;
  if (modelEnv === 'claude-haiku-4-5') return ClaudeModel.HAIKU_4_5;
  return ClaudeModel.HAIKU_4_5; // Default
}

export const DEFAULT_MODEL = getDefaultModel();
