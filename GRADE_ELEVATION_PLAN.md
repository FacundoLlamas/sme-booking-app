# Grade Elevation Plan - Target: All A's

**Generated:** 2026-02-07  
**Current Grades:** Part 1.1 (A-), Part 1.2 (A), Part 1.3 (A), Mock Services (A-)  
**Target:** Straight A's across all components

---

## Executive Summary

This plan identifies specific gaps preventing A grades and provides actionable fixes with effort estimates. Focus areas:

1. **Developer Experience (DX)** - Make onboarding seamless
2. **Production Readiness** - Monitoring, logging, observability
3. **Documentation** - Complete, accurate, with examples
4. **Testing** - Comprehensive coverage including E2E
5. **Performance** - Benchmarks and optimization

---

## Part 1.1: Project Setup (A- → A)

### Current Strengths ✅
- Solid package.json with engines specification
- Docker & docker-compose configured
- ESLint/Prettier configured
- TypeScript strict mode
- Basic CI/CD workflow

### Gaps Identified

#### GAP 1.1.1: Missing Pre-commit Hooks
**What:** No husky/lint-staged for enforcing code quality before commits  
**Why it matters:** Developers can push unformatted/unlinted code  
**Fix:** Add husky + lint-staged + commitlint  
**Priority:** HIGH  
**Effort:** 30 minutes  

**Files to create/modify:**
```
.husky/
├── pre-commit          # Run lint-staged
├── commit-msg          # Run commitlint
package.json            # Add devDependencies
commitlint.config.js    # Commit message rules
```

#### GAP 1.1.2: Incomplete npm Scripts
**What:** Missing utility scripts for common operations  
**Why it matters:** Developers need to remember manual commands  
**Fix:** Add convenience scripts  
**Priority:** MEDIUM  
**Effort:** 20 minutes  

**Scripts to add to package.json:**
```json
{
  "scripts": {
    "db:reset": "prisma migrate reset --force",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "clean": "rm -rf .next node_modules/.cache",
    "clean:all": "rm -rf .next node_modules",
    "check": "npm run type-check && npm run lint && npm test",
    "verify": "./scripts/verify-setup.sh",
    "setup": "npm ci && npx prisma generate && npm run db:push",
    "dev:debug": "NODE_OPTIONS='--inspect' next dev"
  }
}
```

#### GAP 1.1.3: Missing CONTRIBUTING.md
**What:** No contribution guidelines  
**Why it matters:** New developers don't know conventions  
**Fix:** Create CONTRIBUTING.md  
**Priority:** MEDIUM  
**Effort:** 45 minutes  

**File to create:** `CONTRIBUTING.md`

#### GAP 1.1.4: No Example/Starter Files
**What:** No example API client or usage patterns  
**Why it matters:** Developers need to figure out usage patterns  
**Fix:** Add examples directory  
**Priority:** MEDIUM  
**Effort:** 1 hour  

**Files to create:**
```
examples/
├── api-client.ts       # Example API wrapper
├── booking-flow.ts     # Complete booking flow example
├── mock-usage.ts       # How to use mocks
└── README.md           # Examples documentation
```

#### GAP 1.1.5: Incomplete .env.example
**What:** .env.example missing some variables  
**Why it matters:** Developers miss environment setup  
**Fix:** Comprehensive .env.example with all options  
**Priority:** HIGH  
**Effort:** 15 minutes  

**Additions to .env.example:**
```bash
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_URL="file:./db/sqlite.db"

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log
LOG_FORMAT=pretty  # pretty | json

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# Redis (optional)
# REDIS_URL=redis://localhost:6379

# Mock Service Configuration
MOCK_SMS_FAILURE_RATE=0
MOCK_EMAIL_FAILURE_RATE=0
MOCK_SMS_DELAY_MS=0
CALENDAR_PERSIST=false
```

#### GAP 1.1.6: Missing Health Check on Startup
**What:** No automatic health verification on npm run dev  
**Fix:** Add startup health check script  
**Priority:** LOW  
**Effort:** 30 minutes  

