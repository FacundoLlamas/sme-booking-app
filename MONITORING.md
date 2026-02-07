# Monitoring & Analytics Implementation

**Phase 5.3 - Production Monitoring System**

## Overview

This document describes the comprehensive monitoring and analytics system implemented for the SME Booking App MVP. It covers:

- Error tracking (Sentry)
- Performance monitoring (Web Vitals)
- Application analytics (Google Analytics 4)
- Server monitoring and observability
- Business metrics logging
- Alerts and dashboards
- Incident runbooks

---

## 1. Error Tracking (Sentry)

### Configuration

#### Client-Side (`sentry.client.config.ts`)

Captures client-side errors, React error boundaries, and user interactions.

**Key Features:**
- Automatic unhandled error capture
- React error boundary integration
- Session replay (10% of sessions in production)
- Performance monitoring with 10% sampling
- Sensitive data filtering (passwords, tokens)
- Breadcrumb tracking for debugging

**Environment Variables:**
```env
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_APP_VERSION=0.1.0
SENTRY_DEBUG=false # Set to true to see events in dev
```

#### Server-Side (`sentry.server.config.ts`)

Captures server-side errors, API failures, and database issues.

**Key Features:**
- Server exception tracking
- Database integration monitoring
- HTTP request tracing
- Slow request detection (>300ms)
- Error rate monitoring (>1% threshold)
- Performance profiling (1% sampling)

**Environment Variables:**
```env
SENTRY_DSN=your-sentry-dsn
APP_VERSION=0.1.0
```

### Usage

#### Capturing Exceptions

**Client:**
```typescript
import { captureException } from "@/sentry.client.config";

try {
  // Code that may fail
} catch (error) {
  captureException(error as Error, {
    context: "specific_operation",
  });
}
```

**Server:**
```typescript
import { captureServerError } from "@/sentry.server.config";

try {
  // Code that may fail
} catch (error) {
  captureServerError(error as Error, {
    endpoint: "/api/bookings",
    userId: "user123",
  });
}
```

#### Tracking Performance

**Client Transactions:**
```typescript
import { startTransaction } from "@/sentry.client.config";

const transaction = startTransaction("checkout", "user_interaction");
// ... perform operations
transaction?.finish();
```

**Server Transactions:**
```typescript
import { startServerTransaction } from "@/sentry.server.config";

const transaction = startServerTransaction("process_booking", "http.server");
// ... perform operations
transaction?.finish();
```

### Error Boundaries

React error boundaries capture component errors:

```typescript
import { ErrorBoundary } from "@/components/error-boundary";

export default function Page() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Monitoring Rules

- **Slow API Requests:** Automatically tracked (>300ms)
- **Database Query Performance:** Tracked (>100ms)
- **Error Rate Spikes:** Alerts when >1% of requests fail
- **Memory Issues:** Monitored via performance profiling
- **Promise Rejections:** Automatically captured

---

## 2. Performance Monitoring (Web Vitals)

### Core Web Vitals Tracked

| Metric | Abbreviation | Threshold (Good) | Threshold (Poor) | Priority |
|--------|--------------|-----------------|------------------|----------|
| Largest Contentful Paint | LCP | <2.5s | >4.0s | Critical |
| First Input Delay | FID | <100ms | >300ms | High |
| Cumulative Layout Shift | CLS | <0.1 | >0.25 | High |
| First Contentful Paint | FCP | <1.8s | >3.0s | Medium |
| Time to First Byte | TTFB | <800ms | >1.8s | Medium |

### Performance Budgets

- Page load: 3 seconds
- API response: 500ms
- Navigation: 1 second
- LCP: 2.5 seconds

### Implementation

**Initialize Web Vitals:**
```typescript
// In your app layout or entry point
import { initWebVitalsMonitoring } from "@/lib/metrics/web-vitals";

export default function RootLayout() {
  useEffect(() => {
    initWebVitalsMonitoring();
  }, []);

  return (
    <html>
      <body>...</body>
    </html>
  );
}
```

**Get Metrics Programmatically:**
```typescript
import { getPerformanceMetrics, getPerformanceBudgetStatus } from "@/lib/metrics/web-vitals";

