# Monitoring Dashboards Guide

**Phase 5.3 - Dashboard Configuration and Usage**

## Overview

This guide describes the monitoring dashboards available for the SME Booking App MVP, including setup instructions and key metrics to monitor.

---

## 1. Sentry Dashboard

### Purpose
Real-time error tracking, performance monitoring, and crash reporting.

### URL
```
https://sentry.io/organizations/your-org-name/
```

### Setup

1. **Create Sentry Account**
   - Go to https://sentry.io
   - Create organization
   - Create project for "SME Booking App"

2. **Get Project DSN**
   - Project Settings → Client Keys
   - Copy DSN for client and server
   - Add to `.env` files

3. **Enable Integrations**
   - Slack (for alerts)
   - GitHub (for release tracking)
   - PagerDuty (for on-call)

### Key Dashboards

#### Issues Dashboard
**Path:** Issues → All Issues

**What to Monitor:**
- Error frequency and trend
- Most affected users
- Most affected pages/endpoints
- Error status (new, regressed, resolved)

**Ideal State:**
- No critical/error-level issues
- Resolved issues: >90%
- New issues: <5 per day

**Red Flags:**
- Error spike (2-3x increase)
- Same error recurring
- Error rate >1%

#### Performance Dashboard
**Path:** Performance

**What to Monitor:**
- Page load time trend
- API request latency
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)

**Ideal State:**
- LCP: <2.5 seconds
- FID: <100ms
- CLS: <0.1
- API response: <300ms

**Red Flags:**
- Any metric trending upward
- Performance budget exceeded
- Regression after deployment

#### Release Dashboard
**Path:** Releases

**What to Monitor:**
- Errors per release
- Adoption rate
- Session count by release

**Process:**
- Set release version in `package.json`
- Create release in Sentry after deployment
- Track errors by release
- Compare error rates between versions

#### Alerts Configuration
**Path:** Alerts → Alert Rules

**Recommended Rules:**

1. **Error Rate Spike**
   - Condition: Error count exceeds 10 in 5 minutes
   - Action: Send to #alerts Slack channel
   - Severity: Critical

2. **Performance Degradation**
   - Condition: Transaction duration exceeds 2 seconds for 5 minutes
   - Action: Send to #performance Slack channel
   - Severity: Warning

3. **Memory Issues**
   - Condition: Memory usage exceeds 1GB
   - Action: Send to #infrastructure Slack channel
   - Severity: Critical

4. **Unhandled Promise Rejection**
   - Condition: New type of promise rejection
   - Action: Send to #alerts Slack channel
   - Severity: Error

### Important Metrics

| Metric | Ideal | Warning | Critical |
|--------|-------|---------|----------|
| Error Count (1h) | <10 | 10-50 | >50 |
| Error Rate | <1% | 1-2% | >2% |
| Page Load (p95) | <2.5s | 2.5-4s | >4s |
| API Response (p95) | <300ms | 300-500ms | >500ms |
| Crash Rate | <0.1% | 0.1-0.5% | >0.5% |

---

## 2. Google Analytics 4 Dashboard

### Purpose
User behavior tracking, conversion funnels, and business metrics.

### URL
```
https://analytics.google.com/
```

### Setup

1. **Create GA4 Property**
   - Google Analytics → Create Property
   - Select "Web"
   - Enter website URL
   - Get Measurement ID (G-XXXXXXXXXX)

