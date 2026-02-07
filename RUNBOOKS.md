# Incident Runbooks

**Phase 5.3 - Emergency Response Procedures**

## Overview

This document provides step-by-step procedures for resolving common critical issues in the SME Booking App.

Each runbook includes:
- **Symptoms:** How to recognize the issue
- **Impact:** Who is affected
- **Investigation:** How to diagnose
- **Resolution:** How to fix
- **Prevention:** How to avoid next time

---

## 1. Error Rate Spike (>1%)

### Symptoms
- Sentry alert: "Error rate exceeded 1%"
- Slack notification in #alerts
- Users reporting broken features
- API requests returning 5xx errors

### Impact
- **Severity:** CRITICAL
- **Duration:** Ongoing (TBD)
- **Users Affected:** All users
- **Revenue Impact:** Potential lost bookings

### Investigation

**Step 1: Check Sentry Dashboard**
```
https://sentry.io/organizations/your-org/issues/
```

1. Look at "Issues" sorted by "Latest"
2. Find most recent error
3. Check:
   - Error message
   - Stack trace
   - Affected endpoints
   - How many times (last hour)
   - Users affected

**Step 2: Check Specific Endpoint**
```bash
# Health check
curl http://localhost:3000/api/health

# Look for:
# - totalErrors > totalRequests * 0.01
# - slow requests (>300ms)
# - endpoint with most errors
```

**Step 3: Check Logs**
```bash
# Last 50 errors
grep "level.*error" logs/*.json | tail -50

# Count errors by type
grep "level.*error" logs/*.json | jq '.error' | sort | uniq -c | sort -rn
```

**Step 4: Check Database Connection**
```typescript
// In Node REPL or test:
const { databaseMonitor } = require('@/lib/monitoring/server-monitoring');
const health = await databaseMonitor.checkConnection(prisma);
console.log(health); // { healthy: boolean }
```

**Step 5: Check Third-Party Services**
- Google Calendar API status
- Twilio SMS service
- SendGrid email service
- Stripe/payment processor

### Root Causes & Fixes

#### Cause 1: Database Connection Pool Exhausted

**Symptoms:**
- "connection timeout" errors
- Database operations hanging
- Error rate 100%

**Fix:**
1. **Increase connection pool**
   ```env
   DATABASE_POOL_SIZE=20 # Increase from default
   ```

2. **Restart application**
   ```bash
   npm run dev
   # or in production
   systemctl restart sme-booking-app
   ```

3. **Monitor recovery**
   - Check error rate in Sentry
   - Should drop to <1% within 1 minute

**Prevention:**
- Add connection pool monitoring
- Set up auto-scaling for high traffic
- Implement connection timeout handling

---

#### Cause 2: Code Deployment Issue

**Symptoms:**
- Errors started after recent deployment
- Specific new feature broken
- Error message mentions new code

**Fix:**
1. **Check recent commits**
   ```bash
   git log --oneline -10
   ```

2. **Identify problematic commit**
   - Check Sentry Releases tab
   - Look at errors per version
   - Find version where errors increased

3. **Rollback**
   ```bash
   # Revert to previous working version
   git revert HEAD
   git push
   npm run build
   npm start
   ```

4. **Verify recovery**
   - Monitor error rate
   - Should drop within 2-5 minutes
   - Verify users can book again

5. **Fix code issue**
   - Review rollback commit
   - Fix issue in new branch
   - Test thoroughly
   - Redeploy

**Prevention:**
- Test in staging before production
- Use feature flags for risky changes
- Monitor error rates 15 min after deploy
- Have rollback procedures in place

---

#### Cause 3: Third-Party API Failure

**Symptoms:**
- Errors mention "Calendar", "SMS", "Email"
- Bookings can't be created (calendar sync fails)
- Confirmation emails not sent

**Fix:**

**If Google Calendar down:**
```bash
# Fallback to mock mode
export GOOGLE_CALENDAR_MOCK=true
npm run dev
```

**If Twilio down:**
```bash
# Check status: https://status.twilio.com
# Fallback: enable email-only confirmations
export TWILIO_MOCK=true
```

**If SendGrid down:**
```bash
# Check status: https://www.sendgridstatus.com
# Use alternative: notify user in-app instead
export SENDGRID_MOCK=true
```

**Recovery:**
1. Switch to mock mode (if applicable)
2. Create incident ticket with provider
3. Monitor provider status page
4. When recovered, switch back to real API