const metrics = getPerformanceMetrics();
const budgetStatus = getPerformanceBudgetStatus();
```

### Metric Destinations

Metrics are sent to:
1. **Sentry** - Error tracking and performance monitoring
2. **Google Analytics 4** - Analytics dashboard
3. **Application API** (`/api/v1/metrics/web-vitals`) - Custom analytics storage

---

## 3. Application Analytics (Google Analytics 4)

### Configuration

**Initialize GA4:**
```typescript
import { initGoogleAnalytics } from "@/lib/analytics/google-analytics";

useEffect(() => {
  initGoogleAnalytics(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!);
}, []);
```

**Environment Variable:**
```env
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Tracking Events

#### Booking Flow

```typescript
import * as analytics from "@/lib/analytics/google-analytics";

// User starts chat
analytics.trackChatStarted({
  service_type: "plumbing",
});

// User opens booking form
analytics.trackBookingFormOpened({
  service_type: "plumbing",
  source: "chat",
});

// User completes form step
analytics.trackBookingStepCompleted(2, 4); // Step 2 of 4

// User creates booking
analytics.trackBookingCreated({
  booking_id: "ABCD1234",
  confirmation_code: "ABC123",
  service_type: "plumbing",
  booking_time: "2025-02-15T14:00:00Z",
});

// User confirms booking
analytics.trackBookingConfirmed({
  booking_id: "ABCD1234",
  confirmation_code: "ABC123",
  service_type: "plumbing",
});

// User cancels/reschedules
analytics.trackBookingCancelled({
  booking_id: "ABCD1234",
  service_type: "plumbing",
  reason: "Schedule conflict",
});
```

#### Funnel Tracking

```typescript
// Track funnel progression
analytics.trackFunnelStep("chat_start");
analytics.trackFunnelStep("booking_form");
analytics.trackFunnelStep("booking_created");
analytics.trackFunnelStep("confirmation");
analytics.trackFunnelStep("dashboard");

// Track funnel drop-off
analytics.trackFunnelDropoff("chat_start", "booking_form", "User clicked back");
```

#### User Properties

```typescript
analytics.setUserProperties("user123", {
  customer_id: "cust456",
  business_id: 1,
  service_type: "plumbing",
  user_role: "customer",
  signup_source: "organic_search",
});
```

### Dashboard Metrics

Access analytics at Google Analytics Dashboard:
- **Real-time Dashboard:** Active users, page views, events
- **Conversion Funnels:** Chat → Booking → Confirmation → Dashboard
- **User Acquisition:** Traffic source, signup source
- **User Behavior:** Event flow, funnel abandonment
- **Custom Reports:** Booking metrics, service type distribution

---

## 4. Server Monitoring

### Request Metrics

Server automatically tracks:
- API request latency
- Error rates per endpoint
- Slow request detection (>300ms)
- Database query performance (>100ms)
- Cache hit/miss rates

**Access Metrics:**
```typescript
import { getMetricsSnapshot } from "@/lib/monitoring/server-monitoring";

const snapshot = getMetricsSnapshot();
// {
//   timestamp: "2025-02-07T...",
//   endpoints: [
//     {
//       endpoint: "GET /api/v1/availability",
//       totalRequests: 142,
//       totalErrors: 2,
//       averageResponseTime: 245,
//       errorRate: "1.41",
//       slowRequests: 8
//     }
//   ]
// }
```

### Health Checks

**API Endpoint:**
```
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-02-07T...",
  "uptime": {
    "seconds": 3600,
    "formatted": "0d 1h 0m 0s"
  },
  "memory": {
    "rss": 256,
    "heapTotal": 512,
    "heapUsed": 128,
    "external": 32
  },
  "metrics": {
    "endpoints": [...],
    "summary": {
      "totalEndpoints": 12,
      "totalRequests": 5432,
      "totalErrors": 23,
      "averageResponseTime": 245
    }
  }
}
```

### Database Monitoring