2. **Add Measurement ID**
   ```env
   NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

3. **Create Data Streams**
   - Admin → Data Streams → Add Stream
   - Web stream for your domain
   - Copy Measurement ID

4. **Setup Conversion Tracking**
   - Admin → Conversions
   - Create conversion: "booking_confirmed"
   - Map to event: "booking_confirmed"
   - Value: "transaction_id"

### Key Reports

#### Real-Time Dashboard
**Path:** Realtime → Overview

**What to Monitor:**
- Active users right now
- Top pages by traffic
- Top events occurring
- Geographic distribution

**Use Cases:**
- Monitor campaign launches
- Watch for spikes/drops
- Verify event tracking works

#### User Dashboard
**Path:** Reports → User → Overview

**What to Monitor:**
- Total active users
- New vs returning users
- Session duration trend
- Bounce rate

**Ideal State:**
- Growing user base
- >30% returning users
- Session duration: >3 minutes
- Bounce rate: <50%

#### Acquisition Dashboard
**Path:** Reports → Life Cycle → Acquisition

**What to Monitor:**
- Traffic source (organic, paid, direct)
- New user acquisition rate
- Device/browser breakdown

**Metrics:**
- Users by source
- Conversion rate by source
- Cost per acquisition (if using ads)

#### Conversion Funnel Dashboard
**Path:** Reports → Funnel Analysis → Create New

**Funnel Sequence:**
1. `chat_started` (Step 1)
2. `booking_form_opened` (Step 2)
3. `booking_created` (Step 3)
4. `booking_confirmed` (Step 4)
5. `dashboard_viewed` (Step 5)

**Key Metrics:**
- Step 1 → Step 2: Should be >70% (most users progress)
- Step 2 → Step 3: Should be >50% (form completion)
- Step 3 → Step 4: Should be >80% (confirmation)
- Overall funnel: Should be >35% (chat to dashboard)

**Red Flags:**
- Drop-off at Step 2 (form complexity?)
- Drop-off at Step 3 (payment issues?)
- Drop-off at Step 4 (confirmation problems?)

#### Custom Report: Booking Metrics
**Path:** Reports → Create Custom Report**

**Dimensions:**
- Event name
- Service type
- Device
- Geographic location

**Metrics:**
- Event count
- Users
- Conversion rate

**Create Report:**
1. Click "Create Custom Report"
2. Select dimensions:
   - Event name
   - Service type
3. Select metrics:
   - Event count
   - Conversion rate

---

## 3. Custom Metrics API Dashboard

### Purpose
Display real-time server metrics and health status.

### Endpoints

#### Health Check
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
    "endpoints": [
      {
        "endpoint": "GET /api/v1/availability",
        "totalRequests": 142,
        "totalErrors": 2,
        "averageResponseTime": 245,
        "slowRequests": 8,
        "errorRate": "1.41%"
      }
    ],
    "summary": {
      "totalEndpoints": 12,
      "totalRequests": 5432,
      "totalErrors": 23,
      "averageResponseTime": 245
    }
  }
}
```

#### Query for Dashboard
```typescript
async function fetchMetrics() {
  const response = await fetch('/api/health');
  const data = await response.json();
  
  return {
    health: data.status,
    uptime: data.uptime.formatted,
    memory: data.memory,
    endpoints: data.metrics.endpoints,
    summary: data.metrics.summary,
  };
}
```

### Create Custom Dashboard

**Option 1: Simple HTML Dashboard**
```html
<div id="metrics-dashboard">
  <h1>Server Metrics</h1>
  <p>Status: <span id="status"></span></p>
  <p>Uptime: <span id="uptime"></span></p>
  <p>Memory: <span id="memory"></span></p>
  <p>Avg Response Time: <span id="response-time"></span>ms</p>
  <p>Error Rate: <span id="error-rate"></span>%</p>
</div>

<script>
  async function updateMetrics() {
    const data = await fetchMetrics();
    document.getElementById('status').textContent = data.health;
    document.getElementById('uptime').textContent = data.uptime;
    document.getElementById('memory').textContent = 
      `${data.memory.heapUsed}MB / ${data.memory.heapTotal}MB`;
    document.getElementById('response-time').textContent = 
      data.summary.averageResponseTime;
    document.getElementById('error-rate').textContent = 
      ((data.summary.totalErrors / data.summary.totalRequests) * 100).toFixed(2);
  }
  
  updateMetrics();
  setInterval(updateMetrics, 5000); // Update every 5s
</script>
```

**Option 2: Grafana Integration**
1. Setup Grafana server
2. Add data source: HTTP API
3. Create dashboard panels:
   - Health status
   - Request latency
   - Error rate
   - Memory usage

**Option 3: Datadog/New Relic**
- Integrate via APIs
- Sync metrics to platform
- Create custom dashboards

---

## 4. Business Metrics Dashboard

### Purpose
Track revenue, bookings, and customer metrics for business intelligence.

### Data Source
Business metrics logged to `BusinessMetricEvent` events.

### Key Metrics to Track

#### Booking Metrics
```typescript
interface BookingMetrics {
  totalCreated: number;      // All bookings created
  totalConfirmed: number;    // Confirmed by customer
  totalCancelled: number;    // Cancelled by customer
  totalCompleted: number;    // Service completed
  cancellationRate: number;  // cancelled / created %
  completionRate: number;    // completed / created %
  averageTimeToConfirm: number; // minutes
}
```

#### Revenue Metrics
```typescript
interface RevenueMetrics {
  totalReceived: number;     // Payment received
  totalFailed: number;       // Payment failed
  totalRefunded: number;     // Refunds issued
  successRate: number;       // received / attempted %
  averageBookingValue: number; // Revenue per booking
}
```

#### Customer Metrics
```typescript
interface CustomerMetrics {
  newCustomers: number;      // New signups
  activeCustomers: number;   // With bookings this period
  repeatCustomers: number;   // Booked multiple times
  churnRate: number;         // Inactive customers %
  customerLifetimeValue: number;
}
```

### Create Query

```typescript
// Query business metrics from logs
async function getBusinessMetricsReport(period: 'day' | 'week' | 'month') {
  const response = await fetch(`/api/v1/metrics/business?period=${period}`);
  return response.json();
}
```

---

## 5. Performance Budget Dashboard

