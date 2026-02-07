/**
 * Rate Limiting Middleware for Chat Endpoints
 * 
 * Provides per-IP and per-customer_id rate limiting for chat endpoints.
 * - 100 requests per IP per minute
 * - 50 requests per customer_id per minute
 * 
 * Returns 429 (Too Many Requests) when limits exceeded with Retry-After header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { MemoryRateLimitStore } from '@/lib/rate-limit/store';
import { logger } from '@/lib/logger';

// Initialize in-memory rate limit store
const rateLimitStore = new MemoryRateLimitStore();

// Rate limit configuration (in milliseconds)
const RATE_LIMITS = {
  IP: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute per IP
  CUSTOMER: { limit: 50, windowMs: 60 * 1000 }, // 50 requests per minute per customer_id
};

/**
 * Extract client IP from request
 * Handles various proxy headers and direct IPs
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const real = request.headers.get('x-real-ip');
  if (real) {
    return real;
  }
  
  // Fallback to 'unknown' if IP can't be determined
  return 'unknown';
}

/**
 * Check rate limits for both IP and customer_id
 */
export async function checkRateLimits(
  request: NextRequest,
  customerId?: number
): Promise<{
  allowed: boolean;
  response?: NextResponse;
}> {
  const clientIp = getClientIp(request);
  const correlationId = request.headers.get('x-correlation-id') || 'unknown';

  // Check IP-based rate limit
  const ipKey = `rate-limit:ip:${clientIp}`;
  const ipResult = await rateLimitStore.check(
    ipKey,
    RATE_LIMITS.IP.limit,
    RATE_LIMITS.IP.windowMs
  );

  if (!ipResult.allowed) {
    logger.warn('[RATE LIMIT] IP limit exceeded', {
      correlationId,
      clientIp,
      retryAfter: ipResult.retryAfter,
    });

    return {
      allowed: false,
      response: new NextResponse(
        JSON.stringify({
          status: 'error',
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: ipResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Retry-After': String(ipResult.retryAfter || 60),
            'Content-Type': 'application/json',
          },
        }
      ),
    };
  }

  // Check customer-based rate limit (if customer_id provided)
  if (customerId) {
    const customerKey = `rate-limit:customer:${customerId}`;
    const customerResult = await rateLimitStore.check(
      customerKey,
      RATE_LIMITS.CUSTOMER.limit,
      RATE_LIMITS.CUSTOMER.windowMs
    );

    if (!customerResult.allowed) {
      logger.warn('[RATE LIMIT] Customer limit exceeded', {
        correlationId,
        customerId,
        retryAfter: customerResult.retryAfter,
      });

      return {
        allowed: false,
        response: new NextResponse(
          JSON.stringify({
            status: 'error',
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'You have made too many requests. Please try again later.',
            retryAfter: customerResult.retryAfter,
          }),
          {
            status: 429,
            headers: {
              'Retry-After': String(customerResult.retryAfter || 60),
              'Content-Type': 'application/json',
            },
          }
        ),
      };
    }
  }

  return { allowed: true };
}
