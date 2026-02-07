/**
 * Telemetry Module Exports
 * Metrics tracking for classification and performance monitoring
 */

export {
  getMetricsStore,
  createMetricFromClassification,
  createFailedMetric,
  recordClassificationMetric,
  getMetricsSnapshot,
  getAllMetrics,
  clearMetrics,
  getMetricsForTimeRange,
  getMetricsForService,
  calculateCacheSavings,
  formatMetricsReport,
  type ClassificationMetric,
  type MetricsSnapshot,
} from './classification-metrics';
