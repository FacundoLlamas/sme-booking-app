# Monitoring Setup Guide

**Phase 5.3 - Step-by-Step Integration Instructions**

## Quick Start

This guide walks you through setting up error tracking (Sentry), performance monitoring (Web Vitals), and analytics (Google Analytics 4) for the SME Booking App.

---

## 1. Sentry Setup (Error Tracking)

### Step 1: Create Sentry Account

1. Go to https://sentry.io
2. Click "Start for free"
3. Sign up with email or GitHub
4. Create organization (e.g., "SME Booking")

### Step 2: Create Projects

#### Project 1: Web/Frontend

1. **New Project**
   - Platform: JavaScript (React)
   - Alert frequency: Release & Alert me on new issues
   - Team: Default team
   - Name: "sme-booking-web"

2. **Get DSN**
   - After creation, you'll see: `Configuration` section
   - Copy "Client Key (DSN)"
   - Format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

3. **Add to .env.local (Development)**
   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```

4. **Add to .env.production (Production)**
   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```

#### Project 2: Backend/Server

1. **New Project**
   - Platform: Node.js
   - Name: "sme-booking-backend"

2. **Get DSN**
   - Copy "Client Key (DSN)"

3. **Add to .env (Server)**
   ```env
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```

### Step 3: Integrations

#### Connect Slack

1. **In Sentry:**
   - Settings → Integrations → Slack
   - Click "Install"
   - Select Slack workspace
   - Authorize

2. **Configure Alert Rules**
   - Alerts → Alert Rules → Create Rule
   - When: Error rate exceeds 10 issues in 5 minutes
   - Then: Send to #alerts

#### Connect GitHub (Optional)

1. **In Sentry:**
   - Settings → Integrations → GitHub
   - Click "Install"
   - Select repository
   - Authorize

**Benefits:**
- Auto-link errors to GitHub issues
- Link commits to Sentry releases

### Step 4: Test Integration

```bash
cd /home/node/.openclaw/workspace/sme-booking-app

# Set DSN
export NEXT_PUBLIC_SENTRY_DSN=your-dsn-here

# Start dev server
npm run dev

# In browser console, trigger error:
fetch('/api/test-error');

# Check Sentry dashboard
# Should see error within 1-2 minutes
```

### Step 5: Release Tracking

1. **Update package.json**
   ```json
   {
     "version": "0.1.0"
   }
   ```

2. **Create release in Sentry**
   - Releases → Create Release
   - Version: 0.1.0
   - Projects: Select both
   - Commits: Connect GitHub for auto-detection

3. **Track deployments**
   - Each deployment creates a new release
   - Compare error rates between versions

---

## 2. Google Analytics 4 Setup

### Step 1: Create GA4 Property

1. Go to https://analytics.google.com
2. Click "Start measuring"
3. Account name: "SME Booking"
4. Data stream
   - Platform: Web
   - Website URL: http://localhost:3000 (dev) or your domain (prod)
   - Stream name: "SME Booking App"
5. Click "Create stream"

### Step 2: Get Measurement ID

1. After creating stream, you'll see Measurement ID
   - Format: `G-XXXXXXXXXX`
   - Example: `G-AB1CD2EFGH`

2. **Add to .env.local**
   ```env
   NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

3. **Verify in browser**
   - Open DevTools → Network
   - Filter for "analytics"
   - Refresh page
   - Should see request to `www.googletagmanager.com`

### Step 3: Setup Events

1. **Admin → Events → Create event**

2. **Create conversion: "booking_confirmed"**
   - Mark as conversion
   - Trigger: event name = "booking_confirmed"

3. **Create conversion: "booking_created"**
   - Mark as conversion
   - Trigger: event name = "booking_created"

4. **Create conversion: "chat_started"**
   - Trigger: event name = "chat_started"

### Step 4: Setup Funnels

1. **Reports → Conversion Funnels → Create Funnel**

2. **Funnel Name:** "Booking Funnel"

3. **Steps:**
   1. `chat_started`
   2. `booking_form_opened`
   3. `booking_created`
   4. `booking_confirmed`
   5. `dashboard_viewed`

4. **View Funnel**
   - Check drop-off at each step
   - Identify bottlenecks

### Step 5: Create Custom Report

1. **Reports → Custom Reports → Create Custom Report**

2. **Name:** "Booking Metrics"

3. **Dimensions:**
   - Event name
   - Service type
   - Device

4. **Metrics:**
   - Event count
   - Users
   - Conversion rate

5. **Segments** (optional):
   - New vs Returning users
   - Mobile vs Desktop

---

## 3. Web Vitals Monitoring Setup

### Step 1: Initialize in App

```typescript
// app/layout.tsx
"use client";

