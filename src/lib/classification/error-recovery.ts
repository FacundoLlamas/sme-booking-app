/**
 * Error Recovery & Retry Logic
 * Handles LLM failures with exponential backoff and fallback classification
 */

import { createLogger } from '@/lib/logger';
import { classifyWithFallback, meetsConfidenceThreshold } from './fallback';
import { ServiceClassification } from './validator';

const logger = createLogger('classification:error-recovery');

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface ClassificationError {
  code:
    | 'LLM_API_ERROR'
    | 'JSON_PARSE_ERROR'
    | 'VALIDATION_ERROR'
    | 'TIMEOUT'
    | 'RATE_LIMITED'
    | 'UNKNOWN';
  message: string;
  originalError?: Error;
  retryable: boolean;
  shouldFallback: boolean;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

/**
 * Calculate delay with exponential backoff
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(exponentialDelay, config.maxDelayMs);
}

/**
 * Add jitter to delay to prevent thundering herd
 */
export function addJitterToDelay(delayMs: number, jitterPercent: number = 10): number {
  const jitter = (delayMs * jitterPercent) / 100;
  return delayMs + Math.random() * jitter - jitter / 2;
}

/**
 * Classify error from LLM response
 */
export function classifyError(error: unknown): ClassificationError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // API errors
    if (message.includes('401') || message.includes('unauthorized')) {
      return {
        code: 'LLM_API_ERROR',
        message: 'Invalid API credentials',
        originalError: error,
        retryable: false,
        shouldFallback: true,
      };
    }

    if (message.includes('429') || message.includes('rate limit')) {
      return {
        code: 'RATE_LIMITED',
        message: 'Rate limit exceeded',
        originalError: error,
        retryable: true,
        shouldFallback: true,
      };
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return {
        code: 'TIMEOUT',
        message: 'Request timeout',
        originalError: error,
        retryable: true,
        shouldFallback: true,
      };
    }

    if (message.includes('json') || message.includes('parse')) {
      return {
        code: 'JSON_PARSE_ERROR',
        message: 'Invalid JSON in response',
        originalError: error,
        retryable: true,
        shouldFallback: true,
      };
    }

    if (message.includes('validation') || message.includes('schema')) {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Response validation failed',
        originalError: error,
        retryable: true,
        shouldFallback: true,
      };
    }

    // Network errors
    if (message.includes('network') || message.includes('econnrefused')) {
      return {
        code: 'LLM_API_ERROR',
        message: 'Network error connecting to LLM API',
        originalError: error,
        retryable: true,
        shouldFallback: true,
      };
    }
  }

  // Unknown error
  return {
    code: 'UNKNOWN',
    message: String(error),
    originalError: error instanceof Error ? error : undefined,
    retryable: true,
    shouldFallback: true,
  };
}

/**
 * Retry a classification operation with exponential backoff
 */
export async function retryClassification(
  operationFn: () => Promise<ServiceClassification>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<ServiceClassification> {
  let lastError: ClassificationError | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    try {
      logger.debug(`Attempt ${attempt + 1}/${config.maxRetries + 1}`);
      return await operationFn();
    } catch (error) {
      lastError = classifyError(error);

      if (!lastError.retryable || attempt === config.maxRetries) {
        // Final attempt or non-retryable error
        logger.error(
          `Classification failed (${lastError.code}): ${lastError.message}`,
          { attempt: attempt + 1, maxRetries: config.maxRetries }
        );
        throw lastError;
      }

      // Calculate delay for next retry
      const delay = calculateBackoffDelay(attempt, config);
      const jitteredDelay = addJitterToDelay(delay);

      logger.warn(
        `Attempt ${attempt + 1} failed, retrying in ${jitteredDelay.toFixed(0)}ms: ${lastError.message}`
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
    }
  }

  // Should not reach here, but just in case
  throw lastError || new Error('Classification failed after all retries');
}

/**
 * Classify with automatic fallback on error
 */
export async function classifyWithErrorRecovery(
  customerMessage: string,
  classificationFn: () => Promise<ServiceClassification>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{
  classification: ServiceClassification;
  fromFallback: boolean;
  error?: ClassificationError;
}> {
  try {
    // Try with retries first
    const classification = await retryClassification(classificationFn, config);
    return { classification, fromFallback: false };
  } catch (error) {
    const classifyErr = classifyError(error);

    logger.warn(`LLM classification failed, using fallback: ${classifyErr.message}`);

    // If LLM failed, use fallback
    if (classifyErr.shouldFallback) {
      try {
        const fallbackClassification = classifyWithFallback(customerMessage);
        return {
          classification: fallbackClassification,
          fromFallback: true,
          error: classifyErr,
        };
      } catch (fallbackError) {
        logger.error('Fallback classification also failed', fallbackError);
        // Return a safe default
        return {
          classification: {
            service_type: 'general_maintenance',
            urgency: 'low',
            confidence: 0.1,
            reasoning: 'Both LLM and fallback failed, using safe default',
            estimated_duration_minutes: 90,
          },
          fromFallback: true,
          error: classifyErr,
        };
      }
    }

    throw error;
  }
}

/**
 * Create a circuit breaker for LLM API
 * Fails fast if too many errors occur
 */
export class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private failureThreshold: number = 5,
    private resetTimeoutMs: number = 60000
  ) {}

  /**
   * Check if circuit allows requests
   */
  isOpen(): boolean {
    if (this.state === 'open') {
      // Check if we should transition to half-open
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime > this.resetTimeoutMs
      ) {
        this.state = 'half-open';
        logger.info('Circuit breaker transitioning to half-open');
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Record a successful request
   */
  recordSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.state = 'closed';
      this.successCount += 1;
      logger.info('Circuit breaker closed after recovery');
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(): void {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      logger.error(
        `Circuit breaker opened after ${this.failureCount} failures`,
        { threshold: this.failureThreshold }
      );
    }
  }

  /**
   * Get circuit state
   */
  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Reset circuit
   */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    logger.info('Circuit breaker reset');
  }
}

/**
 * Wrap LLM call with circuit breaker
 */
export async function withCircuitBreaker(
  breaker: CircuitBreaker,
  fn: () => Promise<ServiceClassification>
): Promise<ServiceClassification> {
  if (breaker.isOpen()) {
    throw new Error(
      'Circuit breaker is open. LLM service temporarily unavailable. Using fallback classification.'
    );
  }

  try {
    const result = await fn();
    breaker.recordSuccess();
    return result;
  } catch (error) {
    breaker.recordFailure();
    throw error;
  }
}
