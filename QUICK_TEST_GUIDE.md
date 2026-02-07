# Quick Test Guide - Phase 5.1

**TL;DR:** Run tests with these commands:

```bash
# Run everything (5-15 minutes)
npm run test:coverage && npm run test:e2e && k6 run performance/booking-api.k6.js

# Run just unit tests (5 seconds)
npm run test

# Run just E2E tests (3 minutes)
npm run test:e2e

# Run just accessibility tests (2 minutes)
npx playwright test accessibility.spec.ts

# Check security (30 seconds)
npm audit

# Run performance tests (3 minutes)
k6 run performance/booking-api.k6.js
```

---

## Test Files & What They Test

### Unit Tests (5 seconds)

**Files:**
- `src/lib/bookings/__tests__/validators.test.ts` (65 tests)
- `src/lib/__tests__/utils.test.ts` (60 tests)

**What they test:**
- ✅ Input validation (email, phone, dates)
- ✅ Business logic (durations, time overlaps)
- ✅ Edge cases (long names, special chars)

**Command:** `npm run test`

---

### Integration Tests (10 seconds)

**File:**
- `src/__tests__/api/bookings.integration.test.ts` (35 tests)

**What they test:**
- ✅ API endpoints (POST, GET, PUT, DELETE)
- ✅ Database transactions
- ✅ Status transitions
- ✅ Query operations

**Command:** `npm run test -- integration`

---

### E2E Tests (3 minutes)

**Files:**
- `e2e/booking-flow.spec.ts` (12 scenarios)
- `e2e/accessibility.spec.ts` (13 tests)

**What they test:**
- ✅ Complete user flows
- ✅ Form validation
- ✅ Mobile responsiveness
- ✅ Keyboard navigation
- ✅ WCAG 2.1 AA compliance

**Command:** `npm run test:e2e`

---

### Performance Tests (3 minutes)

**File:**
- `performance/booking-api.k6.js` (6 scenarios)

**What they test:**
- ✅ Response times (p95 <500ms)
- ✅ Error rates (<1%)
- ✅ Throughput (>100 req/s)
- ✅ Load handling (100 concurrent users)

**Command:** `k6 run performance/booking-api.k6.js`

---

### Security Tests (30 seconds)

**File:**
- `SECURITY_TESTING.md` (comprehensive report)

**What they test:**
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF prevention
- ✅ Input validation
- ✅ Dependency vulnerabilities

**Command:** `npm audit`

---

## Coverage Summary

| Test Type | Coverage | Status |
|-----------|----------|--------|
| Unit | 90% | ✅ |
| Integration | 35+ tests | ✅ |
| E2E | 12+ scenarios | ✅ |
| Performance | 6 scenarios | ✅ |
| Security | OWASP Top 10 | ✅ |
| Accessibility | WCAG 2.1 AA | ✅ |

---

## Pre-Flight Checklist

Before running tests:

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (required for E2E tests)
npm run dev &

# 3. Run tests
npm run test:coverage
npm run test:e2e
k6 run performance/booking-api.k6.js
npm audit
```

---

## Interpreting Results

### ✅ Tests Passed
```
PASS src/lib/bookings/__tests__/validators.test.ts
  ✓ should validate a complete valid booking request
  ✓ should accept booking without notes
  ... (63 more tests)
```

### ⚠️ Tests Failed
```
FAIL src/lib/bookings/__tests__/validators.test.ts
  ✗ should validate email format
    Expected: email to be valid
    Received: email is invalid
```

### 📊 Coverage Report
```
File                           | % Stmts | % Lines | % Funcs
validators.ts                 |   95.2  |   95.2  |   100
utils.ts                      |   90.1  |   90.1  |   95
```

### 🚀 Performance Results
```
checks...................: 97% ✓
http_req_duration........: avg=250ms p95=450ms p99=800ms
http_req_failed..........: 0.5%
http_reqs................: 3600
```

### 🔒 Security Results
```
1 high severity vulnerability
Package: next@15.5.9
Issue: DoS vulnerability
Fix: Upgrade to next@16.1.6
```

---

## Troubleshooting

### "vitest: command not found"
```bash
npm install --save-dev vitest
# Or use: npx vitest
```

### "k6: command not found"
```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6

# Windows
choco install k6
```

### "Port 3000 already in use"
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### E2E Tests Timeout
```bash
# Wait longer for tests to complete
npx playwright test --timeout=60000

# Or run with visible browser
npx playwright test --headed
```

---

## Continuous Testing

### Watch Mode (Re-run on file change)
```bash
npm run test -- --watch
```

### Specific Test File
```bash
npm run test -- validators.test.ts
```

### Specific Test Case
```bash
npm run test -- -t "should validate email"
```

### Debug Mode
```bash
# Vitest
npm run test -- --inspect-brk

# Playwright
npx playwright test --debug
```

---

## Generate Reports

### Coverage Report
```bash
npm run test:coverage
open coverage/index.html
```

### E2E Report
```bash
npx playwright show-report
```

### Performance Report
```bash
k6 run --out=html=results.html performance/booking-api.k6.js
open results.html
```

---

## CI/CD Commands

```bash
# Run in CI environment (no watch, no browser)
npm run test:coverage -- --run
npm run test:e2e -- --all
npm audit

# Generate all reports
npm run test:coverage > coverage.log
npx playwright test > e2e.log
k6 run performance/booking-api.k6.js > performance.log
npm audit > security.log
```

---

## Key Metrics

**You want to see:**
- ✅ Unit coverage: >90%
- ✅ Tests passing: 100%
- ✅ p95 latency: <500ms
- ✅ Error rate: <1%
- ✅ Accessibility: 0 violations
- ✅ Security: 0 critical issues

**If you see:**
- ❌ Coverage <80% → Write more tests
- ❌ Failed tests → Debug and fix
- ❌ p95 >500ms → Optimize code
- ❌ Error rate >1% → Fix bugs
- ❌ Accessibility violations → Fix UI
- ❌ Security issues → Fix immediately

---

## Quick Commands Reference

```bash
# Test Execution
npm run test               # Run unit tests once
npm run test:coverage      # Run with coverage report
npm run test -- --watch    # Watch mode (re-run on change)
npm run test:e2e           # Run E2E tests
npx playwright test --headed  # E2E with visible browser
k6 run performance/booking-api.k6.js  # Performance testing

# Reports
npm run test:coverage      # Opens coverage/index.html
npx playwright show-report # Opens test-results/...
k6 run --out=html=results.html performance/booking-api.k6.js

# Security
npm audit                  # Check for vulnerabilities
npm audit fix              # Auto-fix vulnerabilities
npm audit fix --force      # Force fixes (breaking changes)

# Quality
npm run check-all          # Type check + lint + test
npm run lint               # Linting
npm run type-check         # TypeScript check
npm run format             # Auto-format code
```

---

## Success Criteria

You'll know tests are working when you see:

```
✓ All unit tests pass
✓ Coverage >= 90%
✓ All E2E scenarios pass
✓ All accessibility tests pass
✓ Performance targets met (p95 <500ms)
✓ Security audit shows 0 critical issues
✓ Reports generated successfully
```

---

## Need Help?

See detailed documentation:
- `TESTING_SUMMARY.md` - Complete test guide
- `SECURITY_TESTING.md` - Security details
- `PHASE_5.1_COMPLETE.md` - Phase summary
- `playwright.config.ts` - E2E configuration

---

**Ready to test? Run:** `npm run test:coverage`
