/**
 * Phase 2.1 Integration Tests
 * Tests all LLM integration and service classification components
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Import all Phase 2.1 modules
import {
  createMessage,
  classifyServiceRequest as classifyWithMock,
  ClaudeModel,
  DEFAULT_MODEL,
} from '@/lib/llm/client';
import {
  classifyServiceRequest,
  classifyWithFallback,
  meetsConfidenceThreshold,
  ServiceType,
  UrgencyLevel,
  validateClassification,
  parseAndValidateClassification,
} from '@/lib/classification';
import {
  getCache,
  initializeCache,
  generateClassificationCacheKey,
  withClassificationCache,
} from '@/lib/cache';
import {
  classifyError,
  retryClassification,
  CircuitBreaker,
} from '@/lib/classification/error-recovery';
import {
  getMetricsSnapshot,
  recordClassificationMetric,
  createMetricFromClassification,
  clearMetrics,
  formatMetricsReport,
  calculateCacheSavings,
} from '@/lib/telemetry/classification-metrics';

describe('Phase 2.1: LLM Integration & Service Classification', () => {
  beforeAll(() => {
    // Initialize cache before tests
    initializeCache();
    clearMetrics();
  });

  afterAll(() => {
    clearMetrics();
  });

  describe('Task 2.1.1: Anthropic SDK Integration', () => {
    it('should create a message with mock mode', async () => {
      // Mock mode should work without API key
      const response = await createMessage({
        prompt: 'My sink is leaking',
        model: DEFAULT_MODEL,
      });

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.tokens.input).toBeGreaterThan(0);
      expect(response.tokens.output).toBeGreaterThan(0);
      expect(response.model).toBe(DEFAULT_MODEL);
      expect(response.id).toBeDefined();
    });

    it('should support multiple Claude models', () => {
      expect(ClaudeModel.OPUS_4_5).toBe('claude-opus-4-5');
      expect(ClaudeModel.SONNET_4_5).toBe('claude-sonnet-4-5');
      expect(ClaudeModel.HAIKU_4_5).toBe('claude-haiku-4-5');
    });

    it('should estimate tokens correctly', async () => {
      const response = await createMessage({
        prompt: 'Test message',
      });

      expect(response.tokens.input).toBeGreaterThan(0);
      expect(response.tokens.output).toBeGreaterThan(0);
    });
  });

  describe('Task 2.1.2: Service Classification Engine', () => {
    it('should validate classification output schema', () => {
      const validClassification = {
        service_type: 'plumbing',
        urgency: 'high' as const,
        confidence: 0.95,
        reasoning: 'Clear plumbing issue',
        estimated_duration_minutes: 90,
      };

      const result = validateClassification(validClassification);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.service_type).toBe('plumbing');
        expect(result.data.confidence).toBe(0.95);
      }
    });

    it('should reject invalid confidence scores', () => {
      const invalid = {
        service_type: 'plumbing',
        urgency: 'high',
        confidence: 1.5, // Invalid - > 1.0
        reasoning: 'Test',
        estimated_duration_minutes: 90,
      };

      const result = validateClassification(invalid);
      expect(result.valid).toBe(false);
    });

    it('should classify plumbing requests', async () => {
      const classification = classifyWithFallback('My kitchen sink is backing up with water');

      expect(classification.service_type).toBe(ServiceType.PLUMBING);
      expect(classification.urgency).toBe(UrgencyLevel.HIGH);
      expect(classification.confidence).toBeGreaterThan(0.7);
      expect(classification.estimated_duration_minutes).toBeGreaterThan(0);
    });

    it('should classify electrical requests', async () => {
      const classification = classifyWithFallback('Lights are flickering and circuits keep tripping');

      expect(classification.service_type).toBe(ServiceType.ELECTRICAL);
      expect(classification.confidence).toBeGreaterThan(0.7);
    });

    it('should detect emergency urgency', () => {
      const classification = classifyWithFallback('My house is flooding with water pouring in');

      expect(classification.urgency).toBe(UrgencyLevel.EMERGENCY);
    });

    it('should handle ambiguous requests', () => {
      const classification = classifyWithFallback('My sink is leaking and lights are flickering');

      // Should pick the most likely one but with lower confidence
      expect([ServiceType.PLUMBING, ServiceType.ELECTRICAL]).toContain(
        classification.service_type as any
      );
      expect(classification.confidence).toBeLessThan(0.9);
    });

    it('should provide reasoning for classification', () => {
      const classification = classifyWithFallback('Need a new lock installed');

      expect(classification.reasoning).toBeDefined();
      expect(classification.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('Task 2.1.3: Caching & Cost Optimization', () => {
    it('should initialize cache', async () => {
      const cache = initializeCache();
      expect(cache).toBeDefined();
    });

    it('should generate consistent cache keys', () => {
      const key1 = generateClassificationCacheKey('plumbing', 'My sink is leaking');
      const key2 = generateClassificationCacheKey('plumbing', 'My sink is leaking');

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different inputs', () => {
      const key1 = generateClassificationCacheKey('plumbing', 'My sink is leaking');
      const key2 = generateClassificationCacheKey('plumbing', 'My lights are flickering');

      expect(key1).not.toBe(key2);
    });

    it('should cache classification results', async () => {
      const result1 = await withClassificationCache('test', 'Test message', async () => ({
        service_type: 'plumbing',
        urgency: 'medium',
        confidence: 0.8,
        reasoning: 'Test classification',
        estimated_duration_minutes: 60,
      }));

      expect(result1.fromCache).toBe(false);

      // Second call should hit cache
      const result2 = await withClassificationCache('test', 'Test message', async () => ({
        service_type: 'electrical', // This shouldn't be returned
        urgency: 'low',
        confidence: 0.5,
        reasoning: 'Different',
        estimated_duration_minutes: 30,
      }));

      expect(result2.fromCache).toBe(true);
      expect(result2.service_type).toBe('plumbing'); // From cache
    });

    it('should provide cache statistics', async () => {
      const stats = await (await getCache()).getStats();
      expect(stats).toBeDefined();
      expect(stats.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Task 2.1.4: Classification Fallback & Error Handling', () => {
    it('should classify with fallback when LLM unavailable', async () => {
      const classification = classifyWithFallback('I need a plumber for my leaking sink');

      expect(classification.service_type).toBeDefined();
      expect(classification.urgency).toBeDefined();
      expect(classification.confidence).toBeGreaterThan(0);
    });

    it('should detect strong fallback signals', () => {
      const strongSignal = classifyWithFallback('Water leaking from pipe, need drain cleaning');
      expect(strongSignal.confidence).toBeGreaterThan(0.6);
    });

    it('should classify errors correctly', () => {
      const timeoutError = new Error('Request timeout');
      const classified = classifyError(timeoutError);

      expect(classified.code).toBe('TIMEOUT');
      expect(classified.retryable).toBe(true);
      expect(classified.shouldFallback).toBe(true);
    });

    it('should identify rate limit errors', () => {
      const rateLimitError = new Error('429 Rate limit exceeded');
      const classified = classifyError(rateLimitError);

      expect(classified.code).toBe('RATE_LIMITED');
      expect(classified.retryable).toBe(true);
    });

    it('should identify authentication errors', () => {
      const authError = new Error('401 Unauthorized');
      const classified = classifyError(authError);

      expect(classified.code).toBe('LLM_API_ERROR');
      expect(classified.retryable).toBe(false);
    });

    it('should implement circuit breaker pattern', () => {
      const breaker = new CircuitBreaker(3, 1000);

      expect(breaker.getState()).toBe('closed');

      // Record failures
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();

      expect(breaker.getState()).toBe('open');
      expect(breaker.isOpen()).toBe(true);
    });

    it('should recover from open circuit breaker', async () => {
      const breaker = new CircuitBreaker(1, 100);

      breaker.recordFailure();
      expect(breaker.getState()).toBe('open');

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(breaker.getState()).toBe('half-open');

      // Record success to close circuit
      breaker.recordSuccess();
      expect(breaker.getState()).toBe('closed');
    });
  });

  describe('Task 2.1.5: Telemetry & Performance Monitoring', () => {
    it('should record classification metrics', () => {
      clearMetrics();

      const classification = {
        service_type: 'plumbing',
        urgency: 'high' as const,
        confidence: 0.9,
        reasoning: 'Test',
        estimated_duration_minutes: 60,
      };

      const metric = createMetricFromClassification(classification, {
        latencyMs: 150,
        tokensUsed: 250,
        costUsd: 0.001,
        modelUsed: 'claude-sonnet-4-5',
      });

      recordClassificationMetric(metric);

      expect(metric.latencyMs).toBe(150);
      expect(metric.tokensUsed).toBe(250);
      expect(metric.costUsd).toBe(0.001);
    });

    it('should generate metrics snapshot', () => {
      clearMetrics();

      // Record some metrics
      for (let i = 0; i < 5; i += 1) {
        const metric = createMetricFromClassification(
          {
            service_type: 'plumbing',
            urgency: 'medium',
            confidence: 0.85,
            reasoning: 'Test',
            estimated_duration_minutes: 60,
          },
          {
            latencyMs: 100 + i * 10,
            tokensUsed: 200 + i * 10,
            costUsd: 0.001 + i * 0.0001,
            modelUsed: 'claude-sonnet-4-5',
          }
        );
        recordClassificationMetric(metric);
      }

      const snapshot = getMetricsSnapshot();

      expect(snapshot.totalRequests).toBe(5);
      expect(snapshot.successfulClassifications).toBe(5);
      expect(snapshot.failedClassifications).toBe(0);
      expect(snapshot.successRate).toBe(100);
      expect(snapshot.averageLatencyMs).toBeGreaterThan(0);
      expect(snapshot.totalCostUsd).toBeGreaterThan(0);
    });

    it('should calculate cache savings', () => {
      clearMetrics();

      // Record cached and non-cached metrics
      for (let i = 0; i < 10; i += 1) {
        const metric = createMetricFromClassification(
          {
            service_type: 'plumbing',
            urgency: 'low',
            confidence: 0.8,
            reasoning: 'Test',
            estimated_duration_minutes: 60,
          },
          {
            latencyMs: 50,
            tokensUsed: 0,
            costUsd: i < 7 ? 0 : 0.001, // 7 cached, 3 not cached
            modelUsed: i < 7 ? 'cache' : 'claude-sonnet-4-5',
          }
        );
        metric.fromCache = i < 7;
        recordClassificationMetric(metric);
      }

      const savings = calculateCacheSavings();
      expect(savings.cachedRequests).toBe(7);
      expect(savings.estimatedCostSaved).toBeGreaterThanOrEqual(0);
    });

    it('should format metrics report', () => {
      clearMetrics();

      for (let i = 0; i < 3; i += 1) {
        const metric = createMetricFromClassification(
          {
            service_type: 'plumbing',
            urgency: 'high',
            confidence: 0.9,
            reasoning: 'Test',
            estimated_duration_minutes: 60,
          },
          {
            latencyMs: 100,
            tokensUsed: 200,
            costUsd: 0.001,
            modelUsed: 'claude-sonnet-4-5',
          }
        );
        recordClassificationMetric(metric);
      }

      const snapshot = getMetricsSnapshot();
      const report = formatMetricsReport(snapshot);

      expect(report).toContain('CLASSIFICATION METRICS REPORT');
      expect(report).toContain('Total Requests: 3');
      expect(report).toContain('Successful');
      expect(report).toContain('Cache Performance');
    });

    it('should track service type distribution', () => {
      clearMetrics();

      const services = ['plumbing', 'electrical', 'plumbing', 'hvac', 'plumbing'];
      for (const service of services) {
        const metric = createMetricFromClassification(
          {
            service_type: service as any,
            urgency: 'low',
            confidence: 0.8,
            reasoning: 'Test',
            estimated_duration_minutes: 60,
          },
          {
            latencyMs: 100,
            tokensUsed: 200,
            costUsd: 0.001,
            modelUsed: 'test',
          }
        );
        recordClassificationMetric(metric);
      }

      const snapshot = getMetricsSnapshot();
      expect(snapshot.topServiceTypes.length).toBeGreaterThan(0);
      expect(snapshot.topServiceTypes[0].service).toBe('plumbing'); // Most common
      expect(snapshot.topServiceTypes[0].count).toBe(3);
    });
  });

  describe('Integration: Full Classification Pipeline', () => {
    it('should classify request end-to-end with all components', async () => {
      clearMetrics();

      // Use the complete classification function
      const result = await classifyServiceRequest('My bathroom is flooding with water everywhere!', {
        useCache: true,
        useFallback: true,
        includeExamples: true,
      });

      expect(result.classification).toBeDefined();
      expect(result.classification.service_type).toBeDefined();
      expect(result.classification.urgency).toBe(UrgencyLevel.EMERGENCY);
      expect(result.metadata.source).toBeDefined();
      expect(result.metadata.latencyMs).toBeGreaterThanOrEqual(0);

      // Verify metrics were recorded
      const snapshot = getMetricsSnapshot();
      expect(snapshot.totalRequests).toBeGreaterThan(0);
    });

    it('should hit cache on repeated request', async () => {
      clearMetrics();
      const message = 'Unique test message for caching 12345';

      const first = await classifyServiceRequest(message, {
        useCache: true,
        useFallback: false,
      });

      const second = await classifyServiceRequest(message, {
        useCache: true,
        useFallback: false,
      });

      // Second call should be much faster and from cache
      expect(second.metadata.latencyMs).toBeLessThan(first.metadata.latencyMs);

      const snapshot = getMetricsSnapshot();
      expect(snapshot.cacheHitRate).toBeGreaterThan(0);
    });

    it('should provide detailed classification metadata', async () => {
      const result = await classifyServiceRequest('I need electrical work', {
        useCache: false,
      });

      expect(result.metadata.source).toBeDefined();
      expect(result.metadata.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.tokensUsed).toBeGreaterThanOrEqual(0);
      expect(result.metadata.costUsd).toBeGreaterThanOrEqual(0);
      expect(result.metadata.model).toBeDefined();
    });
  });
});