```typescript
import { databaseMonitor } from "@/lib/monitoring/server-monitoring";

// Check connection health
const isHealthy = await databaseMonitor.checkConnection(prisma);

// Get status
const status = databaseMonitor.getStatus();
// { healthy: true, lastCheck: "2025-02-07T..." }
```

### Cache Monitoring

```typescript
import { cacheMonitor } from "@/lib/monitoring/server-monitoring";

// Record cache operations
cacheMonitor.recordHit();
cacheMonitor.recordMiss();

// Get statistics
const stats = cacheMonitor.getStats();
// { hits: 100, misses: 20, total: 120, hitRate: "83.33" }
```

### Queue Monitoring

```typescript
import { queueMonitor } from "@/lib/monitoring/server-monitoring";

// Record job processing
queueMonitor.recordProcessed(250); // 250ms
queueMonitor.recordFailed(500);

// Get statistics
const stats = queueMonitor.getStats();
// { processed: 95, failed: 5, total: 100, successRate: "95.00", averageDuration: 300 }
```

---

## 5. Business Metrics Logging

Business events are logged for analytics and dashboards.

### Available Events

```typescript
import { logBusinessMetric, logBookingCreated, logPaymentReceived } from "@/lib/monitoring/business-metrics";

// Booking events
logBookingCreated({
  bookingId: "ABCD1234",
  customerId: "cust456",
  businessId: 1,
  serviceType: "plumbing",
  technicianId: 5,
  bookingTime: "2025-02-15T14:00:00Z",
  estimatedDuration: 90,
});

logBookingConfirmed({
  bookingId: "ABCD1234",
  customerId: "cust456",
  businessId: 1,
  confirmationCode: "ABC123",
});

logBookingCancelled({
  bookingId: "ABCD1234",
  customerId: "cust456",
  businessId: 1,
  reason: "Schedule conflict",
  refundAmount: 100,
});

// Revenue events
logPaymentReceived({
  transactionId: "txn123",
  amount: 150,
  currency: "USD",
  businessId: 1,
  customerId: "cust456",
  bookingId: "ABCD1234",
});

// Customer events
logCustomerSignup({
  customerId: "cust456",
  email: "customer@example.com",
  signupSource: "organic_search",
  businessId: 1,
});
```

### Event Categories

- **Booking Metrics:** Created, confirmed, cancelled, rescheduled, completed
- **Revenue Metrics:** Payments received, failed payments, refunds
- **Customer Metrics:** Signups, profile updates
- **System Metrics:** Service availability, expert assignments, notifications

---

## 6. Alerts & Notifications

### Alert Thresholds

| Alert Type | Threshold | Action |
|-----------|-----------|--------|
| Error Rate Spike | >1% of requests | Sentry + Slack |
| Slow API Request | >300ms | Sentry |
| Database Query | >100ms | Warning log |
| Memory Usage | >80% | Sentry |
| Booking Failure | Any payment failure | Email + Slack |
| Service Down | Health check failed | PagerDuty |

### Alert Channels

1. **Sentry** - Automatic error tracking
2. **Slack** - Team notifications (via Sentry integration)
3. **Email** - Critical issues to admin
4. **PagerDuty** - On-call engineer alerts (optional)

### Setup Slack Alerts

In Sentry project settings:

1. Go to Integrations → Slack
2. Connect workspace
3. Configure alert rules:
   - **Error spike (>1% rate):** Post to #alerts channel
   - **Critical errors:** Post to #critical-alerts channel
   - **Performance degradation:** Post to #performance channel

---

## 7. Logging & Observability

### Structured Logging

All logs use structured JSON format with:
- Timestamp
- Log level
- Message
- Correlation ID (for request tracing)
- Context fields

**Example Log:**
```json
{
  "timestamp": "2025-02-07T15:47:00.000Z",
  "level": "info",
  "message": "Booking created successfully",
  "correlation_id": "req123abc",
  "booking_id": "ABCD1234",
  "customer_id": "cust456",
  "duration_ms": 234
}
```

### Log Aggregation Strategy

**Development:** Console output (pretty-printed)

