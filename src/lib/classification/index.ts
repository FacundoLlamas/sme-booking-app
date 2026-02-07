/**
 * Classification Module Exports
 * Service classification engine with fallback and error recovery
 */

export type { ServiceClassification } from './validator';
export {
  ServiceType,
  UrgencyLevel,
  getUrgencyScore,
  getUrgencyResponseWindow,
  validateClassification,
  parseAndValidateClassification,
  isValidServiceType,
  isValidUrgency,
  normalizeServiceType,
  normalizeUrgency,
  getServiceTypeDisplayName,
  getUrgencyDisplayName,
} from './validator';

export {
  getClassificationSystemPrompt,
  getClassificationPrompt,
} from './system-prompt';

export {
  getExamplesForService,
  getAllExamples,
  formatExamplesForPrompt,
  type ClassificationExample,
} from './examples';

export {
  classifyWithFallback,
  hasStrongFallbackSignal,
  meetsConfidenceThreshold,
} from './fallback';

export {
  retryClassification,
  classifyError,
  classifyWithErrorRecovery,
  CircuitBreaker,
  withCircuitBreaker,
  type RetryConfig,
  type ClassificationError,
  DEFAULT_RETRY_CONFIG,
} from './error-recovery';

export {
  classifyServiceRequest,
  getCircuitBreakerStatus,
  resetCircuitBreaker,
  type ClassifyServiceRequestOptions,
  type ClassifyServiceRequestResult,
} from './service';
