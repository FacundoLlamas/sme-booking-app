/**
 * Web Vitals Monitoring
 * Tracks Core Web Vitals and sends to Sentry + Google Analytics
 */

import {
  getCLS,
  getFCP,
  getFID,
  getLCP,
  getTTFB,
  Metric,
} from "web-vitals";
import * as Sentry from "@sentry/nextjs";

interface WebVitalsMetric extends Metric {
  value: number;
  delta: number;
  id: string;
  name: string;
  navigationType: "navigate" | "reload" | "back-forward" | "back-forward-cache";
  rating: "good" | "needs-improvement" | "poor";
}

/**
 * Performance thresholds (in milliseconds)
 * Based on Google's recommended Core Web Vitals thresholds
 */
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 }, // First Input Delay
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
};

/**
 * Performance budgets (in milliseconds)
 * Application-specific performance targets
 */
const PERFORMANCE_BUDGETS = {
  // Page load time budget
  pageLoad: 3000,
  // API response time budget
  apiResponse: 500,
  // Navigation time budget (from one page to another)
  navigation: 1000,
  // LCP budget (critical)
  lcp: 2500,
};

/**
 * Send metric to Sentry
 */
function sendToSentry(metric: WebVitalsMetric) {
  const level = getMetricLevel(metric.name, metric.value);

  Sentry.captureMessage(
    `Web Vital: ${metric.name} = ${metric.value.toFixed(2)}${getUnit(metric.name)}`,
    level === "poor" ? "error" : level === "needs-improvement" ? "warning" : "info"
  );

  Sentry.setContext("web_vitals", {
    metric_name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    unit: getUnit(metric.name),
    threshold_good: THRESHOLDS[metric.name as keyof typeof THRESHOLDS]?.good,
    threshold_poor: THRESHOLDS[metric.name as keyof typeof THRESHOLDS]?.poor,
  });
}

/**
 * Send metric to Google Analytics 4
 */
function sendToGoogleAnalytics(metric: WebVitalsMetric) {
  // Check if gtag is available
  if (typeof window === "undefined" || !("gtag" in window)) {
    return;
  }

  const gtag = (window as any).gtag;

  // Send as custom event
  gtag?.("event", "web_vital", {
    metric_name: metric.name,
    metric_value: Math.round(metric.value),
    metric_id: metric.id,
    metric_delta: Math.round(metric.delta),
    metric_category: "Web Vitals",
    metric_label: metric.navigationType,
  });

  // Also send as Google Analytics web_vitals event (GA4 native support)
  gtag?.("event", metric.name, {
    value: Math.round(metric.value),
    event_category: "web_vitals",
    event_label: metric.id,
    non_interaction: true,
  });
}

/**
 * Send metric to application analytics API
 */
async function sendToAnalyticsAPI(metric: WebVitalsMetric) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    // Use navigator.sendBeacon for reliable delivery
    const data = JSON.stringify({
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      rating: metric.rating,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });

    // Try sendBeacon first (most reliable)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/v1/metrics/web-vitals",
        new Blob([data], { type: "application/json" })
      );
    } else {
      // Fallback to fetch
      await fetch("/api/v1/metrics/web-vitals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
        keepalive: true,
      });
    }
  } catch (error) {
    console.error("Failed to send web vitals to API:", error);
  }
}

/**
 * Get metric level based on threshold
 */
function getMetricLevel(
  metricName: string,
  value: number
): "good" | "needs-improvement" | "poor" {
  const thresholds = THRESHOLDS[metricName as keyof typeof THRESHOLDS];
  if (!thresholds) return "good";

  if (value <= thresholds.good) return "good";
  if (value <= thresholds.poor) return "needs-improvement";
  return "poor";
}

/**
 * Get unit for metric
 */
function getUnit(metricName: string): string {
  switch (metricName) {
    case "CLS":
      return "";
    case "FID":
    case "FCP":
    case "LCP":
    case "TTFB":
      return "ms";
    default:
      return "";
  }
}

/**
 * Check if metric violates performance budget
 */
function checkPerformanceBudget(metric: WebVitalsMetric) {
  let budget: number | null = null;

  switch (metric.name) {
    case "LCP":
      budget = PERFORMANCE_BUDGETS.lcp;
      break;
  }

  if (budget && metric.value > budget) {
    Sentry.captureMessage(
      `Performance budget exceeded: ${metric.name} (${metric.value.toFixed(2)}ms > ${budget}ms)`,
      "warning"
    );
  }
}

/**
 * Track a single Web Vital metric
 */
export function trackWebVital(metric: WebVitalsMetric) {
  // Send to Sentry
  sendToSentry(metric);

  // Send to Google Analytics
  sendToGoogleAnalytics(metric);

  // Send to analytics API
  sendToAnalyticsAPI(metric);

  // Check performance budgets
  checkPerformanceBudget(metric);

  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Web Vital] ${metric.name}: ${metric.value.toFixed(2)}${getUnit(metric.name)} (${metric.rating})`
    );
  }
}

/**
 * Initialize Web Vitals monitoring
 * Call this once in your app initialization
 */
export function initWebVitalsMonitoring() {
  if (typeof window === "undefined") {
    return;
  }

  // Track metrics
  getCLS(trackWebVital as any);
  getFCP(trackWebVital as any);
  getFID(trackWebVital as any);
  getLCP(trackWebVital as any);
  getTTFB(trackWebVital as any);

  // Log when monitoring starts
  if (process.env.NODE_ENV === "development") {
    console.log("[Web Vitals] Monitoring initialized");
  }
}

/**
 * Get current performance metrics (for debugging)
 */
export function getPerformanceMetrics() {
  if (typeof window === "undefined") {
    return null;
  }

  const navigation = performance.getEntriesByType(
    "navigation"
  )[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType("paint");

  return {
    navigationStart: navigation?.navigationStart,
    domContentLoaded: navigation?.domContentLoadedEventEnd,
    loadComplete: navigation?.loadEventEnd,
    firstPaint: paint.find((p) => p.name === "first-paint")?.startTime,
    firstContentfulPaint: paint.find(
      (p) => p.name === "first-contentful-paint"
    )?.startTime,
  };
}

/**
 * Get performance budget status
 */
export function getPerformanceBudgetStatus() {
  const metrics = getPerformanceMetrics();
  if (!metrics) return null;

  const pageLoadTime = metrics.loadComplete || 0;

  return {
    pageLoad: {
      actual: pageLoadTime,
      budget: PERFORMANCE_BUDGETS.pageLoad,
      remaining: Math.max(0, PERFORMANCE_BUDGETS.pageLoad - pageLoadTime),
      exceeded: pageLoadTime > PERFORMANCE_BUDGETS.pageLoad,
    },
  };
}

/**
 * Export thresholds and budgets for testing
 */
export { THRESHOLDS, PERFORMANCE_BUDGETS };
