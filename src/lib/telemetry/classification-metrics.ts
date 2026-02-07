/**
 * Classification Metrics & Telemetry
 * Tracks LLM classification performance, costs, and cache effectiveness
 */

import { createLogger } from '@/lib/logger';
import { ServiceClassification } from '@/lib/classification/validator';

const logger = createLogger('telemetry:classification');

export interface ClassificationMetric {
  id: string;
  timestamp: Date;
  serviceType: string;
  urgency: string;
  confidence: number;
  estimatedDurationMinutes: number;
  latencyMs: number;
  tokensUsed: number;
  costUsd: number;
  fromCache: boolean;
  fromFallback: boolean;
  modelUsed: string;
  success: boolean;
  errorCode?: string;
}

export interface MetricsSnapshot {
  totalRequests: number;
  successfulClassifications: number;
  failedClassifications: number;
  cacheHitRate: number;
  fallbackUsageRate: number;
  averageLatencyMs: number;
  averageTokensPerRequest: number;
  totalCostUsd: number;
  costPerClassification: number;
  successRate: number;
  averageConfidenceScore: number;
  topServiceTypes: Array<{ service: string; count: number }>;
  topUrgencyLevels: Array<{ urgency: string; count: number }>;
}

/**
 * In-memory metrics store
 */
class MetricsStore {
  private metrics: ClassificationMetric[] = [];
  private readonly maxMetrics = 10000;

  /**
   * Record a classification metric
   */
  recordMetric(metric: ClassificationMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics to avoid memory bloat
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    logger.debug(`Recorded metric: ${metric.serviceType} (${metric.latencyMs}ms, ${metric.costUsd} USD)`);
  }

  /**
   * Get all metrics (for batch processing)
   */
  getMetrics(): ClassificationMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics snapshot for reporting
   */
  getSnapshot(): MetricsSnapshot {
    if (this.metrics.length === 0) {
      return getEmptySnapshot();
    }

    const successful = this.metrics.filter((m) => m.success);
    const fromCache = this.metrics.filter((m) => m.fromCache);
    const fromFallback = this.metrics.filter((m) => m.fromFallback);

    // Calculate averages
    const avgLatency = successful.length > 0
      ? successful.reduce((sum, m) => sum + m.latencyMs, 0) / successful.length
      : 0;

    const avgTokens = this.metrics.length > 0
      ? this.metrics.reduce((sum, m) => sum + m.tokensUsed, 0) / this.metrics.length
      : 0;

    const totalCost = this.metrics.reduce((sum, m) => sum + m.costUsd, 0);

    const costPerClassification = this.metrics.length > 0 ? totalCost / this.metrics.length : 0;

    // Service type distribution
    const serviceTypeCounts = this.getDistribution('serviceType');
    const topServiceTypes = Object.entries(serviceTypeCounts)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count);

    // Urgency distribution
    const urgencyCounts = this.getDistribution('urgency');
    const topUrgencyLevels = Object.entries(urgencyCounts)
      .map(([urgency, count]) => ({ urgency, count }))
      .sort((a, b) => b.count - a.count);

    // Confidence average
    const avgConfidence = this.metrics.length > 0
      ? this.metrics.reduce((sum, m) => sum + m.confidence, 0) / this.metrics.length
      : 0;

    return {
      totalRequests: this.metrics.length,
      successfulClassifications: successful.length,
      failedClassifications: this.metrics.length - successful.length,
      cacheHitRate: this.metrics.length > 0 ? (fromCache.length / this.metrics.length) * 100 : 0,
      fallbackUsageRate: this.metrics.length > 0 ? (fromFallback.length / this.metrics.length) * 100 : 0,
      averageLatencyMs: Math.round(avgLatency),
      averageTokensPerRequest: Math.round(avgTokens),
      totalCostUsd: Math.round(totalCost * 10000) / 10000, // 4 decimal places
      costPerClassification: Math.round(costPerClassification * 10000) / 10000,
      successRate: (successful.length / this.metrics.length) * 100,
      averageConfidenceScore: Math.round(avgConfidence * 1000) / 1000,
      topServiceTypes: topServiceTypes.slice(0, 5),
      topUrgencyLevels: topUrgencyLevels.slice(0, 4),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    logger.info('Metrics cleared');
  }

  /**
   * Get distribution of a field
   */
  private getDistribution(field: keyof ClassificationMetric): Record<string, number> {
    const distribution: Record<string, number> = {};
    for (const metric of this.metrics) {
      const value = String(metric[field]);
      distribution[value] = (distribution[value] || 0) + 1;
    }
    return distribution;
  }
}

/**
 * Global metrics store instance
 */
let metricsStore: MetricsStore | null = null;

/**
 * Get or initialize metrics store
 */
export function getMetricsStore(): MetricsStore {
  if (!metricsStore) {
    metricsStore = new MetricsStore();
  }
  return metricsStore;
}

/**
 * Create a metric from classification result
 */