**Prevention:**
- Monitor provider status pages
- Implement graceful degradation (mock fallback)
- Have multi-channel notifications (SMS + Email)
- Set up alerts for provider issues

---

#### Cause 4: Memory Leak

**Symptoms:**
- Error rate increases over time
- Memory usage grows gradually
- Application crashes after X hours
- "out of memory" errors

**Fix:**
1. **Check memory usage**
   ```bash
   curl http://localhost:3000/api/health | jq '.memory'
   # {
   #   "heapUsed": 512,    # MB
   #   "heapTotal": 1024,  # MB
   #   "external": 50
   # }
   ```

2. **Identify memory leak**
   ```bash
   # Use Chrome DevTools
   # 1. Open chrome://inspect
   # 2. Click "inspect" on Node.js app
   # 3. Go to Memory tab
   # 4. Take heap snapshot
   # 5. Analyze retained objects
   ```

3. **Find leak source**
   - Check recent code changes
   - Look for:
     - Event listeners not removed
     - Caches growing unbounded
     - Global variables accumulating
     - Circular references

4. **Fix leak**
   - Remove event listeners in cleanup
   - Add cache eviction (TTL)
   - Clear globals on request end
   - Break circular references

5. **Restart application**
   ```bash
   npm run dev
   # Memory should stabilize
   ```

**Prevention:**
- Use memory profiling in development
- Write cleanup code (useEffect return)
- Implement cache size limits
- Monitor memory monthly

---

### Resolution Summary

**Immediate Actions (0-5 min):**
1. ✅ Check Sentry for most common error
2. ✅ Check health endpoint
3. ✅ Determine root cause (DB, deploy, API, memory)

**Short-term (5-30 min):**
1. ✅ Apply appropriate fix
2. ✅ Verify error rate dropping
3. ✅ Notify team in Slack

**Follow-up (after incident):**
1. ✅ Document root cause
2. ✅ Implement prevention measure
3. ✅ Post-mortem meeting
4. ✅ Update monitoring/alerts

---

## 2. Slow Database Queries

### Symptoms
- API requests timing out (>5 seconds)
- "connection timeout" errors
- High database CPU usage
- Sentry warnings: "Slow database query"

### Impact
- **Severity:** HIGH
- **Duration:** Ongoing
- **Users Affected:** All users (slow bookings)
- **Revenue Impact:** Lost bookings due to timeouts

### Investigation

**Step 1: Check Slow Queries**
```bash
# Enable slow query log (PostgreSQL)
ALTER SYSTEM SET log_min_duration_statement = 100; # 100ms
SELECT pg_reload_conf();

# Check logs
tail -100 /var/log/postgresql/postgresql.log | grep "duration:"
```

**Step 2: Identify Problematic Query**
```typescript
// In app, check query performance
const start = Date.now();
const result = await prisma.booking.findMany({ ... });
const duration = Date.now() - start;
console.log(`Query took ${duration}ms`);
```

**Step 3: Analyze with EXPLAIN**
```sql
EXPLAIN ANALYZE
SELECT * FROM booking WHERE status = 'confirmed' AND booking_time > NOW();

-- Look for:
-- - Sequential scans (should be index scans)
-- - High execution time
-- - Rows retrieved vs returned
```

**Step 4: Check Indexes**
```sql
-- List all indexes
\d booking

-- Check if index on (status, booking_time) exists
-- If not, create it
CREATE INDEX idx_booking_status_time ON booking(status, booking_time);
```

### Common Causes & Fixes

#### Missing Index
```sql
-- Add missing index
CREATE INDEX idx_customer_bookings ON booking(customer_id, created_at);

-- Verify index is used
EXPLAIN ANALYZE
SELECT * FROM booking WHERE customer_id = 123 ORDER BY created_at DESC;
```

#### N+1 Query Problem
```typescript
// Bad: N+1 queries
const bookings = await prisma.booking.findMany();
for (const booking of bookings) {
  const customer = await prisma.customer.findUnique({
    where: { id: booking.customer_id }
  }); // Query per booking!
}

// Good: Use include
const bookings = await prisma.booking.findMany({
  include: { customer: true } // 1 query instead of N
});
```

#### Large Data Scan
```typescript
// Bad: Scan all rows
const bookings = await prisma.booking.findMany({
  where: { status: 'confirmed' }
  // Could be millions of rows
});

// Good: Use pagination
const bookings = await prisma.booking.findMany({
  where: { status: 'confirmed' },
  skip: 0,
  take: 100
});
```