**Production:**
- Aggregate logs to centralized service (e.g., ELK Stack, DataDog, Splunk)
- Retention: 30 days
- Index: Correlation ID for distributed tracing
- Alerting: Error logs trigger Sentry events

### Log Retention Policy

| Environment | Retention | Level | Destination |
|-------------|-----------|-------|-------------|
| Development | Session | DEBUG | Console |
| Staging | 7 days | INFO | CloudWatch |
| Production | 30 days | INFO/WARN | CloudWatch + Sentry |

### Correlation IDs

Every request gets a unique correlation ID for tracing:

```typescript
import { generateCorrelationId } from "@/lib/correlation-id";

const correlationId = generateCorrelationId();
logger.info({ correlationId, msg: "Request started" });
```

---

## 8. Monitoring Dashboards

### Sentry Dashboard

**URL:** https://sentry.io/organizations/your-org/issues/

**Key Metrics:**
- Error rate trends
- Most common errors
- Error distribution by page/endpoint
- Performance metrics (LCP, FID, CLS)
- Release comparison

### Google Analytics Dashboard

**URL:** Google Analytics → Your Property

**Key Metrics:**
- Real-time active users
- Booking funnel completion rate
- Chat → Booking → Confirmation flow
- Conversion rate by service type
- Session duration
- Bounce rate

### Custom Metrics Dashboard

**API Endpoint:** `GET /api/v1/metrics/health`

**Returns:**
- Server uptime
- Request metrics by endpoint
- Error rates
- Average response times
- Memory usage
- Database connection status

### Business Metrics Dashboard

**Data Source:** Business metrics logging

**Key Metrics:**
- Total bookings (created, confirmed, cancelled, completed)
- Revenue (received, failed, refunded)
- Customer acquisition
- Service-type distribution
- Booking completion rate

---

## 9. Runbooks

### Critical Issues

#### 1. Error Rate Spike (>1%)

**Symptoms:**
- Sentry alert: "Error rate exceeded 1%"
- Slack notification in #alerts

**Investigation:**
```bash
# 1. Check most recent errors in Sentry
# 2. Check specific endpoint health
curl http://localhost:3000/api/health | jq .metrics

# 3. Check logs for patterns
grep -i "error" logs/*.json | head -20

# 4. Check database status
# Database monitor available at: getHealthCheckData()
```

**Common Causes:**
- Database connection pool exhausted
- Third-party API failure (Google Calendar, Twilio, SendGrid)
- Memory leak causing crashes
- Code deployment issue

**Resolution:**
- Restart application (if safe)
- Check and scale database connections
- Verify third-party service status
- Rollback recent deployment if needed

---

#### 2. Slow Database Queries

**Symptoms:**
- API requests slow (>300ms)
- Sentry: "Slow database query" warnings
- High database CPU usage

**Investigation:**
```typescript
// Check database monitor
const status = databaseMonitor.getStatus();

// Review query logs for queries >100ms
// Check indexes on frequently-queried tables
// Run EXPLAIN ANALYZE on slow queries
```

**Common Causes:**
- Missing database indexes
- N+1 query problem in code
- Large data set scan
- Database connection pooling issue

**Resolution:**
- Add missing indexes: `CREATE INDEX idx_name ON table(column)`
- Implement query batching/caching
- Optimize queries (use WHERE, LIMIT, etc.)
- Increase connection pool size

---

#### 3. Memory Leak

**Symptoms:**
- Memory usage grows over time
- Sentry: "Memory threshold exceeded"
- Application crashes after X hours

**Investigation:**
```typescript
const health = await getHealthCheckData();
console.log(health.memory); // Check heapUsed trend
```

**Common Causes:**
- Event listeners not cleaned up
- Caches growing unbounded
- Large data structures persisting
- Database connections not released

**Resolution:**
- Review recent code changes
- Add cleanup in useEffect/component unmount
- Implement cache eviction policy (TTL)
- Use memory profiling tools (Chrome DevTools)

---

#### 4. Calendar Integration Failure

**Symptoms:**
- Bookings not syncing to calendar
- Sentry: "Calendar API error"
- `CalendarSyncLog` shows "failed" status

