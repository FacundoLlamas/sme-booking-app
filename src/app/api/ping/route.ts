/**
 * Ping Endpoint
 * GET /api/ping
 * Simple connectivity test
 */

import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api-response';
import { withErrorHandler } from '@/lib/middleware/error-handler';

async function handler(_req: NextRequest) {
  return apiSuccess({
    pong: true,
    timestamp: new Date().toISOString(),
  });
}

export const GET = withErrorHandler(handler);