import { useEffect } from "react";
import { initWebVitalsMonitoring } from "@/lib/metrics/web-vitals";

export default function RootLayout({ children }) {
  useEffect(() => {
    initWebVitalsMonitoring();
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### Step 2: Test in DevTools

```bash
# Open DevTools → Performance tab
# Click "Record" → Refresh page → Stop recording
# 
# Should see:
# - Largest Contentful Paint (LCP) - Green if <2.5s
# - Cumulative Layout Shift (CLS) - Green if <0.1
# - First Input Delay (FID) - Green if <100ms
```

### Step 3: Verify Sentry Integration

1. **LCP > 2.5 seconds:**
   - Trigger: Open slow page
   - Check Sentry dashboard
   - Should see "Performance" warning

2. **CLS > 0.1:**
   - Trigger: Slow layout shift
   - Check Sentry
   - Should see warning

### Step 4: Monitor Google Analytics

1. **GA4 Dashboard → Reports → Web Vitals**
   - Not enabled by default
   - Enable: Admin → Data Streams → Enhancement settings → Measurement Protocol

2. **Check metrics:**
   ```
   Real-time → Overview
   Should see Web Vitals events flowing in
   ```

---

## 4. Email Alert Setup

### Step 1: Gmail Configuration

1. **Create Gmail account** (optional, for alerts@sme-booking.com)

2. **Generate App Password**
   - https://myaccount.google.com/apppasswords
   - Select: Mail + Windows Computer
   - Copy app password

3. **Add to .env**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ALERT_EMAIL_FROM=alerts@sme-booking.com
   ALERT_EMAIL_TO=admin@sme-booking.com
   ```

### Step 2: Test Email Alert

```bash
# Send test email
curl -X POST http://localhost:3000/api/v1/alerts/test-email \
  -H "Content-Type: application/json"

# Check inbox for test email
```

---

## 5. Slack Alert Setup

### Step 1: Create Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App"
3. Select "From scratch"
   - App name: "SME Booking Alerts"
   - Workspace: Select your workspace
4. Click "Create App"

### Step 2: Enable Incoming Webhooks

1. **Left sidebar → Incoming Webhooks**
2. Toggle "Activate Incoming Webhooks" → On
3. Click "Add New Webhook to Workspace"
4. Select channel (e.g., #alerts)
5. Click "Allow"
6. Copy Webhook URL

### Step 3: Add to Environment

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXX
```

### Step 4: Test Webhook

```bash
curl -X POST https://hooks.slack.com/services/T00000000/B00000000/XXXX \
  -H 'Content-type: application/json' \
  -d '{"text":"Test message from SME Booking"}'

# Should see message in #alerts channel
```

### Step 5: Auto-send Alerts

Alerts will auto-send to Slack when:
- Error rate > 1%
- Slow API request (>300ms)
- Critical error occurs
- Performance budget exceeded

---

## 6. PagerDuty Setup (Optional, for On-Call)

### Step 1: Create PagerDuty Account

1. Go to https://www.pagerduty.com
2. Create account
3. Create "Service"
   - Name: "SME Booking"
   - Escalation: Default

### Step 2: Get Integration Key

1. Service → Integrations
2. Add Integration → Sentry
3. Copy Integration Key

### Step 3: Connect in Sentry

1. **Sentry → Settings → Integrations → PagerDuty**
2. Click "Install"
3. Paste Integration Key
4. Configure alerts to create incidents

---

## 7. Verify All Integrations

### Checklist

- [ ] Sentry DSN in .env (both client and server)
- [ ] Google Analytics Measurement ID in .env
- [ ] Web Vitals monitoring initialized
- [ ] Events tracked in GA4
- [ ] Error caught by Sentry
- [ ] Slack webhook working
- [ ] Email alerts configured
- [ ] Health check endpoint working

### Test Commands

```bash
# Test Sentry error capture
npm run dev
# In browser: fetch('/api/test-error')
# Check Sentry dashboard after 1-2 minutes

# Test GA4 events
# In browser console:
# gtag('event', 'test_event', { test: 'value' })
# Check GA4 Real-time

# Test health endpoint
curl http://localhost:3000/api/health

# Test Web Vitals
# Open DevTools → Performance → record
# Refresh page → stop recording
# Check for LCP, FID, CLS metrics
```

---

## 8. Production Deployment

### Before Going Live

1. **Update DNS Records**
   - Point domain to production server

2. **Set Environment Variables**
   - Update SENTRY_DSN for production
   - Update GA4 Measurement ID (if different)
   - Enable email/Slack alerts

3. **Create Release in Sentry**
   ```bash
   npm version patch
   git tag v0.1.1
   # In Sentry: Create release v0.1.1
   ```

4. **Test Error Handling**
   - Trigger test error
   - Verify Sentry captures it
   - Verify Slack/email alert sent

5. **Monitor First 24 Hours**
   - Check error rate
   - Monitor performance metrics
   - Review customer feedback

### Production Environment Variables

```env
# Sentry (Production)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_ENVIRONMENT=production

# Google Analytics
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Alerts
ENABLE_EMAIL_ALERTS=true
ENABLE_SLACK_ALERTS=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_RETENTION_DAYS=30
```

---

## 9. Troubleshooting

### Sentry not capturing errors

**Debug:**
```bash
# Check DSN
echo $NEXT_PUBLIC_SENTRY_DSN

# Enable debug mode
export SENTRY_DEBUG=true
npm run dev

# Trigger error
# Check browser console for Sentry logs
```

**Fix:**
- Verify DSN is correct
- Check network tab (block Sentry requests?)
- Ensure error is not filtered

### GA4 not tracking events

**Debug:**
```bash
# Open DevTools → Network
# Filter for "analytics"
# Look for requests to www.googletagmanager.com

# In console:
window.gtag('event', 'test', { test: 'value' })

# Check GA4 Real-time after 30s
```

**Fix:**
- Verify Measurement ID is correct
- Check for ad blockers
- Ensure gtag script loaded

### Web Vitals not reported

**Debug:**
```typescript
// In app:
import { getPerformanceMetrics } from "@/lib/metrics/web-vitals";

console.log(getPerformanceMetrics());
```

**Fix:**
- Verify `initWebVitalsMonitoring()` called
- Check browser network tab
- Verify `/api/v1/metrics/web-vitals` endpoint accessible

---

## 10. Next Steps

1. ✅ Setup Sentry
2. ✅ Setup Google Analytics 4
3. ✅ Setup Web Vitals monitoring
4. ✅ Configure alerts
5. 📊 Review dashboards daily
6. 🚀 Deploy to production
7. 📈 Monitor metrics and optimize

---

## Support Resources

- **Sentry Docs:** https://docs.sentry.io/
- **Google Analytics 4:** https://analytics.google.com/
- **Web Vitals:** https://web.dev/vitals/
- **Next.js Monitoring:** https://nextjs.org/docs/pages/building-your-application/optimizing/monitoring

---

## Monitoring Contacts

| Role | Responsibility | Contact |
|------|-----------------|---------|
| DevOps | Sentry, Infrastructure | infra@sme-booking.com |
| Backend | Server errors, API performance | backend@sme-booking.com |
| Frontend | Client errors, Web Vitals | frontend@sme-booking.com |
| Product | Analytics, Funnel metrics | product@sme-booking.com |
| Executive | Business metrics, Revenue | exec@sme-booking.com |

---

## Change Log

- **v0.1.0** - Initial monitoring setup
- Phase 5.3 - Error tracking, performance monitoring, analytics

---

**Last Updated:** 2025-02-07
**Next Review:** 2025-03-07