**Investigation:**
```typescript
// Check sync logs
const syncLogs = await prisma.calendarSyncLog.findMany({
  where: { status: "failed" },
  orderBy: { createdAt: "desc" },
  take: 10,
});

// Check token validity
const creds = await prisma.calendarCredentials.findUnique({
  where: { businessId: 1 },
});
console.log(new Date() > creds.expiresAt); // Is token expired?
```

**Common Causes:**
- OAuth token expired
- Google Calendar API quota exceeded
- Network/connectivity issue
- Invalid calendar configuration

**Resolution:**
- Refresh OAuth token via `refreshTokenIfNeeded()`
- Check Google Cloud Console for quota usage
- Verify network connectivity
- Check GOOGLE_CALENDAR_MOCK environment variable

---

#### 5. High Booking Failure Rate

**Symptoms:**
- Many bookings showing "cancelled" status
- Customer complaints about confirmation issues
- `booking_cancelled` events spike in analytics

**Investigation:**
```typescript
// Check business metrics
const metrics = await getBusinessMetricsSummary(1, "day");
console.log(metrics.bookings); // Check cancelled count

// Check booking status distribution
const bookings = await prisma.booking.groupBy({
  by: ["status"],
  _count: true,
});
```

**Common Causes:**
- Availability calculation error
- Payment processing failures
- Confirmation email not sent
- Database conflict detection too aggressive

**Resolution:**
- Review booking validation logic
- Check payment provider status
- Verify email notification service
- Review conflict detection thresholds

---

### Recovery Procedures

#### Reset Metrics
```typescript
import { resetMetrics } from "@/lib/monitoring/server-monitoring";

// Clear in-memory metrics (useful after code deployment)
resetMetrics();
```

#### Clear Sentry Events
1. Go to Sentry project settings
2. Select project → General Settings
3. Scroll to "Delete project" section
4. Click "Temporarily disable project" if needed

#### Restart Monitoring
```bash
# Restart application to reinitialize monitoring
npm run dev
# or in production
kill -9 $(lsof -t -i:3000)
npm start
```

---

## 10. Performance Optimization Tips

### Client-Side

- Load images with lazy loading
- Code split with `dynamic()` import
- Minimize JavaScript bundle size
- Use CDN for static assets
- Enable compression (gzip/brotli)

### Server-Side

- Add database indexes for frequently-queried columns
- Implement caching (Redis) for expensive queries
- Use connection pooling for database
- Paginate large result sets
- Optimize N+1 queries

### Monitoring

- Set realistic performance budgets
- Track metrics over time
- Identify performance regressions early
- A/B test performance improvements

---

## 11. Environment Configuration

### Development

```env
# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DEBUG=true

# Google Analytics
NEXT_PUBLIC_GA4_MEASUREMENT_ID=

# Logging
LOG_LEVEL=debug
LOG_FORMAT=pretty

# Features
ENABLE_METRICS=true
ENABLE_REQUEST_TRACING=true
```

### Production

```env
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxx
SENTRY_DSN=https://xxxxx@sentry.io/xxxx
SENTRY_DEBUG=false

# Google Analytics
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Features
ENABLE_METRICS=true
ENABLE_REQUEST_TRACING=true
```

---

## Summary

This monitoring system provides:

✅ **Comprehensive error tracking** (Sentry)
✅ **Real-time performance metrics** (Web Vitals)
✅ **User analytics and funnels** (Google Analytics 4)
✅ **Server health monitoring** (Custom metrics)
✅ **Business metrics logging** (Revenue, bookings, customers)
✅ **Structured logging with correlation IDs**
✅ **Multi-channel alerts** (Sentry, Slack, Email)
✅ **Runbooks for common issues**
✅ **Production-ready and scalable**

---

## Next Steps

1. **Setup Sentry Project:** Create account and get DSN
2. **Configure Google Analytics:** Get GA4 measurement ID
3. **Deploy to Production:** Set environment variables
4. **Test Alerts:** Verify Slack/email notifications
5. **Monitor Dashboards:** Regularly review metrics
6. **Incident Response:** Follow runbooks for issues
