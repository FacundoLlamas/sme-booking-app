/**
 * Health Check Endpoint (v1)
 * GET /api/v1/health
 * Returns system health status with dependency checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeServer } from '@/lib/init-server';
import { getNotificationSystemStatus } from '@/lib/notifications/init';

export async function GET(_request: NextRequest) {
  const startTime = Date.now();
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {},
  };

  // Initialize server on first health check
  try {
    await initializeServer();
  } catch (error) {
    console.error('[Health] Server initialization failed:', error);
  }

  // Database check
  try {
    // TODO: Uncomment when Prisma is configured
    // const { PrismaClient } = await import('@prisma/client');
    // const prisma = new PrismaClient();
    // await prisma.$queryRaw`SELECT 1`;
    // health.checks.database = { status: 'ok', responseTime: Date.now() - startTime };
    
    // Placeholder for now
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

  // Notification system check
  try {
    const notifStatus = getNotificationSystemStatus();
    health.checks.notifications = {
      status: notifStatus.isInitialized ? 'ok' : 'initializing',
      queueProcessor: notifStatus.queueProcessorActive,
      reminderCron: notifStatus.reminderCronActive,
    };
  } catch (error) {
    health.checks.notifications = { status: 'error', error: String(error) };
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  
  return NextResponse.json(
    {
      success: true,
      data: health,
    },
    { status: statusCode }
  );
}
