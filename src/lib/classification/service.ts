/**
 * Service Classification API
 * Main entry point that orchestrates all classification components
 * - LLM classification with caching
 * - Error recovery with fallback
 * - Metrics tracking
 * 
 * DEPENDENCY DIRECTION:
 * ┌─────────────────────────────┐
 * │  classification/service.ts  │ (THIS FILE - entry point)
 * └──────────────┬──────────────┘
 *                │
 *         ┌──────┴──────┬──────────┬─────────────────┐
 *         ▼             ▼          ▼                 ▼
 *    llm/client   cache/*    telemetry/*      error-recovery
 *    llm/models   validator  (no reverse deps)    (no reverse deps)
 */

import { createMessage, DEFAULT_MODEL } from '@/lib/llm/client';
import { getClassificationSystemPrompt, getClassificationPrompt } from './system-prompt';
import { getExamplesForService, getAllExamples, formatExamplesForPrompt } from './examples';
import {
  validateClassification,
  parseAndValidateClassification,
  normalizeServiceType,
  normalizeUrgency,
  ServiceType,
  UrgencyLevel,
  type ServiceClassification,
} from './validator';
import {
  withClassificationCache,
  getCachedClassification,
  cacheClassification,
} from '@/lib/cache/llm-cache';
import {
  classifyWithErrorRecovery,
  CircuitBreaker,
} from './error-recovery';
import { classifyWithFallback } from './fallback';
import {
  createMetricFromClassification,
  createFailedMetric,
  recordClassificationMetric,
} from '@/lib/telemetry/classification-metrics';
import { createLogger } from '@/lib/logger';
import { MODEL_CONFIGS, ClaudeModel } from '@/lib/llm/models';

const logger = createLogger('classification:service');

// Circuit breaker for LLM API
const llmCircuitBreaker = new CircuitBreaker(
  5, // fail after 5 consecutive errors
  60000 // reset after 60 seconds
);

export interface ClassifyServiceRequestOptions {
  serviceType?: string;
  useCache?: boolean;
  useFallback?: boolean;
  model?: ClaudeModel;
  includeExamples?: boolean;
}

export interface ClassifyServiceRequestResult {
  classification: ServiceClassification;
  metadata: {
    source: 'llm' | 'cache' | 'fallback' | 'default';
    latencyMs: number;
    tokensUsed: number;
    costUsd: number;
    model: string;
    error?: string;
  };
}

/**
 * Estimate token usage for a classification request
 * Uses model-specific character-to-token ratios
 * Opus: ~3.5 chars/token, Sonnet: ~3.8 chars/token, Haiku: ~4.0 chars/token
 */
function estimateTokens(text: string, model: ClaudeModel = DEFAULT_MODEL): number {
  const modelConfig = MODEL_CONFIGS[model];
  const charsPerToken = modelConfig?.tokenEstimationRatio || 3.8;
  return Math.ceil(text.length / charsPerToken);
}

/**
 * Calculate cost of API call
 */
function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: ClaudeModel = DEFAULT_MODEL
): number {
  const modelConfig = MODEL_CONFIGS[model];
  if (!modelConfig) {
    logger.warn(`Unknown model: ${model}, using Sonnet pricing`);
    const sonetConfig = MODEL_CONFIGS[ClaudeModel.SONNET_4_5];
    return (inputTokens * sonetConfig.pricing.input + outputTokens * sonetConfig.pricing.output) / 1000000;
  }
  return (inputTokens * modelConfig.pricing.input + outputTokens * modelConfig.pricing.output) / 1000000;
}

/**
 * Main classification function
 * Orchestrates: cache → LLM with retry → fallback → metrics
 */
