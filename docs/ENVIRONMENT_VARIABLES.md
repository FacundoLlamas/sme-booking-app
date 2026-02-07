# Environment Variables Guide

## Overview

Environment variables control the application behavior across environments:
- **Development** (.env.development.example)
- **Staging** (.env.staging.example)
- **Production** (.env.production.example)

---

## Variable Categories

### Application Core

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NODE_ENV` | string | Yes | `development` | Runtime environment (development, staging, production) |
| `APP_URL` | string | Yes | `http://localhost:3000` | Public app URL (used for callbacks, emails) |
| `APP_PORT` | number | No | `3000` | Application port |
| `NEXTAUTH_URL` | string | Yes | `http://localhost:3000` | NextAuth base URL (same as APP_URL usually) |
| `NEXTAUTH_CALLBACK_URL` | string | Yes | `http://localhost:3000/api/auth/callback` | OAuth callback URL |

### Database

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `DATABASE_URL` | string | Yes | `file:./db/sqlite.db` | Database connection string |
| `DATABASE_MOCK` | boolean | No | `false` | Use mock database (dev only) |
| `DATABASE_POOL_MIN` | number | No | `2` | Minimum connection pool size |
| `DATABASE_POOL_MAX` | number | No | `10` | Maximum connection pool size |
| `DATABASE_TIMEOUT` | number | No | `5000` | Query timeout in milliseconds |

### Google Calendar

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `GOOGLE_CALENDAR_MOCK` | boolean | No | `true` | Use mock calendar (dev mode) |
| `GOOGLE_CLIENT_ID` | string | Prod only | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | string | Prod only | - | Google OAuth client secret |
| `GOOGLE_CALENDAR_API_KEY` | string | No | - | Google Calendar API key (if using API directly) |
| `GOOGLE_CALENDAR_WEBHOOK_SECRET` | string | No | - | Webhook HMAC secret for calendar push notifications |
| `CALENDAR_WEBHOOK_URL` | string | No | - | Full URL webhook endpoint |

### Timezones

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `EXPERT_TIMEZONE` | string | No | `America/New_York` | Expert/technician timezone (IANA format) |
| `CUSTOMER_TIMEZONE` | string | No | `America/Los_Angeles` | Customer timezone (IANA format) |

### Twilio SMS

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `TWILIO_MOCK` | boolean | No | `true` | Use mock SMS (dev mode) |
| `TWILIO_ACCOUNT_SID` | string | Prod only | - | Twilio account ID |
| `TWILIO_AUTH_TOKEN` | string | Prod only | - | Twilio authentication token |
| `TWILIO_PHONE_NUMBER` | string | Prod only | - | Sender phone number (E.164 format) |
| `SMS_REMINDER_HOURS_BEFORE` | string | No | `24,2` | Reminder times (comma-separated hours) |

### SendGrid Email

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `SENDGRID_MOCK` | boolean | No | `true` | Use mock email (dev mode) |
| `SENDGRID_API_KEY` | string | Prod only | - | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | string | No | `noreply@example.com` | Sender email address |
| `SENDGRID_FROM_NAME` | string | No | `SME Booking App` | Sender display name |

### Anthropic (Claude LLM)

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `ANTHROPIC_MOCK` | boolean | No | `true` | Use mock LLM (dev mode) |
| `ANTHROPIC_API_KEY` | string | Prod only | - | Anthropic API key (sk-ant-...) |
| `LLM_MODEL` | string | No | `claude-sonnet-4-5` | Claude model to use |
| `ANTHROPIC_TIMEOUT_MS` | number | No | `30000` | API call timeout |

### Redis Cache

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REDIS_URL` | string | No | `redis://redis:6379` | Redis connection string |
| `CACHE_TTL_SECONDS` | number | No | `3600` | Default cache TTL (1 hour) |
| `REDIS_TIMEOUT_MS` | number | No | `5000` | Redis operation timeout |

### Authentication

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NEXTAUTH_SECRET` | string | Yes | - | NextAuth secret (min 32 chars, use `openssl rand -hex 16`) |
| `NEXTAUTH_JWT_SECRET` | string | No | - | JWT signing secret |
| `NEXTAUTH_JWT_EXPIRES_IN` | number | No | `86400` | JWT expiration in seconds |

### Logging

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `LOG_LEVEL` | enum | No | `info` | Log level (debug, info, warn, error) |
| `LOG_FORMAT` | enum | No | `json` | Log format (json, text) |
| `SENTRY_DSN` | string | No | - | Sentry error tracking DSN |

### Feature Flags

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `ENABLE_METRICS` | boolean | No | `true` | Enable performance metrics |
| `ENABLE_REQUEST_TRACING` | boolean | No | `true` | Enable request tracing |
| `ENABLE_RESPONSE_COMPRESSION` | boolean | No | `true` | Enable gzip compression |

---

## Environment Files

### Development (.env.development.example)

```bash
# Copy to .env for local development
cp .env.development.example .env

# Edit with your local values (optional, most have defaults)
```

**Features:**
- ✅ All services mocked
- ✅ SQLite database
- ✅ Hot reload enabled
- ✅ Verbose logging

### Staging (.env.staging.example)

For staging deployment via Docker Compose:

```bash
# Setup staging environment
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up
```

**Variables:**
- Real database (PostgreSQL)
- Real Redis
- Real Google Calendar
- Real SMS/Email (test account)
- Real LLM (optional)

### Production (.env.production.example)

For production deployment on Vercel:

```bash
# Never commit .env.production to git!
# Set variables in Vercel dashboard or secret manager
```

**Variables:**
- Real everything (production credentials)
- Production database
- Production LLM
- Real monitoring

---

## How to Generate Secrets

### NEXTAUTH_SECRET

```bash
# Generate 32-char random secret
openssl rand -hex 16

