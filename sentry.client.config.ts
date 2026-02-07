/**
 * Sentry Client-Side Configuration
 * Captures client-side errors, performance metrics, and user interactions
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Initialize Sentry for client-side error tracking
 * This captures:
 * - Unhandled exceptions
 * - Promise rejections
 * - React error boundaries
 * - Performance metrics
 * - User interactions
 */
export function initClientSentry() {
  if (typeof window === "undefined") {
    return; // Skip initialization on server
  }

  const isDev = process.env.NODE_ENV === "development";
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn && !isDev) {
    console.warn("Sentry DSN not configured for production");
    return;
  }

  Sentry.init({
    // Environment
    environment: process.env.NODE_ENV,
    dsn: dsn || "https://examplePublicKey@o0.ingest.sentry.io/0",

    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",

    // Performance monitoring
    tracesSampleRate: isDev ? 1.0 : 0.1, // 100% in dev, 10% in prod
    profilesSampleRate: isDev ? 1.0 : 0.01, // 1% in prod for profiling

    // Client options
    maxBreadcrumbs: 50,
    maxValueLength: 1024,
    enabled: !isDev || process.env.SENTRY_DEBUG === "true",

    // Integrations
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
      new Sentry.CaptureConsole({
        levels: ["error", "warn"],
      }),
    ],

    // Replay configuration
    replaysSessionSampleRate: isDev ? 1.0 : 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% on error

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
            // Remove sensitive fields
            const filtered = { ...crumb.data };
            delete filtered.password;
            delete filtered.token;
            delete filtered.credit_card;
            delete filtered.ssn;
            crumb.data = filtered;
          }
          return crumb;
        });
      }

      // Filter sensitive data from request bodies
      if (event.request?.data) {
        const filtered = { ...event.request.data };
        delete filtered.password;
        delete filtered.token;
        delete filtered.credit_card;
        event.request.data = filtered;
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      // Random network errors
      "NetworkError",
      "Network is offline",
      // User cancelled
      "AbortError",
      // Script tag loading errors
      "Script error",
    ],
  });
}

/**
 * Set user context in Sentry
 * Called after user authentication
 */
export function setSentryUser(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Add custom context to all future events
 */
export function setSentryContext(
  name: string,
  context: Record<string, any>
) {
  Sentry.setContext(name, context);
}

/**
 * Capture manual exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext("additional", context);
  }
  Sentry.captureException(error);
}

/**
 * Capture manual message/event
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  Sentry.captureMessage(message, level);
}

/**
 * Start a manual transaction for performance tracking
 */
export function startTransaction(name: string, op: string = "operation") {
  return Sentry.startTransaction({
    name,
    op,
  });
}