### Resolution Summary

1. **Identify slow query** (1 min)
2. **Analyze with EXPLAIN** (2 min)
3. **Add missing index** OR **fix N+1 query** (5 min)
4. **Test performance** (2 min)
5. **Deploy fix** (5 min)

---

## 3. Calendar Sync Failures

### Symptoms
- Bookings created but not in calendar
- Sentry: "Calendar API error"
- `CalendarSyncLog` shows "failed" status
- Users can't see bookings in external calendars

### Impact
- **Severity:** MEDIUM
- **Duration:** Ongoing
- **Users Affected:** SMBs using calendar sync
- **Revenue Impact:** Missed bookings due to no reminder

### Investigation

**Step 1: Check Sync Logs**
```typescript
const syncLogs = await prisma.calendarSyncLog.findMany({
  where: { status: 'failed' },
  orderBy: { createdAt: 'desc' },
  take: 20
});
console.log(syncLogs);
```

**Step 2: Check OAuth Token**
```typescript
const creds = await prisma.calendarCredentials.findUnique({
  where: { businessId: 1 }
});

if (!creds) console.log("No credentials for business");
if (new Date() > creds.expiresAt) console.log("Token expired");
```

**Step 3: Test Calendar API**
```bash
# If using mock mode
export GOOGLE_CALENDAR_MOCK=true
npm run dev
# Try creating booking - should work

# If using real API, check Google Cloud Console
# - Credentials are valid
# - API is enabled
# - Quota not exceeded
```

**Step 4: Check Error Details**
```typescript
const failedSync = await prisma.calendarSyncLog.findFirst({
  where: { status: 'failed' },
  orderBy: { createdAt: 'desc' }
});
console.log(failedSync.details); // Error message
```

### Common Causes & Fixes

#### Token Expired
```typescript
// Fix: Refresh token
const refreshed = await refreshTokenIfNeeded(businessId);
if (refreshed) console.log("Token refreshed");

// Or manually refresh
const newToken = await refreshGoogleToken(businessId);
```

#### API Not Enabled
1. Go to https://console.cloud.google.com
2. Select project
3. APIs & Services → Enabled APIs
4. Search "Google Calendar API"
5. Click "Enable" if not enabled

#### Quota Exceeded
1. Check Google Cloud Console
2. APIs & Services → Quotas
3. Look for "Calendar API"
4. If at limit, request quota increase

#### Invalid Credentials
```bash
# Re-authenticate
export GOOGLE_OAUTH_FLOW=true
npm run dev
# User sees OAuth dialog
# Completes auth flow
# New credentials stored
```

### Resolution Summary

1. **Check sync logs** (1 min)
2. **Check token validity** (1 min)
3. **Fix root cause** (depends)
   - Refresh token: 30 sec
   - Re-authenticate: 2 min
   - Enable API: 1 min
4. **Retry sync** (30 sec)
5. **Verify in Google Calendar** (1 min)

---

## 4. High Booking Failure Rate

### Symptoms
- Many bookings showing "cancelled" status
- `booking_cancelled` spike in analytics
- Customers complaining about confirmation issues
- Low booking completion rate in funnel

### Impact
- **Severity:** CRITICAL
- **Duration:** Ongoing
- **Users Affected:** All booking customers
- **Revenue Impact:** Lost revenue per failed booking

### Investigation

**Step 1: Check Booking Status Distribution**
```typescript
const statuses = await prisma.booking.groupBy({
  by: ['status'],
  _count: true,
  orderBy: { _count: { desc: true } }
});
// Output: { status: 'pending', _count: 50 }, { status: 'cancelled', _count: 20 }, ...
```

**Step 2: Check Cancellation Reasons**
```typescript
const cancelled = await prisma.booking.findMany({
  where: { status: 'cancelled' },
  orderBy: { updatedAt: 'desc' },
  take: 20
});
// Look at 'notes' field for cancellation reason
```

**Step 3: Check Conflict Detection Logic**
```bash
# Test availability calculation
curl "http://localhost:3000/api/v1/availability?service_type=plumbing&date=2025-02-10"

# Should return available slots
# If returns empty, conflict detection is too strict
```

