/**
 * Web Vitals Metrics Collection Endpoint
 * Receives Web Vitals data from clients and stores/processes it
 */

import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

const logger = getLogger("api:metrics:web-vitals");

interface WebVitalMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType: string;
  rating: string;
  timestamp: string;
  url: string;
}

/**
 * POST /api/v1/metrics/web-vitals
 * 
 * Receives Web Vitals measurements from the client
 * Stores them for analysis and sends to monitoring services
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = (await request.json()) as WebVitalMetric;

    // Validate required fields
    if (!body.name || body.value === undefined) {
      logger.warn({
        msg: "Invalid web vitals payload",
        payload: body,
      });

      return NextResponse.json(
        { error: "Missing required fields: name, value" },
        { status: 400 }
      );
    }

    // Log the metric
    logger.info({
      msg: "Web Vital received",
      metric_name: body.name,
      metric_value: body.value,
      metric_rating: body.rating,
      navigation_type: body.navigationType,
      url: body.url,
    });

    // Send to Sentry for correlation
    Sentry.captureMessage(
      `Web Vital: ${body.name} = ${body.value.toFixed(2)}`,
      body.rating === "poor" ? "error" : body.rating === "needs-improvement" ? "warning" : "info"
    );

    Sentry.setContext("web_vital_metric", {
      name: body.name,
      value: body.value,
      delta: body.delta,
      rating: body.rating,
      navigation_type: body.navigationType,
      url: body.url,
    });

    // Store metric in database (optional - implement as needed)
    // await storeWebVitalMetric({
    //   name: body.name,
    //   value: body.value,
    //   timestamp: new Date(body.timestamp),
    //   url: body.url,
    //   rating: body.rating,
    // });

    // Return success
    const durationMs = Date.now() - startTime;
    logger.info({
      msg: "Web Vitals metric processed",
      duration_ms: durationMs,
    });

    return NextResponse.json(
      { success: true, processed: true },
      { status: 200 }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));

    logger.error({
      msg: "Error processing web vitals",
      error: err.message,
      duration_ms: durationMs,
    });

    Sentry.captureException(err, {
      tags: { endpoint: "metrics.web_vitals" },
    });

    return NextResponse.json(
      { error: "Failed to process metric" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/metrics/web-vitals
 * 
 * Health check endpoint for metrics collection
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Web Vitals endpoint ready",
    timestamp: new Date().toISOString(),
  });
}