**File to create:** `scripts/check-health.ts`

---

## Part 1.2: Database (A → A+)

### Current Strengths ✅
- Comprehensive Prisma schema with proper indexes
- Good query helper functions
- Audit logging table
- Transaction support
- Realistic seed data
- Basic test coverage

### Enhancements for A+

#### ENHANCE 1.2.1: Query Performance Logging
**What:** Log slow queries automatically in development  
**Why it matters:** Catch N+1 and slow queries early  
**Priority:** HIGH  
**Effort:** 45 minutes  

**File to modify:** `src/lib/db/queries.ts`
```typescript
// Add query timing wrapper
export async function withQueryTiming<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  if (duration > 100) { // Log slow queries (>100ms)
    logger.warn({ query: name, duration }, 'Slow query detected');
  } else if (process.env.LOG_QUERIES === 'true') {
    logger.debug({ query: name, duration }, 'Query executed');
  }
  
  return result;
}
```

#### ENHANCE 1.2.2: Database Performance Benchmarks
**What:** Benchmark script for query performance  
**Priority:** MEDIUM  
**Effort:** 1 hour  

**File to create:** `scripts/benchmark-db.ts`

#### ENHANCE 1.2.3: Database Documentation (ERD)
**What:** Visual database schema diagram  
**Priority:** MEDIUM  
**Effort:** 30 minutes  

**File to create:** `docs/database-schema.md` with ASCII ERD

#### ENHANCE 1.2.4: Backup/Recovery Scripts
**What:** SQLite backup and restore utilities  
**Priority:** MEDIUM  
**Effort:** 30 minutes  

**Files to create:**
```
scripts/
├── db-backup.sh        # Backup SQLite to timestamped file
└── db-restore.sh       # Restore from backup
```

#### ENHANCE 1.2.5: Soft Delete Pattern
**What:** Add deleted_at column pattern for key tables  
**Priority:** LOW  
**Effort:** 1 hour  

**Files to modify:**
- `prisma/schema.prisma` - Add deletedAt fields
- `src/lib/db/queries.ts` - Add soft delete filters

---

## Part 1.3: API Security (A → A+)

### Current Strengths ✅
- CORS properly configured
- Rate limiting with Redis-ready abstraction
- Structured logging with Pino
- Comprehensive error handling
- Zod validation schemas
- Request ID generation

### Enhancements for A+

#### ENHANCE 1.3.1: Request Tracing / Correlation IDs
**What:** Add correlation ID for distributed tracing  
**Priority:** HIGH  
**Effort:** 45 minutes  

**File to modify:** `src/middleware.ts`
```typescript
// Add to middleware
const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
requestHeaders.set('x-correlation-id', correlationId);

// Pass to response
response.headers.set('x-correlation-id', correlationId);
```

#### ENHANCE 1.3.2: Security Headers
**What:** Add security headers (CSP, X-Frame-Options, etc.)  
**Priority:** HIGH  
**Effort:** 30 minutes  

**File to modify:** `src/middleware.ts`
```typescript
// Add security headers
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-XSS-Protection', '1; mode=block');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
```

#### ENHANCE 1.3.3: Response Compression
**What:** Enable gzip/brotli compression  
**Priority:** MEDIUM  
**Effort:** 15 minutes  

**File to modify:** `next.config.js`
```javascript
module.exports = {
  compress: true,
  // ...existing config
}
```

#### ENHANCE 1.3.4: Input Sanitization
**What:** Sanitize string inputs to prevent XSS  
**Priority:** MEDIUM  
**Effort:** 45 minutes  

**File to create:** `src/lib/sanitize.ts`
```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
```

#### ENHANCE 1.3.5: API Metrics Endpoint
**What:** Add /api/v1/metrics for observability  
**Priority:** MEDIUM  
**Effort:** 1 hour  

**File to create:** `src/app/api/v1/metrics/route.ts`
```typescript
// Expose request counts, latency percentiles, error rates
export async function GET(request: NextRequest) {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    requests: { total: 0, errors: 0 }, // Track in middleware
    latency: { p50: 0, p95: 0, p99: 0 },
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json({ success: true, data: metrics });
}
```