**Step 4: Test Booking Flow**
```bash
# Attempt to create booking
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test",
    "email": "test@example.com",
    "phone": "555-1234",
    "address": "123 Main St",
    "service_type": "plumbing",
    "expert_id": 1,
    "booking_time": "2025-02-10T14:00:00Z"
  }'

# Check response for error message
```

### Common Causes & Fixes

#### Conflict Detection Too Strict
```typescript
// Check buffer times
const buffers = {
  plumbing: 15,      // 15 min between appointments
  electrical: 30,    // 30 min
  hvac: 45           // 45 min
};

// Reduce if too aggressive
const buffers = {
  plumbing: 0,       // No buffer
  electrical: 15,    // 15 min only
  hvac: 30           // 30 min only
};
```

#### Availability Calculation Error
```typescript
// Test availability endpoint
const response = await fetch(
  '/api/v1/availability?service_type=plumbing&date=2025-02-10'
);
const { available_slots } = await response.json();
console.log(available_slots.length); // Should be >0

// If 0, check:
// 1. Technician assigned to service?
// 2. Business hours correct?
// 3. Calendar not full?
```

#### Payment Processing Failure
```bash
# Check payment logs
grep "payment" logs/*.json | grep "failed"

# Test payment processor
# - Check Stripe/payment API status
# - Verify API key is valid
# - Check for quota limits
```

#### Confirmation Not Sent
```bash
# Check email logs
grep "confirmation" logs/*.json | grep "email"

# Test SendGrid
curl -X POST "https://api.sendgrid.com/v3/mail/send" \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -d '{"personalizations":[{"to":[{"email":"test@example.com"}]}],...}'
```

### Resolution Summary

1. **Check cancellation rate** (2 min)
2. **Identify cause** (5 min)
   - Conflict detection
   - Availability calculation
   - Payment failure
   - Email not sent
3. **Apply fix** (5-30 min depending on cause)
4. **Test booking flow** (2 min)
5. **Monitor recovery** (next 30 min)

---

## 5. Memory Leak / Out of Memory

### Symptoms
- "JavaScript heap out of memory" error
- Application crashes without error message
- Memory usage grows over time
- Error: "ENOMEM: out of memory"

### Impact
- **Severity:** CRITICAL
- **Duration:** Until restart
- **Users Affected:** All users (app down)
- **Revenue Impact:** 100% booking loss during downtime

### Investigation

**Step 1: Check Memory Usage**
```bash
# Current memory
curl http://localhost:3000/api/health | jq '.memory'

# Historical trend
for i in {1..10}; do
  curl -s http://localhost:3000/api/health | jq '.memory.heapUsed'
  sleep 10
done
```

**Step 2: Identify Memory Leak**
```bash
# Use Node.js heap snapshots
# 1. Enable inspector
node --inspect index.js

# 2. Open chrome://inspect in Chrome
# 3. Click "inspect" on your app
# 4. Go to Memory tab
# 5. Take heap snapshot
# 6. Take another after 5 minutes
# 7. Compare to see what's growing
```

**Step 3: Find Leak in Code**
```bash
# Look for common patterns
grep -r "addEventListener" src/ | grep -v "removeEventListener"
grep -r "setInterval" src/ | grep -v "clearInterval"
grep -r "cache\[" src/ # Unbounded cache?
```

### Common Causes & Fixes

#### Event Listeners Not Cleaned Up
```typescript
// Bad
window.addEventListener('resize', handleResize);

// Good
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

#### Cache Growing Unbounded
```typescript
// Bad
const cache = {};
function cacheValue(key, value) {
  cache[key] = value; // Grows forever
}

// Good
const cache = new Map();
const MAX_SIZE = 1000;
function cacheValue(key, value) {
  if (cache.size >= MAX_SIZE) {
    cache.delete(cache.keys().next().value); // FIFO eviction
  }
  cache.set(key, value);
}
```

#### Database Connections Not Released
```typescript
// Bad
const result = await prisma.booking.findMany();
// Connection held until garbage collection

// Good
const result = await prisma.booking.findMany();
await prisma.$disconnect(); // Explicitly release
```

### Resolution Summary

1. **Restart app** (immediate, 1 min)
   ```bash
   npm run dev
   ```

2. **Find leak** (30 min)
   - Use heap snapshots
   - Search code for patterns

3. **Fix leak** (varies)
   - Add cleanup code
   - Implement cache limits
   - Release connections

4. **Test fix** (10 min)
   - Monitor memory for 5 minutes
   - Should stabilize

5. **Deploy** (5 min)

---

## 6. Database Connection Issues

### Symptoms
- "connection timeout" errors
- "too many connections" error
- Database queries hanging
- "ECONNREFUSED" error

### Impact
- **Severity:** CRITICAL
- **Duration:** Ongoing
- **Users Affected:** All users
- **Revenue Impact:** Can't create bookings

### Investigation

**Step 1: Check Database Connectivity**
```bash
# Test connection
psql -h localhost -U postgres -d sme_booking -c "SELECT 1;"

