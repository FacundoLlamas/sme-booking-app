# Quick Reference Card

## Common Commands

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Run all tests | `npm test` |
| Check types | `npm run type-check` |
| Fix linting | `npm run lint:fix` |
| Format code | `npm run format` |
| View database | `npm run prisma:studio` |
| Reset database | `npm run db:reset` |
| Check mock status | `npm run mock:status` |
| Full setup | `npm run dev:full` |

## Mock Configuration

All services are mocked locally. Configure via `.env`:

```bash
# Simulate failures (0-1)
MOCK_SMS_FAILURE_RATE=0.1      # 10% SMS failures
MOCK_EMAIL_FAILURE_RATE=0.05   # 5% email failures

# Simulate delays (milliseconds)
MOCK_SMS_DELAY_MS=500          # 500ms delay on SMS
MOCK_EMAIL_DELAY_MS=1000       # 1s delay on email

# Persist calendar across restarts
CALENDAR_PERSIST=true
```

## Project Structure

```
src/
├── app/                 # Next.js routes + API
├── components/          # React components
├── lib/
│   ├── db/             # Database queries
│   ├── llm/            # Mock Claude
│   ├── sms/            # Mock Twilio
│   ├── email/          # Mock SendGrid
│   ├── google/         # Mock Calendar
│   ├── errors.ts       # Error classes
│   └── logger.ts       # Logging
├── types/              # TypeScript types
└── __tests__/          # Tests

db/
├── schema.sql          # SQLite schema
├── sqlite.db           # Local database
└── init.ts             # Setup

prisma/
└── schema.prisma       # ORM schema

scripts/
├── seed.ts             # Database seeding
├── quick-start.sh      # Setup script
└── dev-clean.sh        # Reset script
```

## Troubleshooting

**"Module not found"** → Run `npm install && npm run prisma:generate`

**"Database error"** → Run `npm run db:reset`

**"Port 3000 in use"** → Change with `APP_PORT=3001 npm run dev`

**"Tests failing"** → Run `npm run type-check` first (likely TS errors)

## Before Committing

```bash
npm run pre-commit    # Runs type-check, lint-fix, format
npm test              # Run full test suite
git add .
git commit -m "Your message"
```
