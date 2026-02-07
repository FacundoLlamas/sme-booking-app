/**
 * Custom Error Classes for API Error Handling
 * Provides standardized error types with proper HTTP status codes
 */

export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

export interface ErrorDetails {
  [key: string]: any;
}

/**
 * Base API Error Class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: ErrorDetails;
  public readonly timestamp: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    details?: ErrorDetails,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }
}

/**
 * Validation Error (422 Unprocessable Entity)
 * Used when request data fails validation
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 422, ErrorCode.VALIDATION_ERROR, details);
  }
}

/**
 * Authentication Error (401 Unauthorized)
 * Used when authentication fails or is missing
 */
export class AuthError extends ApiError {
  constructor(message: string = 'Authentication required', details?: ErrorDetails) {
    super(message, 401, ErrorCode.AUTH_ERROR, details);
  }
}

/**
 * Authorization Error (403 Forbidden)
 * Used when user doesn't have permission
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access forbidden', details?: ErrorDetails) {
    super(message, 403, ErrorCode.FORBIDDEN, details);
  }
}

/**
 * Not Found Error (404 Not Found)
 * Used when requested resource doesn't exist
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', details?: ErrorDetails) {
    super(message, 404, ErrorCode.NOT_FOUND, details);
  }
}

/**
 * Conflict Error (409 Conflict)
 * Used when request conflicts with current state (e.g., duplicate booking)
 */
export class ConflictError extends ApiError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 409, ErrorCode.CONFLICT, details);
  }
}

/**
 * Rate Limit Error (429 Too Many Requests)
 * Used when rate limit is exceeded
 */
export class RateLimitError extends ApiError {
  constructor(
    message: string = 'Rate limit exceeded',
    details?: ErrorDetails & { retryAfter?: number }
  ) {
    super(message, 429, ErrorCode.RATE_LIMIT, details);
  }
}

/**
 * Bad Request Error (400 Bad Request)
 * Used for general malformed requests
 */
export class BadRequestError extends ApiError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 400, ErrorCode.BAD_REQUEST, details);
  }
}

/**
 * Database Error (500 Internal Server Error)
 * Used when database operations fail
 */
export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed', details?: ErrorDetails) {
    super(message, 500, ErrorCode.DATABASE_ERROR, details, false);
  }
}

/**
 * External Service Error (502 Bad Gateway)
 * Used when external API/service calls fail
 */
export class ExternalServiceError extends ApiError {
  constructor(
    message: string = 'External service unavailable',
    details?: ErrorDetails
  ) {
    super(message, 502, ErrorCode.EXTERNAL_SERVICE_ERROR, details, false);
  }
}

/**
 * Helper to check if error is an operational error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof ApiError) {
    return error.isOperational;
  }
  return false;
}
