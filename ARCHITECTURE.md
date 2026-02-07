# Architecture Guide

## System Design

```
┌─────────────────┐
│  Next.js App    │ Client-side React
│  (React)        │
└────────┬────────┘
         │
┌────────▼────────────────────┐
│  API Routes                  │
│  (/api/v1/*)                │
├──────────────────────────────┤
│ - Validation (Zod)           │
│ - Error Handling             │
│ - Correlation IDs            │
│ - Rate Limiting              │
│ - Logging (Pino)             │
└────────┬────────────────────┘
         │
┌────────▼──────────────────────────┐
│  Business Logic Layer            │
│  (src/lib/)                      │
├──────────────────────────────────┤
│ - Database queries (Prisma)      │
│ - Service orchestration          │
│ - Mock services                  │
└────────┬─────────────────────────┘
         │
    ┌────┴────┬────────┬────────────┐
    │          │        │            │
┌───▼──┐ ┌───▼─┐ ┌───▼─┐ ┌────▼───┐
│  DB  │ │ SMS │ │Email│ │Calendar│
│(SQLi)│ │Mock │ │Mock │ │  Mock  │
└──────┘ └─────┘ └─────┘ └────────┘
```

## Key Layers

### API Layer (src/app/api/)
- Handles HTTP requests
- Validates input with Zod
- Returns standardized responses
- Logs all requests
- Tracks correlation IDs

### Business Logic Layer (src/lib/)
- Service orchestration
- Database queries
- Mock service integration
- Error handling
- Utilities

### Data Layer
- Prisma ORM
- SQLite (local) / PostgreSQL (production)
- Migrations in prisma/migrations/

### Mock Services
- All external services mocked locally
- Can simulate failures/delays
- Persistent state (optional)
- Configurable via environment

## Key Design Decisions

### Why Prisma?
- Type-safe queries
- Easy migrations
- Works with SQLite and PostgreSQL
- Built-in client generation

### Why Zod?
- Runtime validation
- Type inference
- Clear error messages
- Small bundle size

### Why Pino?
- Structured logging
- Fast performance
- JSON format (machine-readable)
- Multiple transports

### Why Mocks?
- Zero external dependencies
- Fast development
- Easy testing
- Configurable behavior

## Data Flow

### Booking Request Flow

1. **Client sends request**
   ```
   POST /api/v1/bookings
   {
     "customerName": "John",
     "serviceType": "plumbing",
     "bookingTime": "2026-02-10T14:00:00Z"
   }
   ```

2. **API validates**
   - Checks schema with Zod
   - Returns 422 if invalid
   - Generates correlation ID

3. **Business logic processes**
   - Queries database for availability
   - Checks for conflicts
   - Reserves slot

4. **Notifications sent** (mocked)
   - SMS to customer
   - Email confirmation
   - Calendar event created

5. **Response returned**
   ```json
   {
     "success": true,
     "data": {
       "bookingId": "...",
       "confirmationCode": "..."
     }
   }
   ```

## Extending the System

### Add New Service Type

1. Add to `prisma/schema.prisma` (if needed)
2. Add to mock service classification
3. Add routes in `src/app/api/`
4. Add tests
5. Update documentation

### Add New External Integration

1. Create mock in `src/lib/<service>/`
2. Create real adapter next to mock
3. Implement orchestrator switching
4. Add environment variables
5. Document in QUICK_REFERENCE.md

## Testing Strategy

- **Unit Tests**: Business logic in isolation
- **Integration Tests**: API + DB + Mocks
- **E2E Tests**: Full user workflows
- **Load Tests**: Performance under stress

See QUICK_REFERENCE.md for test commands.

## Performance Considerations

- Database queries use indexes
- Response compression enabled
- Mock services simulate real latency
- Request correlation tracking
- Metrics endpoint for monitoring

## Security

- Input validation (Zod)
- Input sanitization
- Rate limiting (configurable)
- CORS with origin whitelist
- Security headers (HSTS, CSP, etc.)
- Correlation ID tracking for debugging
