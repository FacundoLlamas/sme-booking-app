/**
 * Server Monitoring and Performance Tracking
 * Monitors API requests, database queries, and error rates
 */

import { captureServerError, trackSlowRequest, trackErrorRate } from "../../sentry.server.config";
import { getLogger } from "../logger";

const logger = getLogger("monitoring:server");

/**
 * Request metrics storage (in-memory, reset on app restart)
 * For production, use Redis or a monitoring service
 */
interface RequestMetrics {
  totalRequests: number;
  totalErrors: number;
  totalDuration: number;
  slowRequests: number;
  averageResponseTime: number;
}

const metrics: Record<string, RequestMetrics> = {};

/**
 * Track API request performance
 */
export function trackRequestMetrics(
  endpoint: string,
  method: string,
  statusCode: number,
  durationMs: number,
  error?: Error
) {
  const key = `${method} ${endpoint}`;

  if (!metrics[key]) {
    metrics[key] = {
      totalRequests: 0,
      totalErrors: 0,
      totalDuration: 0,
      slowRequests: 0,
      averageResponseTime: 0,
    };
  }

  const metric = metrics[key];
  metric.totalRequests++;
  metric.totalDuration += durationMs;
  metric.averageResponseTime = metric.totalDuration / metric.totalRequests;

  // Track slow requests
  if (durationMs > 300) {
    metric.slowRequests++;
    trackSlowRequest(endpoint, durationMs, statusCode);
  }

  // Track errors
  if (statusCode >= 400) {
    metric.totalErrors++;

    if (error) {
      captureServerError(error, {
        endpoint,
        method,
        statusCode,
        durationMs,
      });
    }

    // Check error rate
    const errorRate = (metric.totalErrors / metric.totalRequests) * 100;
    if (errorRate > 1) {
      trackErrorRate(metric.totalRequests, metric.totalErrors);
    }
  }

  logger.info({
    msg: "Request completed",
    endpoint,
    method,
    statusCode,
    durationMs,
    averageResponseTime: metric.averageResponseTime,
  });
}

/**
 * Middleware to track request metrics
 */
export function createMetricsMiddleware() {
  return async (
    request: Request,
    context: any,
    handler: (req: Request) => Promise<Response>
  ): Promise<Response> => {
    const startTime = Date.now();
    const endpoint = new URL(request.url).pathname;
    const method = request.method;

    try {
      const response = await handler(request);
      const durationMs = Date.now() - startTime;

      trackRequestMetrics(endpoint, method, response.status, durationMs);

      return response;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      trackRequestMetrics(endpoint, method, 500, durationMs, err);

      throw error;
    }
  };
}

/**
 * Track database query performance
 */
export function trackDatabaseMetrics(
  query: string,
  durationMs: number,
  success: boolean,
  error?: Error
) {
  if (durationMs > 100) {
    logger.warn({
      msg: "Slow database query",
      query: query.substring(0, 100),
      durationMs,
      success,
    });
  }

  if (!success && error) {
    captureServerError(error, {
      query: query.substring(0, 200),
      durationMs,
    });
  }
}

/**
 * Get current metrics snapshot
 */
export function getMetricsSnapshot() {
  return {
    timestamp: new Date().toISOString(),
    endpoints: Object.entries(metrics).map(([endpoint, metric]) => ({
      endpoint,
      ...metric,
      errorRate: ((metric.totalErrors / metric.totalRequests) * 100).toFixed(2),
    })),
    summary: {
      totalEndpoints: Object.keys(metrics).length,
      totalRequests: Object.values(metrics).reduce((sum, m) => sum + m.totalRequests, 0),
      totalErrors: Object.values(metrics).reduce((sum, m) => sum + m.totalErrors, 0),
      averageResponseTime:
        Object.values(metrics).reduce((sum, m) => sum + m.averageResponseTime, 0) /
        Object.keys(metrics).length,
    },
  };
}

/**
 * Reset metrics (useful for testing)
 */
export function resetMetrics() {
  Object.keys(metrics).forEach((key) => delete metrics[key]);
}

/**
 * Health check endpoint data
 */
export async function getHealthCheckData() {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  return {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime),
      formatted: formatUptime(uptime),
    },
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    },
    metrics: getMetricsSnapshot(),
  };
}

/**
 * Format uptime duration
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

/**
 * Database connection monitoring
 */
export class DatabaseMonitor {
  private lastCheck: Date = new Date();
  private isHealthy: boolean = true;

  async checkConnection(prisma: any): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      this.isHealthy = true;
      this.lastCheck = new Date();
      return true;
    } catch (error) {
      this.isHealthy = false;
      this.lastCheck = new Date();

      if (error instanceof Error) {
        captureServerError(error, {
          component: "database_monitor",
        });
      }

      return false;
    }
  }

  getStatus() {
    return {
      healthy: this.isHealthy,
      lastCheck: this.lastCheck.toISOString(),
    };
  }
}

/**
 * Cache hit/miss monitoring
 */
export class CacheMonitor {
  private hits: number = 0;
  private misses: number = 0;

  recordHit() {
    this.hits++;
  }

  recordMiss() {
    this.misses++;
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      total,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(2) : "0",
    };
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
  }
}

/**
 * Queue monitoring
 */
export class QueueMonitor {
  private processed: number = 0;
  private failed: number = 0;
  private avgDuration: number = 0;
  private totalDuration: number = 0;

  recordProcessed(durationMs: number) {
    this.processed++;
    this.totalDuration += durationMs;
    this.avgDuration = this.totalDuration / this.processed;
  }

  recordFailed(durationMs: number) {
    this.failed++;
    this.totalDuration += durationMs;
  }

  getStats() {
    const total = this.processed + this.failed;
    return {
      processed: this.processed,
      failed: this.failed,
      total,
      successRate: total > 0 ? ((this.processed / total) * 100).toFixed(2) : "0",
      averageDuration: Math.round(this.avgDuration),
    };
  }

  reset() {
    this.processed = 0;
    this.failed = 0;
    this.avgDuration = 0;
    this.totalDuration = 0;
  }
}

// Export singleton monitors
export const databaseMonitor = new DatabaseMonitor();
export const cacheMonitor = new CacheMonitor();
export const queueMonitor = new QueueMonitor();
