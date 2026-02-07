# 🚀 Quick Start Guide

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Start Development Server

```bash
npm run dev
```

The server will start at: **http://localhost:3000**

## Step 3: Test the API

### Using curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Expected response:
# {
#   "success": true,
#   "data": {
#     "status": "ok",
#     "timestamp": "...",
#     "uptime": 123.45,
#     ...
#   }
# }

# Ping test
curl http://localhost:3000/api/ping

# Expected response:
# {
#   "success": true,
#   "data": {
#     "pong": true,
#     "timestamp": "..."
#   }
# }
```

### Using your browser:

1. Open http://localhost:3000
2. Click on the API cards to test endpoints

## Step 4: Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Step 5: Check Logs

```bash
# View application logs
tail -f logs/app.log

# Or just check the console where you ran `npm run dev`
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run tests once
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Open Vitest UI

# Code Quality
npm run lint             # Check code style
npm run lint:fix         # Fix code style issues
npm run format           # Format code
npm run type-check       # Check TypeScript types

# Database (when integrated)
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run seed             # Seed database
```

## What's Working Right Now

✅ **Next.js 14 App Router** - Modern React framework  
✅ **TypeScript** - Full type safety  
✅ **API Endpoints** - `/api/health` and `/api/ping`  
✅ **Error Handling** - Standardized error responses  
✅ **Validation** - Zod schemas for request validation  
✅ **Logging** - Structured logging with Pino  
✅ **Middleware** - CORS, rate limiting, request logging  
✅ **Tests** - Vitest setup with API tests  

## What's Next

🔄 **Database Integration** - Connect Prisma + SQLite/PostgreSQL  
🔄 **Authentication** - Session-based auth  
🔄 **Booking Management** - CRUD operations  
🔄 **AI Chat** - Claude integration  
🔄 **Calendar Sync** - Google Calendar integration  

## Troubleshooting

### Port 3000 is already in use

```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Dependencies not installing

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors

```bash
# Check for type errors
npm run type-check
```

## Need Help?

- Check `README.md` for detailed documentation
- View logs in `logs/app.log`
- Run `npm run lint` to check for code issues

---

**Status**: ✅ Backend API Framework Complete - Ready for Local Development