export async function classifyServiceRequest(
  customerMessage: string,
  options: ClassifyServiceRequestOptions = {}
): Promise<ClassifyServiceRequestResult> {
  const startTime = Date.now();
  const {
    serviceType = 'general',
    useCache = true,
    useFallback = true,
    model = DEFAULT_MODEL,
    includeExamples = true,
  } = options;

  try {
    // Check circuit breaker
    if (llmCircuitBreaker.isOpen()) {
      logger.warn('LLM circuit breaker is open, using fallback');
      return classifyWithFallbackFn(customerMessage, startTime, 'fallback');
    }

    // Check cache if enabled
    if (useCache) {
      const cached = await getCachedClassification(serviceType, customerMessage);
      if (cached.isCached) {
        const latencyMs = Date.now() - startTime;
        const result: ClassifyServiceRequestResult = {
          classification: cached.data as ServiceClassification,
          metadata: {
            source: 'cache',
            latencyMs,
            tokensUsed: 0,
            costUsd: 0,
            model: 'cached',
          },
        };

        // Record metric
        const metric = createMetricFromClassification(cached.data as ServiceClassification, {
          latencyMs,
          tokensUsed: 0,
          costUsd: 0,
          modelUsed: 'cache',
          fromFallback: false,
        });
        recordClassificationMetric(metric);

        logger.info(`Cache hit for service classification`);
        return result;
      }
    }

    // Build classification prompt with examples
    let prompt = getClassificationPrompt(customerMessage);
    if (includeExamples) {
      const examples = getAllExamples().slice(0, 3); // Use first 3 examples
      prompt = `${formatExamplesForPrompt(examples)}\n\n${prompt}`;
    }

    const systemPrompt = getClassificationSystemPrompt();

    // Call LLM with error recovery
    const result = await classifyWithErrorRecovery(
      customerMessage,
      async () => {
        // Wrap with circuit breaker
        const messageResponse = await createMessage({
          prompt,
          system: systemPrompt,
          model,
        });

        // Parse and validate response
        const validated = parseAndValidateClassification(messageResponse.content);
        if (!validated.valid) {
          throw new Error(`Validation failed: ${(validated as any).error}`);
        }

        // Normalize response
        return {
          ...validated.data,
          service_type: normalizeServiceType(validated.data.service_type),
          urgency: normalizeUrgency(validated.data.urgency) as UrgencyLevel,
        };
      }
    );

    const latencyMs = Date.now() - startTime;

    // Estimate tokens and cost for LLM call (when not from fallback)
    let tokensUsed = 0;
    let costUsd = 0;
    if (!result.fromFallback) {
      tokensUsed = estimateTokens(prompt, model) + estimateTokens(systemPrompt, model);
      costUsd = calculateCost(tokensUsed, estimateTokens(JSON.stringify(result.classification), model), model);
      llmCircuitBreaker.recordSuccess();
    }

    // Cache the result if not from fallback
    if (!result.fromFallback && useCache) {
      await cacheClassification(serviceType, customerMessage, result.classification);
    }

    // Record metric
    const metric = createMetricFromClassification(result.classification, {
      latencyMs,
      tokensUsed,
      costUsd,
      modelUsed: result.fromFallback ? 'fallback' : model,
      fromFallback: result.fromFallback,
    });
    recordClassificationMetric(metric);

    return {
      classification: result.classification,
      metadata: {
        source: result.fromFallback ? 'fallback' : 'llm',
        latencyMs,
        tokensUsed,
        costUsd,
        model: result.fromFallback ? 'fallback' : model,
        error: result.error?.message,
      },
    };
  } catch (error) {
    logger.error('Classification error:', error);
    llmCircuitBreaker.recordFailure();

    // Final fallback if all else fails
    if (useFallback) {
      return classifyWithFallbackFn(customerMessage, startTime, 'fallback');
    }

    // Record failed metric
    const latencyMs = Date.now() - startTime;
    const metric = createFailedMetric('unknown', {
      latencyMs,
      tokensUsed: 0,
      costUsd: 0,
      errorCode: 'CLASSIFICATION_FAILED',
      modelUsed: model,
    });
    recordClassificationMetric(metric);

    throw error;
  }
}

/**
 * Helper to classify with fallback
 */
async function classifyWithFallbackFn(
  customerMessage: string,
  startTime: number,
  source: 'fallback' | 'default'
): Promise<ClassifyServiceRequestResult> {
  const classification = classifyWithFallback(customerMessage);
  const latencyMs = Date.now() - startTime;

  const metric = createMetricFromClassification(classification, {
    latencyMs,
    tokensUsed: 0,
    costUsd: 0,
    modelUsed: 'fallback',
    fromFallback: true,
  });
  recordClassificationMetric(metric);

  return {
    classification,
    metadata: {
      source: source as any,
      latencyMs,
      tokensUsed: 0,
      costUsd: 0,
      model: 'fallback',
    },
  };
}

/**
 * Get circuit breaker status
 */
export function getCircuitBreakerStatus(): ReturnType<CircuitBreaker['getMetrics']> {
  return llmCircuitBreaker.getMetrics();
}

/**
 * Reset circuit breaker (admin only)
 */
export function resetCircuitBreaker(): void {
  llmCircuitBreaker.reset();
  logger.info('Circuit breaker reset');
}
