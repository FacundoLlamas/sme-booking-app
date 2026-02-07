/**
 * Sentry Server-Side Configuration
 * Captures server-side errors, performance metrics, and API latency
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Initialize Sentry for server-side error tracking
 * This captures:
 * - Unhandled server exceptions
 * - API errors
 * - Database errors
 * - Server performance metrics
 * - Slow API requests
 */
export function initServerSentry() {
  const isDev = process.env.NODE_ENV === "development";
  const dsn = process.env.SENTRY_DSN;

  if (!dsn && !isDev) {
    console.warn("Sentry DSN not configured for production");
    return;
  }

  Sentry.init({
    // Environment
    environment: process.env.NODE_ENV,
    dsn: dsn || "https://examplePublicKey@o0.ingest.sentry.io/0",

    // Release tracking
    release: process.env.APP_VERSION || "0.1.0",

    // Performance monitoring
    tracesSampleRate: isDev ? 1.0 : 0.1, // 100% in dev, 10% in prod
    profilesSampleRate: isDev ? 1.0 : 0.01, // 1% in prod for profiling

    // Server options
    maxBreadcrumbs: 50,
    maxValueLength: 1024,
    enabled: !isDev || process.env.SENTRY_DEBUG === "true",

    // Server integrations
    integrations: [
      new Sentry.Integrations.Db(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.RequestData({
        include: {
          cookies: false,
          headers: true,
          query_string: true,
          url: true,
          env: true,
          transaction: "path",
        },
      }),
    ],

    // BeforeSend hook: filter sensitive data
    beforeSend(event, hint) {
      // Don't send errors in development with verbose logging
      if (isDev && process.env.SENTRY_DEBUG !== "true") {
        console.debug("[Sentry] Event captured:", hint.originalException);
        return null;
      }

      // Filter sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((crumb) => {
          if (crumb.data) {
            const filtered = { ...crumb.data };
            delete filtered.password;
            delete filtered.token;
            delete filtered.api_key;
            delete filtered.secret;
            crumb.data = filtered;
          }
          return crumb;
        });
      }

      // Filter sensitive data from request/response
      if (event.request) {
        const filtered = { ...event.request };
        delete filtered.cookies;
        event.request = filtered;
      }

      // Filter environment variables
      if (event.contexts?.env) {
        const filtered = { ...event.contexts.env };
        delete filtered.DATABASE_URL;
        delete filtered.ANTHROPIC_API_KEY;
        delete filtered.SENDGRID_API_KEY;
        delete filtered.TWILIO_AUTH_TOKEN;
        event.contexts.env = filtered;
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Next.js specific
      "HYDRATION_MISMATCH",
      // Network errors
      "ECONNREFUSED",
      "ETIMEDOUT",
      "ENOTFOUND",
    ],
  });
}

/**
 * Track slow API requests (>300ms)
 */
export function trackSlowRequest(
  endpoint: string,
  durationMs: number,
  statusCode: number
) {
  if (durationMs > 300) {
    Sentry.captureMessage(
      `Slow API request: ${endpoint} took ${durationMs}ms`,
      "warning"
    );
    Sentry.setContext("slow_request", {
      endpoint,
      duration_ms: durationMs,
      status_code: statusCode,
      threshold_ms: 300,
    });
  }
}

/**
 * Track database query performance
 */
export function trackDatabaseQuery(
  query: string,
  durationMs: number,
  success: boolean
) {
  if (durationMs > 100) {
    Sentry.captureMessage(
      `Slow database query: ${durationMs}ms`,
      success ? "info" : "warning"
    );
    Sentry.setContext("database_query", {
      duration_ms: durationMs,
      success,
      query: query.substring(0, 100), // Truncate query
    });
  }
}

/**
 * Monitor error rate spikes (>1% errors)
 */
export function trackErrorRate(totalRequests: number, errorCount: number) {
  const errorRate = (errorCount / totalRequests) * 100;
  if (errorRate > 1) {
    Sentry.captureMessage(
      `Error rate spike: ${errorRate.toFixed(2)}%`,
      "warning"
    );
    Sentry.setContext("error_rate", {
      error_rate_percent: errorRate,
      total_requests: totalRequests,
      error_count: errorCount,
      threshold_percent: 1,
    });
  }
}

/**
 * Capture server error with context
 */
export function captureServerError(
  error: Error,
  context?: {
    endpoint?: string;
    userId?: string;
    statusCode?: number;
    [key: string]: any;
  }
) {
  if (context) {
    Sentry.setContext("server_error", context);
  }
  Sentry.captureException(error);
}

/**
 * Start a server transaction for performance tracking
 */
export function startServerTransaction(
  name: string,
  op: string = "http.server"
) {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Set server-level tags for all future events
 */
export function setServerTags(tags: Record<string, string>) {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
}

/**
 * Get current Sentry transaction (for adding spans)
 */
export function getCurrentTransaction() {
  return Sentry.getActiveTransaction();
}