# Or via app
curl http://localhost:3000/api/health | jq '.metrics'
```

**Step 2: Check Connection Pool Status**
```sql
-- PostgreSQL
SELECT count(*) as total_connections FROM pg_stat_activity;
SELECT max_conn, used, reserved, available FROM pg_settings WHERE name = 'max_connections';
```

**Step 3: Check for Hanging Queries**
```sql
-- Find long-running queries
SELECT pid, usename, state, query_start, query
FROM pg_stat_activity
WHERE state != 'idle' AND query_start < now() - interval '10 minutes';

-- Kill long query if needed
SELECT pg_terminate_backend(pid);
```

### Common Causes & Fixes

#### Connection Pool Exhausted
```bash
# Increase pool size in .env
DATABASE_POOL_SIZE=30 # Increase from 10

# Restart app
npm run dev
```

#### Database Locked
```sql
-- Check locks
SELECT * FROM pg_locks;

-- Kill blocking query
SELECT pg_terminate_backend(pid);
```

#### Network Connectivity
```bash
# Test connection
ping database.example.com
nc -v database.example.com 5432

# Check firewall rules
# - Ensure port 5432 open
# - Check security groups (AWS)
```

### Resolution Summary

1. **Test connection** (1 min)
2. **Check pool status** (2 min)
3. **Kill hanging queries** if needed (1 min)
4. **Increase pool size** if needed (1 min)
5. **Restart app** (1 min)
6. **Verify recovery** (2 min)

---

## 7. Critical Error Response Template

Use this template when responding to any critical incident:

```
INCIDENT RESPONSE - [SERVICE NAME]
================================

TIME: [YYYY-MM-DD HH:MM:SS UTC]
SEVERITY: [CRITICAL/HIGH/MEDIUM/LOW]
STATUS: [INVESTIGATING/MITIGATING/MONITORING/RESOLVED]

IMPACT:
- Users Affected: [number/percentage]
- Features Down: [list]
- Revenue Impact: [$/hour if applicable]

ROOT CAUSE:
[What happened]

ACTIONS TAKEN:
- [Action 1] at [time]
- [Action 2] at [time]

CURRENT STATUS:
- Error Rate: [%]
- Recovery ETA: [time]

NEXT STEPS:
- [Step 1]
- [Step 2]

UPDATES:
[HH:MM] - Status update
[HH:MM] - Status update
```

---

## 8. Escalation Path

| Severity | Detection | First Response | Escalation |
|----------|-----------|-----------------|------------|
| CRITICAL | <1 min (Auto-alert) | 5 min (DevOps) | 15 min (CTO) |
| HIGH | <5 min (Team alert) | 15 min | 30 min (Manager) |
| MEDIUM | <30 min (Review) | 1 hour | Daily standup |
| LOW | During review | 1-2 days | Next sprint |

---

## 9. Post-Incident Checklist

After every incident, complete:

- [ ] Document root cause
- [ ] Identify prevention measure
- [ ] Update monitoring/alerts
- [ ] Schedule post-mortem meeting
- [ ] Implement fix (if code issue)
- [ ] Deploy fix to production
- [ ] Add test case (if applicable)
- [ ] Update runbook with learnings
- [ ] Share incident report with team

---

## 10. Quick Reference Commands

```bash
# Check health
curl http://localhost:3000/api/health | jq .

# Check recent errors (Sentry)
# https://sentry.io/organizations/your-org/issues/

# Check logs
tail -100 logs/*.json | jq '.msg'

# Restart app
npm run dev

# Test endpoint
curl http://localhost:3000/api/v1/availability

# Check database
psql -h localhost -U postgres -d sme_booking -c "SELECT COUNT(*) FROM booking;"

# Monitor in real-time
watch -n 5 'curl -s http://localhost:3000/api/health | jq ".metrics.summary"'
```

---

**Document Version:** 1.0
**Last Updated:** 2025-02-07
**Next Review:** 2025-03-07
