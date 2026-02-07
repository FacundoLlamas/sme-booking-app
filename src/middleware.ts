/**
 * Next.js Middleware (Simplified for Edge Runtime)
 * Runs on all requests before they reach route handlers
 * Handles: CORS, Correlation IDs
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Get client IP address
 */
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Main middleware function
 */
export function middleware(req: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-ID');
    response.headers.set('X-Correlation-ID', correlationId);
    return response;
  }

  // Get client IP
  const clientIp = getClientIp(req);

  // Clone the request to add custom headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-request-id', requestId);
  requestHeaders.set('x-client-ip', clientIp);
  requestHeaders.set('x-correlation-id', correlationId);

  // Continue with the request
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add CORS and custom headers to response
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('X-Correlation-ID', correlationId);
  response.headers.set('X-Request-ID', requestId);
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);

  return response;
}

/**
 * Middleware configuration
 * Match API routes and exclude static files
 */
export const config = {
  matcher: ['/api/:path*'],
};
