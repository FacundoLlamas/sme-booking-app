/**
 * Global Error Handler Middleware
 * Catches all errors and returns standardized responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiError, isOperationalError } from '../errors';
import { errorResponse } from '../api-response';
import { logError } from '../logger';
import { ZodError } from 'zod';

/**
 * Handle API errors and return standardized response
 */
export function handleApiError(error: Error | ApiError, req?: NextRequest): NextResponse {
  // Log the error
  logError(error, {
    path: req?.nextUrl.pathname,
    method: req?.method,
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      errorResponse(
        'VALIDATION_ERROR',
        'Request validation failed',
        {
          issues: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        }
      ),
      { status: 422 }
    );
  }

  // Handle our custom ApiError
  if (error instanceof ApiError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  // Handle unexpected errors (non-operational)
  if (!isOperationalError(error)) {
    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    return NextResponse.json(
      errorResponse(
        'INTERNAL_ERROR',
        isDevelopment ? error.message : 'An unexpected error occurred',
        isDevelopment ? { stack: error.stack } : undefined
      ),
      { status: 500 }
    );
  }

  // Default error response
  return NextResponse.json(
    errorResponse('INTERNAL_ERROR', error.message),
    { status: 500 }
  );
}

/**
 * Async error handler wrapper for route handlers
 */
export function asyncHandler<T>(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error as Error, req);
    }
  };
}

/**
 * Error boundary for API routes
 */
export function withErrorHandler<T>(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse<T>> | NextResponse<T>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const result = handler(req, context);
      if (result instanceof Promise) {
        return await result;
      }
      return result;
    } catch (error) {
      return handleApiError(error as Error, req);
    }
  };
}