# Or use:
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### JWT_SECRET

```bash
# Generate 32-char random secret
openssl rand -hex 16
```

### GOOGLE_CALENDAR_WEBHOOK_SECRET

```bash
# Minimum 32 characters
openssl rand -hex 32
```

### REDIS_PASSWORD

```bash
# For production
openssl rand -hex 32
```

---

## Validation on Startup

The application validates environment variables on startup:

```
✅ Required variables present
✅ Valid format (URLs, API keys)
✅ Database connectivity
✅ Redis connectivity (if configured)
✅ External service connectivity

If validation fails:
❌ Application exits with error
❌ Error message explains what's wrong
```

### Example Error Output

```
❌ VALIDATION_ERROR: Missing required environment variables
   - ANTHROPIC_API_KEY (required in production)
   - SENDGRID_API_KEY (required for email notifications)

💡 Hint: Set these variables in your environment or .env file

📖 See docs/ENVIRONMENT_VARIABLES.md for details
```

---

## Setting Variables

### Local Development

```bash
# Option 1: .env file
echo "NEXTAUTH_SECRET=my-secret" >> .env

# Option 2: Export
export NEXTAUTH_SECRET=my-secret
npm run dev

# Option 3: Docker Compose
# Edit docker-compose.yml > environment section
```

### Docker Compose

```yaml
environment:
  - NODE_ENV=staging
  - DATABASE_URL=postgresql://user:pass@postgres:5432/db
  - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}  # From shell
```

### GitHub Actions (Staging/Production)

```bash
# Via GitHub CLI
gh secret set VERCEL_TOKEN --body "your-token"

# Via GitHub UI
# Settings > Secrets > New repository secret
```

### Vercel

```bash
# Via CLI
vercel env add DATABASE_URL production postgresql://...

# Via Dashboard
# Project > Settings > Environment Variables
```

---

## Best Practices

### ✅ DO:

- Use long, random secrets (min 32 characters)
- Store secrets in secret management service
- Rotate secrets quarterly
- Use different secrets for each environment
- Document all variables in code
- Validate on startup
- Use strong database passwords
- Enable HTTPS in production

### ❌ DON'T:

- Commit secrets to git (even .env files)
- Use simple/guessable passwords
- Share secrets via email/chat
- Print secrets in logs
- Reuse secrets across environments
- Leave empty/default secrets in production
- Store secrets in comments

---

## Troubleshooting

### "Missing required environment variable"

```bash
# 1. Check which variable is missing
# 2. Set it in appropriate place:
#    - .env (local)
#    - Docker: docker-compose.yml or .env
#    - GitHub: Settings > Secrets
#    - Vercel: Project > Settings > Environment

# 3. Restart application
```

### "Invalid format: DATABASE_URL"

```bash
# Check format:
# SQLite: file:./db/sqlite.db
# PostgreSQL: postgresql://user:pass@host:5432/db
# MongoDB: mongodb+srv://user:pass@cluster.mongodb.net/db

# Common issues:
❌ postgresql://user:pass@localhost  (missing :5432)
❌ postgresql://user:pass@host/      (missing database name)
✅ postgresql://user:pass@host:5432/db
```

### "Cannot connect to Redis"

```bash
# 1. Check REDIS_URL format
#    - redis://localhost:6379
#    - redis://:password@localhost:6379

# 2. Verify Redis is running
docker-compose ps redis

# 3. If REDIS_URL not set, app should still work
#    (Redis is optional)
```

### "ANTHROPIC_API_KEY is invalid"

```bash
# Check format:
# sk-ant-v1-... (Anthropic Claude API key)

# Verify key is active
# - Check Anthropic dashboard
# - Verify billing is up to date
# - Check key hasn't been rotated

# Test locally:
ANTHROPIC_API_KEY=sk-ant-v1-xxx npm run dev
```

---

## Environment File Templates

### For .env.local (development)

```bash
# Copy .env.development.example to .env
# Edit these if you want to override defaults:

NODE_ENV=development

# For using real Google Calendar:
# GOOGLE_CALENDAR_MOCK=false
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...

# For using real Anthropic:
# ANTHROPIC_MOCK=false
# ANTHROPIC_API_KEY=sk-ant-v1-...

# Otherwise, defaults use mock mode ✅
```

### For docker-compose (staging)

```bash
# In docker-compose.staging.yml:
environment:
  - NODE_ENV=staging
  - DATABASE_URL=postgresql://user:pass@postgres:5432/db
  - DATABASE_MOCK=false
  - GOOGLE_CALENDAR_MOCK=false
  - TWILIO_MOCK=false
  - SENDGRID_MOCK=false
  - ANTHROPIC_MOCK=false
  # ... more variables
```

### For Vercel (production)

```bash
# Via Vercel Dashboard:
# Project > Settings > Environment Variables

# Add for "Production" environment:
NODE_ENV: production
DATABASE_URL: postgresql://...
ANTHROPIC_API_KEY: sk-ant-...
NEXTAUTH_SECRET: very-long-random-secret
# ... etc
```

---

## Reference

**Total Variables:** 50+
**Required for Production:** 15+
**Environment-Specific:** 10+
**Optional:** 25+

See `.env.production.example` for comprehensive list with descriptions.

---

## Support

- **Questions:** Check this file and linked docs
- **Issues:** GitHub > Issues
- **Help:** `devops@example.com`
