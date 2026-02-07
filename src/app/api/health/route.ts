/**
 * Health Check Endpoint (Legacy)
 * GET /api/health
 * DEPRECATED: Use /api/v1/health instead
 * This endpoint maintained for backward compatibility
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {},
  };

  // Database check
  try {
    // TODO: Uncomment when Prisma is configured
    // const { PrismaClient } = await import('@prisma/client');
    // const prisma = new PrismaClient();
    // await prisma.$queryRaw`SELECT 1`;
    // health.checks.database = { status: 'ok', responseTime: Date.now() - startTime };
    
    health.checks.database = { status: 'not_configured', message: 'Database not yet configured' };
  } catch (error) {
    health.status = 'degraded';
    health.checks.database = { status: 'error', error: String(error) };
  }

  // Redis check (if configured)
  if (process.env.REDIS_URL) {
    try {
      // TODO: Uncomment when Redis is configured
      // const redis = await getRedisClient();
      // await redis.ping();
      // health.checks.redis = { status: 'ok' };
      
      health.checks.redis = { status: 'not_configured', message: 'Redis configured but client not initialized' };
    } catch (error) {
      health.status = 'degraded';
      health.checks.redis = { status: 'error', error: String(error) };
    }
  } else {
    health.checks.redis = { status: 'skipped', message: 'Redis not configured' };
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  
  return NextResponse.json(
    {
      success: true,
      data: health,
    },
    { 
      status: statusCode,
      headers: {
        'X-API-Deprecated': 'true',
        'X-API-Deprecated-Message': 'Use /api/v1/health instead',
      }
    }
  );
}