#### ENHANCE 1.3.6: Request Body Size Limits
**What:** Document and enforce body size limits  
**Priority:** LOW  
**Effort:** 15 minutes  

**File to modify:** `next.config.js`
```javascript
module.exports = {
  experimental: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
```

---

## Mock Services (A- → A)

### Current Strengths ✅
- Good mock implementations for SMS, Email, Calendar, LLM
- File persistence options
- Failure simulation
- Delay simulation
- Comprehensive logging

### Gaps Identified

#### GAP MOCK.1: Inconsistent State Management
**What:** Mocks don't share state properly (e.g., booking creates calendar event but not email confirmation)  
**Fix:** Create unified mock orchestrator  
**Priority:** HIGH  
**Effort:** 2 hours  

**File to create:** `src/lib/mocks/orchestrator.ts`
```typescript
/**
 * Mock Orchestrator - Coordinates mock services
 * Ensures consistent state across SMS, Email, Calendar, LLM
 */
export class MockOrchestrator {
  async handleBookingCreated(booking: Booking) {
    // 1. Create calendar event
    // 2. Send confirmation email
    // 3. Send confirmation SMS
    // All in sync
  }
  
  async handleBookingCancelled(bookingId: string) {
    // Coordinate cleanup across all services
  }
}
```

#### GAP MOCK.2: Missing Mock Dashboard
**What:** No way to view mock logs visually  
**Fix:** Create simple HTML dashboard  
**Priority:** MEDIUM  
**Effort:** 2 hours  

**Files to create:**
```
public/mock-dashboard/
├── index.html          # Dashboard UI
├── styles.css          # Simple styling
src/app/api/v1/mocks/
├── logs/route.ts       # API to fetch mock logs
└── stats/route.ts      # API to fetch mock stats
```

#### GAP MOCK.3: Missing Integration Tests
**What:** No tests verifying mock consistency  
**Fix:** Add integration test suite  
**Priority:** HIGH  
**Effort:** 2 hours  

**File to create:** `src/__tests__/integration/mock-services.test.ts`
```typescript
describe('Mock Service Integration', () => {
  it('should create calendar event when booking is created', async () => {});
  it('should send SMS and email for booking confirmation', async () => {});
  it('should handle booking cancellation across all services', async () => {});
  it('should maintain consistent state after failures', async () => {});
});
```

#### GAP MOCK.4: Incomplete LLM Mock
**What:** LLM mock doesn't simulate rate limits or accurate token counting  
**Fix:** Enhanced LLM mock  
**Priority:** MEDIUM  
**Effort:** 1 hour  

**File to modify:** `src/lib/llm/__mocks__/mock-claude.ts`
```typescript
// Add rate limiting simulation
const MOCK_RATE_LIMIT = {
  requestsPerMinute: 60,
  tokensPerMinute: 100000,
  currentRequests: 0,
  currentTokens: 0,
  resetAt: Date.now() + 60000,
};

// Add accurate token counting using tiktoken approximation
function countTokensAccurate(text: string): number {
  // Approximate: 1 token ≈ 4 characters for English
  // More accurate: use tiktoken or similar
  return Math.ceil(text.length / 4);
}
```

#### GAP MOCK.5: Missing Webhook Simulation
**What:** SMS/Email don't simulate delivery webhooks  
**Fix:** Add delivery callback simulation  
**Priority:** LOW  
**Effort:** 1.5 hours  

**File to create:** `src/lib/mocks/webhook-simulator.ts`

---

## Project-Wide Improvements

### IMPROVE 1: OpenAPI/Swagger Documentation
**What:** Auto-generated API documentation  
**Why it matters:** Makes API discoverable and testable  
**Priority:** HIGH  
**Effort:** 3 hours  

**Files to create:**
```
src/lib/openapi/
├── spec.yaml           # OpenAPI 3.0 specification
├── generator.ts        # Generate spec from Zod schemas
src/app/api/docs/
└── route.ts            # Swagger UI endpoint
```

