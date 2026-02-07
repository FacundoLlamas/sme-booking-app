/**
 * Standardized API Response Utilities
 * Ensures all API responses follow a consistent format
 */

import { NextResponse } from 'next/server';

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  meta?: SuccessResponse['meta']
): SuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(meta && { meta }),
  };
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  code: string,
  message: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Create a Next.js Response with success data
 */
export function apiSuccess<T>(
  data: T,
  statusOrMeta?: number | SuccessResponse['meta'],
  meta?: SuccessResponse['meta']
) {
  if (typeof statusOrMeta === 'number') {
    return NextResponse.json(successResponse(data, meta), { status: statusOrMeta });
  }
  return NextResponse.json(successResponse(data, statusOrMeta), { status: 200 });
}

/**
 * Create a Next.js Response with error data
 */
export function apiError(
  code: string,
  message: string,
  status: number = 500,
  details?: any
) {
  return NextResponse.json(errorResponse(code, message, details), { status });
}

/**
 * Pagination metadata helper
 */
export function paginationMeta(
  page: number,
  limit: number,
  total: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}
