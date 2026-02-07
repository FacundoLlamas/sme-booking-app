# Monitoring Quick Start Guide

**Phase 5.3 - 5-Minute Setup for Development**

## 1. Initialize Monitoring in Your App

### Add to your app layout:

```typescript
// app/layout.tsx
"use client";

import { useEffect } from "react";
import { initWebVitalsMonitoring } from "@/lib/metrics/web-vitals";
import { initClientSentry } from "@/sentry.client.config";
import { initGoogleAnalytics } from "@/lib/analytics/google-analytics";
import { ErrorBoundary } from "@/components/error-boundary";

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize error tracking
    initClientSentry();

    // Initialize Web Vitals
    initWebVitalsMonitoring();

    // Initialize Google Analytics
    if (process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID) {
      initGoogleAnalytics(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID);
    }
  }, []);

  return (
    <html>
      <ErrorBoundary>
        <body>{children}</body>
      </ErrorBoundary>
    </html>
  );
}
```

## 2. Track User Events

### Booking Flow:

```typescript
import * as analytics from "@/lib/analytics/google-analytics";

// User starts chat
analytics.trackChatStarted({ service_type: "plumbing" });

// User opens booking form
analytics.trackBookingFormOpened({ source: "chat" });

// User creates booking
analytics.trackBookingCreated({
  booking_id: "ABC123",
  confirmation_code: "CONF456",
  service_type: "plumbing",
  booking_time: new Date().toISOString(),
});

// User confirms booking
analytics.trackBookingConfirmed({
  booking_id: "ABC123",
  confirmation_code: "CONF456",
  service_type: "plumbing",
});
```

## 3. Log Business Metrics

### In your API routes:

```typescript
import { logBookingCreated, logPaymentReceived } from "@/lib/monitoring/business-metrics";

// When booking is created
logBookingCreated({
  bookingId: booking.id,
  customerId: booking.customer_id,
  businessId: 1,
  serviceType: "plumbing",
  technicianId: 5,
  bookingTime: booking.booking_time.toISOString(),
});

// When payment is received
logPaymentReceived({
  transactionId: "txn123",
  amount: 150,
  currency: "USD",
  bookingId: "ABC123",
});
```

## 4. Track Performance

### Automatically monitored:
- Page load time (LCP)
- First input delay (FID)
- Layout shifts (CLS)

### Manual tracking:

```typescript
import { startTransaction } from "@/sentry.client.config";

const transaction = startTransaction("checkout_flow");
// ... perform operations
transaction?.finish();
```

## 5. Environment Variables

### Development (.env.local):

```env
# Sentry (optional, only if you have a project)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=

# Google Analytics (optional)
NEXT_PUBLIC_GA4_MEASUREMENT_ID=

# Features
ENABLE_METRICS=true
```

### Production (.env.production):

```env
# Sentry (required)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Google Analytics (required)
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Slack alerts (optional)
ENABLE_SLACK_ALERTS=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## 6. Check Health

```bash
# Health check endpoint
curl http://localhost:3000/api/health | jq .

# Should show:
# - status: "healthy"
# - uptime: formatted duration
# - memory: heap usage
# - metrics: request stats by endpoint
```

## 7. View Metrics

### In Development:

```bash
# Check console logs
npm run dev
# Should see "[Web Vitals]" messages

# Check DevTools
# Network tab → filter "analytics" or "sentry"
# Should see requests flowing
```

### In Sentry Dashboard:

```
https://sentry.io/organizations/your-org/issues/
- Watch for new errors
- Check error rate
- View performance metrics
```

### In Google Analytics:

```
https://analytics.google.com/
- Go to Real-time → Overview
- Should see events flowing in
- Check conversion funnels
```

## 8. Quick Commands

```bash
# Start development with monitoring
npm run dev

# Check TypeScript
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test

# Test health endpoint
curl http://localhost:3000/api/health

# Test error capture (optional)
# In browser console:
fetch('/api/test-error')

# View logs
tail -f logs/*.json | jq '.msg'
```

## 9. Common Issues

### Sentry not capturing errors
- Check SENTRY_DSN is set
- Check browser console for errors
- Verify Sentry project is active

### Google Analytics events not showing
- Check NEXT_PUBLIC_GA4_MEASUREMENT_ID is correct
- Wait 30 seconds for events to appear
- Check GA4 Real-time dashboard

### Web Vitals not sending
- Check /api/v1/metrics/web-vitals endpoint
- Open DevTools → Network
- Look for requests to metrics endpoint

## 10. Next Steps

1. ✅ Copy code above
2. ✅ Add environment variables
3. ✅ Run `npm run dev`
4. ✅ Open app in browser
5. ✅ Check console for errors
6. ✅ Verify health endpoint
7. ✅ View dashboards
8. ✅ Start tracking events!

---

## Detailed Guides

- **Full Setup:** See `MONITORING_SETUP.md`
- **Dashboards:** See `DASHBOARDS.md`
- **Complete Guide:** See `MONITORING.md`
- **Incidents:** See `RUNBOOKS.md`

---

## Support

For issues:
1. Check troubleshooting in `MONITORING.md`
2. Check runbooks in `RUNBOOKS.md`
3. Check Sentry documentation: https://docs.sentry.io/
4. Check GA4 documentation: https://analytics.google.com/

---

**Last Updated:** 2025-02-07
**Version:** 1.0
