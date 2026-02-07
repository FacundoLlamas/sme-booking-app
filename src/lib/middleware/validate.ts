/**
 * Validation Middleware
 * Validates request body/query against Zod schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { errorResponse } from '../api-response';

/**
 * Validate request body middleware factory
 */
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (req: NextRequest): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> => {
    try {
      const body = await req.json().catch(() => ({}));
      const data = await schema.parseAsync(body);
      return { data, error: null };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          data: null,
          error: NextResponse.json(
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
          ),
        };
      }
      
      return {
        data: null,
        error: NextResponse.json(
          errorResponse('BAD_REQUEST', 'Invalid request body'),
          { status: 400 }
        ),
      };
    }
  };
}

/**
 * Validate query parameters middleware factory
 */
export function validateQueryParams<T>(schema: z.ZodSchema<T>) {
  return (req: NextRequest): { data: T; error: null } | { data: null; error: NextResponse } => {
    try {
      const params: Record<string, string> = {};
      req.nextUrl.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      
      const data = schema.parse(params);
      return { data, error: null };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          data: null,
          error: NextResponse.json(
            errorResponse(
              'VALIDATION_ERROR',
              'Query parameter validation failed',
              {
                issues: error.errors.map((err) => ({
                  field: err.path.join('.'),
                  message: err.message,
                  code: err.code,
                })),
              }
            ),
            { status: 422 }
          ),
        };
      }
      
      return {
        data: null,
        error: NextResponse.json(
          errorResponse('BAD_REQUEST', 'Invalid query parameters'),
          { status: 400 }
        ),
      };
    }
  };
}

/**
 * Example usage in route handler:
 * 
 * import { validateRequest } from '@/lib/middleware/validate';
 * import { CreateBookingDtoSchema } from '@/lib/validation';
 * 
 * export async function POST(req: NextRequest) {
 *   const validator = validateRequest(CreateBookingDtoSchema);
 *   const { data, error } = await validator(req);
 *   
 *   if (error) return error;
 *   
 *   // data is now type-safe and validated
 *   const booking = await createBooking(data);
 *   return apiSuccess(booking);
 * }
 */