### IMPROVE 2: E2E Tests with Playwright
**What:** End-to-end test suite  
**Why it matters:** Playwright is configured but no tests exist  
**Priority:** HIGH  
**Effort:** 3 hours  

**Files to create:**
```
tests/e2e/
├── health.spec.ts      # Health check E2E
├── booking-flow.spec.ts # Complete booking flow
└── fixtures/
    └── test-data.ts    # Shared test data
playwright.config.ts    # (update existing)
```

### IMPROVE 3: Load Testing Setup
**What:** k6 or Artillery load testing scripts  
**Priority:** MEDIUM  
**Effort:** 2 hours  

**Files to create:**
```
tests/load/
├── k6-config.js        # k6 configuration
├── scenarios/
│   ├── health-check.js # Health endpoint stress test
│   ├── booking-flow.js # Booking flow load test
│   └── spike-test.js   # Spike testing scenario
└── README.md           # How to run load tests
```

### IMPROVE 4: Error Tracking Foundation
**What:** Sentry-like error tracking integration point  
**Priority:** MEDIUM  
**Effort:** 1 hour  

**File to create:** `src/lib/error-tracking.ts`
```typescript
/**
 * Error Tracking Integration
 * Provides hooks for Sentry, Bugsnag, etc.
 */
export interface ErrorTracker {
  captureException(error: Error, context?: Record<string, any>): void;
  captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void;
  setUser(user: { id: string; email?: string }): void;
  addBreadcrumb(breadcrumb: { message: string; category?: string }): void;
}

// Default: log to console/file
export const errorTracker: ErrorTracker = {
  captureException: (error, context) => logError(error, context),
  captureMessage: (message, level) => logger[level || 'info'](message),
  setUser: () => {},
  addBreadcrumb: () => {},
};
```

### IMPROVE 5: Changelog
**What:** CHANGELOG.md following Keep a Changelog format  
**Priority:** LOW  
**Effort:** 30 minutes  

**File to create:** `CHANGELOG.md`

### IMPROVE 6: Architecture Decision Records (ADRs)
**What:** Document key architecture decisions  
**Priority:** LOW  
**Effort:** 1 hour  

**Files to create:**
```
docs/adr/
├── 0001-use-nextjs-for-api.md
├── 0002-sqlite-for-local-dev.md
├── 0003-mock-service-pattern.md
└── README.md
```

---

## Priority Fixes by Effort

### 🚀 Quick Wins (30 min each) - DO FIRST

| Fix | Impact | File(s) |
|-----|--------|---------|
| Complete .env.example | Onboarding | `.env.example` |
| Add security headers | Security | `src/middleware.ts` |
| Enable response compression | Performance | `next.config.js` |
| Add correlation IDs | Observability | `src/middleware.ts` |
| Add missing npm scripts | DX | `package.json` |

### 🔧 Medium Effort (1-2 hours each)

| Fix | Impact | File(s) |
|-----|--------|---------|
| Pre-commit hooks | Code quality | `.husky/`, `package.json` |
| CONTRIBUTING.md | Onboarding | `CONTRIBUTING.md` |
| Query performance logging | Debugging | `src/lib/db/queries.ts` |
| Input sanitization | Security | `src/lib/sanitize.ts` |
| Mock orchestrator | Consistency | `src/lib/mocks/orchestrator.ts` |
| Metrics endpoint | Observability | `src/app/api/v1/metrics/route.ts` |
| Error tracking foundation | Reliability | `src/lib/error-tracking.ts` |

### 💪 Major Work (3+ hours)

| Fix | Impact | File(s) |
|-----|--------|---------|
| OpenAPI documentation | DX, Testing | `src/lib/openapi/` |
| E2E tests | Reliability | `tests/e2e/` |
| Mock integration tests | Reliability | `src/__tests__/integration/` |
| Load testing setup | Performance | `tests/load/` |
| Mock dashboard | DX | `public/mock-dashboard/` |
| Example files | Onboarding | `examples/` |

---

## Implementation Checklist

