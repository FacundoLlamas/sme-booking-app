# Contributing to SME Booking Agent

Welcome! This guide will help you get started with development.

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- Git

### Setup

```bash
# 1. Clone and install
git clone <repo>
cd sme-booking-app
npm run dev:full

# 2. Start dev server
npm run dev

# 3. Verify it works
curl http://localhost:3000/api/health
```

## Development Workflow

### Creating a Feature

1. **Create branch**: `git checkout -b feature/your-feature-name`
2. **Make changes**: Edit files, tests, documentation
3. **Before commit**: `npm run pre-commit` (runs type-check, lint, test)
4. **Commit**: `git commit -m "feat: describe your change"`
5. **Push**: `git push origin feature/your-feature-name`
6. **Open PR**: Add description and link any issues

### Code Style

- **TypeScript**: Strict mode enabled, no `any`
- **Formatting**: Prettier (automatic via pre-commit)
- **Linting**: ESLint (Airbnb config)
- **Testing**: Vitest (required for new code)

### File Structure

```
src/
├── app/          # Next.js routes + API
├── components/   # React components
├── lib/          # Business logic + utilities
├── types/        # Shared types
└── __tests__/    # Tests
```

### Testing

```bash
npm test                    # Run all tests
npm test -- --ui           # Interactive mode
npm test -- --coverage     # Coverage report
npm test -- <file>         # Single file
```

### Common Tasks

| Task | Command |
|------|---------|
| Check types | `npm run type-check` |
| Fix linting | `npm run lint:fix` |
| Format code | `npm run format` |
| View database | `npm run prisma:studio` |
| Reset database | `npm run db:reset` |
| Run E2E tests | `npm run test:e2e` |

### Database Changes

```bash
# Make schema changes in prisma/schema.prisma
npx prisma migrate dev --name <change-name>
git add prisma/migrations
git commit -m "db: <change-description>"
```

### Adding Dependencies

```bash
npm install package-name
npm install --save-dev dev-package
```

Before committing, verify no security issues:
```bash
npm audit
```

## Commit Message Format

Use conventional commits:

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
test: Add tests
chore: Maintenance
perf: Performance improvement
refactor: Code reorganization
```

## API Development

### Adding a New Endpoint

1. **Define types** in `src/types/`
2. **Add route** in `src/app/api/`
3. **Write tests** in `src/__tests__/api/`
4. **Document** in comments and QUICK_REFERENCE.md

Example:
```typescript
// src/app/api/v1/example/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      { success: true, data: {...} },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error message' },
      { status: 500 }
    );
  }
}
```

### Database Queries

Add functions to `src/lib/db/queries.ts`:

```typescript
export async function getExample(id: string) {
  return prisma.example.findUnique({
    where: { id },
  });
}
```

## Troubleshooting

### "Module not found"
```bash
npm install
npm run prisma:generate
```

### "Port 3000 in use"
```bash
APP_PORT=3001 npm run dev
```

### "Tests failing"
```bash
npm run type-check  # Fix TS errors first
npm run db:reset    # Reset database
npm test            # Run again
```

### "Husky pre-commit won't run"
```bash
npx husky install
chmod +x .husky/pre-commit
```

## Getting Help

- **Questions?** Open a discussion or ask in Discord
- **Bug?** Open an issue with reproduction steps
- **Feature request?** Open an issue with use case

## Code Review Guidelines

- ✅ All tests pass
- ✅ No TypeScript errors
- ✅ ESLint passes
- ✅ Changes are documented
- ✅ Commit messages follow convention

Thanks for contributing! 🚀
