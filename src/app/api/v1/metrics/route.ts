import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/request-context';

interface MetricsData {
  uptime: number;
  memory: NodeJS.MemoryUsage;
  requests: {
    total: number;
    errors: number;
    avgResponseTime: number;
  };
  database: {
    poolSize: number;
    activeConnections: number;
  };
}

// In-memory metrics (replace with proper metrics service for production)
const metrics = {
  requestCount: 0,
  errorCount: 0,
  totalResponseTime: 0,
  startTime: Date.now(),
};

export function recordMetric(duration: number, isError: boolean = false) {
  metrics.requestCount++;
  if (isError) metrics.errorCount++;
  metrics.totalResponseTime += duration;
}

export async function GET(_request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Metrics not available in production', { status: 403 });
  }

  const uptime = Date.now() - metrics.startTime;
  const memory = process.memoryUsage();
  const avgResponseTime = metrics.requestCount > 0 
    ? metrics.totalResponseTime / metrics.requestCount 
    : 0;

  const metricsData: MetricsData = {
    uptime,
    memory: {
      rss: Math.round(memory.rss / 1024 / 1024),  // MB
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
      external: Math.round(memory.external / 1024 / 1024),
    } as any,
    requests: {
      total: metrics.requestCount,
      errors: metrics.errorCount,
      avgResponseTime: Math.round(avgResponseTime),
    },
    database: {
      poolSize: 5,  // Placeholder
      activeConnections: 1,  // Placeholder
    },
  };

  return NextResponse.json(
    {
      success: true,
      data: metricsData,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