export function createMetricFromClassification(
  classification: ServiceClassification & { fromCache?: boolean },
  options: {
    latencyMs: number;
    tokensUsed: number;
    costUsd: number;
    modelUsed?: string;
    fromFallback?: boolean;
  }
): ClassificationMetric {
  return {
    id: `metric_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: new Date(),
    serviceType: classification.service_type,
    urgency: classification.urgency,
    confidence: classification.confidence,
    estimatedDurationMinutes: classification.estimated_duration_minutes,
    latencyMs: options.latencyMs,
    tokensUsed: options.tokensUsed,
    costUsd: options.costUsd,
    fromCache: classification.fromCache || false,
    fromFallback: options.fromFallback || false,
    modelUsed: options.modelUsed || 'unknown',
    success: true,
    errorCode: undefined,
  };
}

/**
 * Create a failed metric
 */
export function createFailedMetric(
  serviceType: string,
  options: {
    latencyMs: number;
    tokensUsed: number;
    costUsd: number;
    errorCode: string;
    modelUsed?: string;
  }
): ClassificationMetric {
  return {
    id: `metric_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: new Date(),
    serviceType,
    urgency: 'unknown',
    confidence: 0,
    estimatedDurationMinutes: 0,
    latencyMs: options.latencyMs,
    tokensUsed: options.tokensUsed,
    costUsd: options.costUsd,
    fromCache: false,
    fromFallback: false,
    modelUsed: options.modelUsed || 'unknown',
    success: false,
    errorCode: options.errorCode,
  };
}

/**
 * Record a classification metric
 */
export function recordClassificationMetric(metric: ClassificationMetric): void {
  const store = getMetricsStore();
  store.recordMetric(metric);

  // Log important metrics
  if (!metric.success) {
    logger.error(`Classification failed: ${metric.errorCode} (${metric.latencyMs}ms)`);
  }
}

/**
 * Get metrics snapshot
 */
export function getMetricsSnapshot(): MetricsSnapshot {
  const store = getMetricsStore();
  return store.getSnapshot();
}

/**
 * Get all metrics
 */
export function getAllMetrics(): ClassificationMetric[] {
  const store = getMetricsStore();
  return store.getMetrics();
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  const store = getMetricsStore();
  store.clear();
}

/**
 * Get metrics for a specific time range
 */
export function getMetricsForTimeRange(
  startTime: Date,
  endTime: Date
): ClassificationMetric[] {
  const store = getMetricsStore();
  return store
    .getMetrics()
    .filter((m) => m.timestamp >= startTime && m.timestamp <= endTime);
}

/**
 * Get metrics for a specific service type
 */
export function getMetricsForService(serviceType: string): ClassificationMetric[] {
  const store = getMetricsStore();
  return store.getMetrics().filter((m) => m.serviceType === serviceType);
}

/**
 * Calculate cost savings from caching
 */
export function calculateCacheSavings(): {
  cachedRequests: number;
  estimatedCostSaved: number;
  cacheEfficiency: string;
} {
  const snapshot = getMetricsSnapshot();
  const cachedRequests = Math.round(
    snapshot.totalRequests * (snapshot.cacheHitRate / 100)
  );
  const costPerRequest = snapshot.costPerClassification;
  const estimatedCostSaved = cachedRequests * costPerRequest;

  return {
    cachedRequests,
    estimatedCostSaved: Math.round(estimatedCostSaved * 10000) / 10000,
    cacheEfficiency: `${snapshot.cacheHitRate.toFixed(1)}% hit rate saved ${estimatedCostSaved.toFixed(4)} USD`,
  };
}

/**
 * Get empty snapshot (for initialization)
 */
function getEmptySnapshot(): MetricsSnapshot {
  return {
    totalRequests: 0,
    successfulClassifications: 0,
    failedClassifications: 0,
    cacheHitRate: 0,
    fallbackUsageRate: 0,
    averageLatencyMs: 0,
    averageTokensPerRequest: 0,
    totalCostUsd: 0,
    costPerClassification: 0,
    successRate: 0,
    averageConfidenceScore: 0,
    topServiceTypes: [],
    topUrgencyLevels: [],
  };
}

/**
 * Format metrics for logging/reporting
 */
export function formatMetricsReport(snapshot: MetricsSnapshot): string {
  const lines = [
    '=== CLASSIFICATION METRICS REPORT ===',
    `Total Requests: ${snapshot.totalRequests}`,
    `Successful: ${snapshot.successfulClassifications} (${snapshot.successRate.toFixed(1)}%)`,
    `Failed: ${snapshot.failedClassifications}`,
    ``,
    `Cache Performance:`,
    `  Hit Rate: ${snapshot.cacheHitRate.toFixed(1)}%`,
    `  Fallback Usage: ${snapshot.fallbackUsageRate.toFixed(1)}%`,
    ``,
    `Performance:`,
    `  Avg Latency: ${snapshot.averageLatencyMs}ms`,
    `  Avg Confidence: ${(snapshot.averageConfidenceScore * 100).toFixed(1)}%`,
    `  Avg Tokens/Request: ${snapshot.averageTokensPerRequest}`,
    ``,
    `Cost:`,
    `  Total Cost: $${snapshot.totalCostUsd.toFixed(4)}`,
    `  Cost/Classification: $${snapshot.costPerClassification.toFixed(6)}`,
    ``,
    `Top Services:`,
    ...snapshot.topServiceTypes.map((s) => `  - ${s.service}: ${s.count}`),
    ``,
    `Top Urgency Levels:`,
    ...snapshot.topUrgencyLevels.map((u) => `  - ${u.urgency}: ${u.count}`),
  ];

  return lines.join('\n');
}
