# SME Booking App - Backend API Framework

## 🎯 Overview

Production-ready Next.js 14 API framework with comprehensive error handling, validation, logging, and middleware for local development.

## ✅ Completed Features

### Part 1.3: Backend API Framework

- **✅ 1.3.1: Next.js App Setup**
  - Root layout with metadata and providers
  - Home page with API documentation
  - Health check endpoint (`/api/health`)
  - Ping endpoint (`/api/ping`)

- **✅ 1.3.2: Error Handling & Response Standardization**
  - Custom error classes (ApiError, ValidationError, AuthError, NotFoundError, ConflictError, RateLimitError)
  - Standardized JSON error responses
  - Standardized success responses
  - Type-safe error handling

- **✅ 1.3.3: Middleware & Global Error Handler**
  - CORS support (localhost + configurable origins)
  - Rate limiting (100 req/min per IP, in-memory for local dev)
  - Request logging with duration tracking
  - Global error catching and handling
  - Request ID generation

- **✅ 1.3.4: Structured Logging (Pino)**
  - JSON-formatted logs
  - Multiple log levels (debug, info, warn, error)
  - Console + file output (`logs/app.log`)
  - Request/response logging
  - Error stack trace logging
  - Query logging utilities

- **✅ 1.3.5: Request/Response Validation (Zod)**
  - Type-safe validation schemas
  - DTOs for all endpoints (Customer, Booking, Chat, Login, etc.)
  - Validation middleware factory
  - Query parameter validation
  - Detailed validation error responses

- **✅ 1.3.6: API Tests**
  - Health check tests
  - Ping endpoint tests
  - Error handling tests (404, 405)
  - CORS tests
  - Rate limiting tests
  - Vitest configuration

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Server starts at: http://localhost:3000

### Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# With UI
npm run test:ui
```

### Linting & Formatting

```bash
# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check
```

## 📡 API Endpoints

### Health Check

```bash
GET /api/health

Response:
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-02-07T12:43:00Z",
    "uptime": 123.45,
    "environment": "development",
    "version": "0.1.0",
    "memory": {
      "used": 45,
      "total": 128,
      "unit": "MB"
    }
  },
  "timestamp": "2026-02-07T12:43:00Z"
}
```

### Ping

```bash
GET /api/ping

Response:
{
  "success": true,
  "data": {
    "pong": true,
    "timestamp": "2026-02-07T12:43:00Z"
  },
  "timestamp": "2026-02-07T12:43:00Z"
}
```

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```env
NODE_ENV=development
LOG_LEVEL=debug
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Rate Limiting

Default: 100 requests per minute per IP

Configure in `src/middleware.ts`:
```typescript
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;
```

### Logging

Logs are written to:
- **Console**: Pretty-printed in development
- **File**: `logs/app.log` (JSON format)

Configure log level via environment variable:
```env
LOG_LEVEL=debug  # debug, info, warn, error
```

## 📁 Project Structure

```
sme-booking-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/route.ts    # Health check endpoint
│   │   │   └── ping/route.ts      # Ping endpoint
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Home page
│   │   └── globals.css            # Global styles
│   ├── lib/
│   │   ├── middleware/
│   │   │   ├── error-handler.ts   # Global error handler
│   │   │   └── validate.ts        # Validation middleware
│   │   ├── api-response.ts        # Response utilities
│   │   ├── errors.ts              # Custom error classes
│   │   ├── logger.ts              # Pino logger setup
│   │   └── validation.ts          # Zod schemas
│   ├── middleware.ts              # Next.js middleware (CORS, rate limit, logging)
│   └── __tests__/
│       ├── api/
│       │   └── health.test.ts     # API tests
│       └── setup.ts               # Test setup
├── logs/
│   └── app.log                    # Application logs
├── next.config.js                 # Next.js configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── vitest.config.ts               # Vitest configuration
├── package.json                   # Dependencies & scripts
└── tsconfig.json                  # TypeScript configuration
```

## 🛡️ Error Handling

All errors follow a standardized format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid"
    },
    "timestamp": "2026-02-07T12:43:00Z"
  }
}
```

### Error Types

- **ValidationError** (422): Request validation failed
- **AuthError** (401): Authentication required
- **ForbiddenError** (403): Access denied
- **NotFoundError** (404): Resource not found
- **ConflictError** (409): Resource conflict (e.g., duplicate)
- **RateLimitError** (429): Rate limit exceeded
- **BadRequestError** (400): Malformed request
- **DatabaseError** (500): Database operation failed
- **ExternalServiceError** (502): External API failed

## 🔍 Validation

All request validation uses Zod for type safety:

```typescript
import { validateRequest } from '@/lib/middleware/validate';
import { CreateBookingDtoSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const validator = validateRequest(CreateBookingDtoSchema);
  const { data, error } = await validator(req);
  
  if (error) return error;
  
  // data is now type-safe and validated
  // ... handle request
}
```

## 📊 Logging

Structured logging examples:

```typescript
import logger, { logRequest, logError, logQuery } from '@/lib/logger';

// Request logging
logRequest({
  method: 'GET',
  path: '/api/bookings',
  statusCode: 200,
  duration: 45,
  userId: 'user-123',
});

// Error logging
logError(new Error('Something failed'), {
  userId: 'user-123',
  action: 'create-booking',
});

// Query logging
logQuery('SELECT * FROM bookings WHERE id = ?', 12.5);
```

## 🧪 Testing

Run tests with:

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With UI
npm run test:ui

# Coverage
npm test -- --coverage
```

## 🎯 Next Steps

### Phase 2: Add Authentication
- Session-based auth
- Login/logout endpoints
- Protected routes
- Password hashing

### Phase 3: Database Integration
- Connect Prisma to SQLite/PostgreSQL
- CRUD operations
- Migrations

### Phase 4: Business Logic
- Booking management
- Customer management
- Service classification
- Calendar integration

## 📝 Notes

- **Local Development**: No authentication required for testing
- **Rate Limiting**: In-memory store (fast, suitable for local dev)
- **Logs**: Console + `logs/app.log`
- **All endpoints**: Follow standardized response format
- **Errors**: Caught globally with proper HTTP status codes

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Clear Logs

```bash
rm -f logs/app.log
```

### Reset Rate Limit

Restart the server (rate limits are in-memory).

## 📄 License

MIT

---

**Status**: ✅ Part 1.3 Complete - Backend API Framework Ready for Local Development