### Purpose
Track performance metrics against defined budgets.

### Budgets Defined

| Metric | Budget | Current | Status |
|--------|--------|---------|--------|
| Page Load | 3s | 2.4s | ✅ OK |
| API Response | 500ms | 245ms | ✅ OK |
| LCP | 2.5s | 2.1s | ✅ OK |
| Navigation | 1s | 0.8s | ✅ OK |

### Monitor in Sentry

1. Go to Performance tab
2. Search for transactions
3. Compare actual vs budget
4. Review slow transactions

### Alert Rules

**Performance Budget Exceeded:**
- Condition: LCP > 2.5s for 5 minutes
- Action: Send to #performance Slack
- Severity: Warning

---

## 6. Dashboard Maintenance Checklist

### Daily
- [ ] Check Sentry for new critical errors
- [ ] Review error rate trend
- [ ] Check API response time (p95)

### Weekly
- [ ] Review booking funnel metrics
- [ ] Check customer acquisition trend
- [ ] Review performance metrics
- [ ] Check cache hit rate
- [ ] Review database query performance

### Monthly
- [ ] Analyze full booking pipeline
- [ ] Revenue report
- [ ] Customer churn analysis
- [ ] Performance trend analysis
- [ ] Capacity planning review

---

## 7. Dashboard Access Control

### Recommended Access Levels

| Role | Sentry | GA4 | Custom API | Business |
|------|--------|-----|-----------|----------|
| Dev | View + Edit | View | View | View |
| QA | View | View | View | View |
| Product | View | Admin | View | Admin |
| Sales | - | View | - | Admin |
| Exec | - | View | - | View |

### Setup in Each Platform

**Sentry:**
- Project Settings → Team → Members
- Assign roles (Viewer, Admin)

**Google Analytics:**
- Admin → Account/Property → User Management
- Add emails with appropriate roles

**Custom API:**
- Implement API key-based auth
- Different keys for different roles

---

## 8. Alert Integration with Slack

### Setup Slack Alerts

1. **Create Slack App**
   - Go to api.slack.com
   - Create New App
   - Enable Incoming Webhooks
   - Create Webhook URL

2. **Configure in Sentry**
   - Settings → Integrations → Slack
   - Add Webhook URL
   - Select channels for each alert type

3. **Create Alert Rules**
   - Alerts → Alert Rules → Create Rule
   - Condition: Error rate spike
   - Action: Send to #alerts
   - Enable notifications

### Slack Channels Recommended

- `#alerts` - Critical issues (errors, downtime)
- `#performance` - Performance degradation
- `#bookings` - Booking metrics & anomalies
- `#revenue` - Payment issues
- `#monitoring` - All monitoring events

---

## 9. Testing Dashboards

### Verify Sentry Integration
```typescript
// Test error capture
try {
  throw new Error("Test error");
} catch (error) {
  Sentry.captureException(error);
}

// Check Sentry dashboard after 1-2 minutes
// Should see "Test error" in Issues
```

### Verify GA4 Integration
```typescript
// Test event
analytics.trackEvent("test_event", {
  test_param: "test_value"
});

// Check GA4 Real-time after 30 seconds
// Should see event in Real-time → Events
```

### Verify Custom Metrics
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Should return healthy status and metrics
```

---

## 10. Troubleshooting

### Sentry Not Receiving Events

**Check:**
1. DSN configured correctly
2. Environment variables set
3. Browser console for errors
4. Network tab for failed requests

**Fix:**
```bash
# Reinstall Sentry
npm install @sentry/nextjs@latest

# Check DSN
echo $NEXT_PUBLIC_SENTRY_DSN

# Test capture
npm run test:sentry
```

### GA4 Events Not Showing

**Check:**
1. Measurement ID correct
2. gtag script loaded
3. Browser console for warnings
4. Check GA4 debugView

**Fix:**
```bash
# Enable GA4 debug
# In browser: 
# gtag('config', 'MEASUREMENT_ID', { 'debug_mode': true });

# Check events in Real-time after 30s
```

### Missing Metrics Data

**Check:**
1. API endpoint accessible
2. Metrics being logged
3. Database storing metrics
4. Clock sync (timestamps)

**Fix:**
```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Check logs
tail -f logs/*.json | grep metrics
```

---

## Summary

This comprehensive dashboard setup provides:

✅ **Real-time error monitoring** (Sentry)
✅ **User behavior analytics** (Google Analytics 4)
✅ **Performance tracking** (Web Vitals)
✅ **Business metrics** (Bookings, Revenue, Customers)
✅ **Server health** (Custom API)
✅ **Alert integration** (Slack, Email, PagerDuty)

---

## Next Steps

1. Create Sentry and GA4 projects
2. Get DSN and Measurement ID
3. Add to environment variables
4. Deploy and verify data flow
5. Customize dashboards for your team
6. Set up alert rules and notifications