### Phase 1: Quick Wins (1-2 hours total)
- [ ] Complete .env.example
- [ ] Add security headers to middleware
- [ ] Enable response compression
- [ ] Add correlation ID tracking
- [ ] Add convenience npm scripts
- [ ] Document body size limits

### Phase 2: Core Improvements (4-6 hours total)
- [ ] Setup pre-commit hooks (husky + lint-staged)
- [ ] Create CONTRIBUTING.md
- [ ] Add query performance logging
- [ ] Create input sanitization utilities
- [ ] Add metrics endpoint
- [ ] Create mock orchestrator
- [ ] Setup error tracking foundation

### Phase 3: Testing & Docs (6-8 hours total)
- [ ] Create OpenAPI specification
- [ ] Write E2E test suite
- [ ] Create mock integration tests
- [ ] Setup load testing
- [ ] Create example files
- [ ] Add database documentation

### Phase 4: Polish (2-3 hours total)
- [ ] Create mock dashboard
- [ ] Add CHANGELOG.md
- [ ] Create ADRs
- [ ] Database backup/restore scripts
- [ ] LLM mock enhancements
- [ ] Webhook simulation

---

## Expected Grade Impact

| Component | Current | After Phase 1 | After Phase 2 | After All |
|-----------|---------|---------------|---------------|-----------|
| Part 1.1 Setup | A- | A- | A | A |
| Part 1.2 Database | A | A | A | A+ |
| Part 1.3 API | A | A | A+ | A+ |
| Mock Services | A- | A- | A | A |

**Total effort to achieve all A's: ~20-25 hours**

---

## Files Summary

### New Files to Create (22 files)
```
.husky/pre-commit
.husky/commit-msg
commitlint.config.js
CONTRIBUTING.md
CHANGELOG.md
examples/api-client.ts
examples/booking-flow.ts
examples/mock-usage.ts
examples/README.md
docs/database-schema.md
docs/adr/0001-use-nextjs-for-api.md
docs/adr/0002-sqlite-for-local-dev.md
docs/adr/0003-mock-service-pattern.md
docs/adr/README.md
scripts/db-backup.sh
scripts/db-restore.sh
scripts/benchmark-db.ts
scripts/check-health.ts
src/lib/sanitize.ts
src/lib/error-tracking.ts
src/lib/mocks/orchestrator.ts
src/lib/mocks/webhook-simulator.ts
src/lib/openapi/spec.yaml
src/lib/openapi/generator.ts
src/app/api/v1/metrics/route.ts
src/app/api/v1/mocks/logs/route.ts
src/app/api/v1/mocks/stats/route.ts
src/app/api/docs/route.ts
src/__tests__/integration/mock-services.test.ts
tests/e2e/health.spec.ts
tests/e2e/booking-flow.spec.ts
tests/e2e/fixtures/test-data.ts
tests/load/k6-config.js
tests/load/scenarios/health-check.js
tests/load/scenarios/booking-flow.js
tests/load/scenarios/spike-test.js
tests/load/README.md
public/mock-dashboard/index.html
public/mock-dashboard/styles.css
```

### Files to Modify (7 files)
```
package.json            # Add scripts, devDependencies
.env.example            # Complete all variables
src/middleware.ts       # Security headers, correlation IDs
next.config.js          # Compression, body limits
src/lib/db/queries.ts   # Query timing
src/lib/llm/__mocks__/mock-claude.ts  # Rate limits, token counting
playwright.config.ts    # E2E configuration
```

---

## Conclusion

This plan provides a clear roadmap from current grades (A-, A, A, A-) to straight A's. 

**Key priorities:**
1. **Quick wins first** - Maximum impact with minimal effort
2. **Security & observability** - Critical for production-readiness
3. **Testing** - E2E and integration tests validate the whole system
4. **Documentation** - Makes the project maintainable and shareable

**Recommended approach:**
- Start with Phase 1 (quick wins) immediately
- Complete Phase 2 within 1 week
- Schedule Phase 3 & 4 over 2-3 weeks

With these improvements, the SME Booking App becomes a showpiece full-stack project worthy of A+ grades across all components.
