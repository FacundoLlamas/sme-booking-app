/**
 * Structured Logging with Pino
 * Provides JSON-formatted logs with multiple outputs
 */

import pino from 'pino';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
  mkdir(logsDir, { recursive: true }).catch(console.error);
}

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Pino logger configuration
 * - Development: Pretty-printed to console
 * - Production: JSON to file and console
 */
// Validate log level
const VALID_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
const configuredLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');
const logLevel = VALID_LEVELS.includes(configuredLevel) ? configuredLevel : 'info';

const logger = pino({
  level: logLevel,

  // Format timestamp
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,

  // Base fields included in every log
  base: {
    env: process.env.NODE_ENV || 'development',
    pid: process.pid,
  },

  // Transport for pretty printing in development
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,
});

/**
 * Create a child logger with additional context
 */
export function createLogger(context: string | Record<string, any>) {
  if (typeof context === 'string') {
    return logger.child({ module: context });
  }
  return logger.child(context);
}

/**
 * Log an HTTP request
 */
export function logRequest(data: {
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}) {
  logger.info(data, 'HTTP Request');
}

/**
 * Log an error with stack trace
 */
export function logError(error: Error, context?: Record<string, any>) {
  logger.error(
    {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    },
    'Error occurred'
  );
}

/**
 * Log database query
 */
export function logQuery(query: string, duration?: number, error?: Error) {
  if (error) {
    logger.error(
      {
        query,
        duration,
        error: {
          message: error.message,
        },
      },
      'Database query failed'
    );
  } else {
    logger.debug(
      {
        query,
        duration,
      },
      'Database query'
    );
  }
}

/**
 * Log external API call
 */
export function logExternalCall(data: {
  service: string;
  endpoint: string;
  method: string;
  statusCode?: number;
  duration?: number;
  error?: Error;
}) {
  if (data.error) {
    logger.error(
      {
        ...data,
        error: {
          message: data.error.message,
        },
      },
      'External API call failed'
    );
  } else {
    logger.info(data, 'External API call');
  }
}

/**
 * Log application startup
 */
export function logStartup(port: number | string) {
  logger.info(
    {
      port,
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version,
    },
    'Application started'
  );
}

/**
 * Log application shutdown
 */
export function logShutdown(reason?: string) {
  logger.info({ reason }, 'Application shutting down');
}

export { logger };
export const getLogger = (context: string) => logger.child({ module: context });
export default logger;
