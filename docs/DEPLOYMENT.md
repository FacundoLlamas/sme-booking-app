# SME Booking App - Deployment Guide

## Overview

This guide covers deployment of the SME Booking App to various environments:
- **Local Development**: Docker Compose
- **Staging**: Docker Compose + GitHub Actions
- **Production**: Vercel + GitHub Actions

---

## Prerequisites

### Required Tools
- Docker & Docker Compose (for local/staging)
- Node.js 20+
- npm or npm ci
- Git
- Vercel CLI (for Vercel deployments)

### Required Accounts
- GitHub (for actions & code hosting)
- Vercel (for production hosting)
- Google Cloud (for Calendar API)
- Twilio (for SMS)
- SendGrid (for Email)
- Anthropic (for LLM)

### Required Secrets
All production secrets should be stored in:
- GitHub Secrets (for CI/CD)
- Vercel Environment Variables (for runtime)
- Secret management service (production)

---

## 1. Local Development

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/sme-booking-app.git
cd sme-booking-app

# Start all services
docker-compose up

# In another terminal, run migrations
docker exec sme-booking-app npx prisma migrate dev

# Access the app
open http://localhost:3000
```

### Services Running

| Service | URL | Purpose |
|---------|-----|---------|
| App | http://localhost:3000 | Main Next.js application |
| Redis | localhost:6379 | Caching & job queue |
| Postgres | localhost:5432 | Optional database |

### Environment

Development uses mock services:
- ✅ Mock Google Calendar (no API key needed)
- ✅ Mock SMS/Email (no Twilio/SendGrid needed)
- ✅ Mock LLM (no Anthropic API key needed)
- ✅ SQLite database (file-based)

### Developing

```bash
# Files are watched via volume mounts
# Changes to src/ are hot-reloaded
vim src/components/MyComponent.tsx

# Run tests
npm test

# Type check
npm run type-check

# Format code
npm run format
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️  Deletes data!)
docker-compose down -v
```

---

## 2. Staging Deployment

### Prerequisites

1. **Set up staging infrastructure:**
   ```bash
   # PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
   # Redis (AWS ElastiCache, Google Cloud Memorystore, etc.)
   # Nginx/Load Balancer
   ```

2. **Configure GitHub Secrets** (Settings > Secrets):
   ```
   DATABASE_URL_STAGING=postgresql://user:pass@staging-db.example.com:5432/sme_booking
   DB_USER_STAGING=staging_user
   DB_PASSWORD_STAGING=your-secure-password
   DB_NAME_STAGING=sme_booking_staging
   REDIS_PASSWORD_STAGING=your-redis-password
   NEXTAUTH_SECRET_STAGING=your-random-secret-min-32-chars
   VERCEL_TOKEN=your-vercel-token
   VERCEL_ORG_ID=your-org-id
   VERCEL_PROJECT_ID=your-project-id
   ```

3. **Create staging branch:**
   ```bash
   git checkout -b staging
   git push origin staging
   ```

### Deploy via GitHub Actions

```bash
# Push to develop branch triggers staging deployment
git commit -m "Feature: add booking management"
git push origin develop

# Automatically:
# ✅ Runs lint, test, build
# ✅ Builds Docker image
# ✅ Pushes to registry
# ✅ Deploys to staging via Vercel
# ✅ Runs smoke tests
```

### Manual Staging Deployment

```bash
# Deploy specific branch to staging
git push origin feature-branch

# GitHub Actions will:
# 1. Run CI checks
# 2. Build & push Docker image
# 3. Deploy to staging
# 4. Run smoke tests
# 5. Report status
```

### Staging Verification

```bash
# Check deployment status
curl https://staging.booking.example.com/api/health

# View logs
vercel logs sme-booking-app --scope=your-org

# Run E2E tests against staging
npx playwright test --config=playwright.staging.config.ts
```

---

## 3. Production Deployment

### ⚠️  SECURITY CHECKLIST

Before deploying to production:

- [ ] All environment variables are in secret manager
- [ ] Database backups configured & tested
- [ ] SSL/TLS certificates are valid
- [ ] CORS/CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Logging & monitoring active
- [ ] Disaster recovery plan documented
- [ ] Security audit completed
- [ ] Load testing passed
- [ ] Rollback procedure tested

### Prerequisites

1. **Production infrastructure:**
   ```
   ✅ Managed PostgreSQL (RDS, Cloud SQL, etc.)
   ✅ Managed Redis (ElastiCache, Cloud Memorystore, etc.)
   ✅ Vercel (managed hosting)
   ✅ CDN (Vercel, Cloudflare, etc.)
   ✅ SSL/TLS certificates
   ✅ Monitoring & alerting
   ✅ Backup service
   ```

2. **Production secrets** (GitHub Secrets):
   ```
   DATABASE_URL_PROD=postgresql://user:pass@prod-db.example.com:5432/sme_booking_prod
   DB_USER_PROD=prod_user
   DB_PASSWORD_PROD=very-secure-production-password
   DB_NAME_PROD=sme_booking_prod
   REDIS_PASSWORD_PROD=very-secure-redis-password
   NEXTAUTH_SECRET_PROD=use-openssl-rand-hex-32-chars
   VERCEL_TOKEN=your-vercel-token
   VERCEL_ORG_ID=your-org-id
   VERCEL_PROJECT_ID=your-project-id
   GOOGLE_CLIENT_ID=your-production-client-id
   GOOGLE_CLIENT_SECRET=your-production-secret
   ANTHROPIC_API_KEY=sk-ant-v1-your-key
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   SENDGRID_API_KEY=SG.your-key
   SENTRY_DSN=https://your-key@sentry.io/project-id
   ```

3. **Create production branch:**
   ```bash
   git checkout main
   git pull origin main
   # main is your production branch
   ```

### Deploy to Production

```bash
# Create release PR
git checkout -b release/v1.2.3
# Update version numbers
git commit -m "chore: release v1.2.3"
git push origin release/v1.2.3

# Open PR, get approvals
# Merge to develop, then merge to main
git checkout main
git pull origin develop
git push origin main

# GitHub Actions will:
# 1. Run full CI suite
# 2. Build optimized Docker image
# 3. Run security scanning
# 4. Deploy to Vercel production
# 5. Run smoke tests
# 6. Verify deployment health
```

### Production Verification

```bash
# Check health endpoint
curl https://booking.example.com/api/health

# View production logs
vercel logs sme-booking-app --scope=your-org --env=production

# Monitor errors
# Check Sentry dashboard at https://sentry.io/...

# Monitor performance
# Check Vercel Analytics dashboard
```

---

## Database Migrations

### Development

```bash
# Create a new migration
npx prisma migrate dev --name add_new_feature

# Review the generated migration file
cat prisma/migrations/XXX_add_new_feature/migration.sql

# Undo last migration
npx prisma migrate resolve --rolled-back XXX_add_new_feature
```

### Staging/Production

```bash
# Apply pending migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Generate Prisma Client
npx prisma generate
```

### Deployment with Migrations

**Automatic (recommended for staging):**
```bash
# Deploy workflow automatically runs:
npx prisma migrate deploy
npx prisma generate
npm run build
```

**Manual (recommended for production):**
```bash
# 1. Create PR with migration
# 2. Deploy to staging
# 3. Verify migration works in staging
# 4. Get approval for production
# 5. Merge to main
# 6. Production deployment workflow handles migration

# To manually run:
# 1. SSH to production server
# 2. cd /app
# 3. npx prisma migrate deploy
# 4. Verify in application
```

### Rollback Procedure

```bash
# 1. Identify problematic migration
npx prisma migrate status

# 2. Rollback (⚠️  Be careful with data!)
npx prisma migrate resolve --rolled-back XXXX_migration_name

# 3. Create new migration to fix schema
npx prisma migrate dev --name fix_migration_issue

# 4. Deploy fixed migration
npx prisma migrate deploy

# 5. Verify in monitoring/logs
```

---

## CI/CD Pipeline

### Workflow: Pull Request

```
1. Developer pushes to feature branch
2. GitHub Actions runs:
   ✅ Lint (ESLint, Prettier)
   ✅ Type check (TypeScript)
   ✅ Tests (Vitest)
   ✅ Build check
   ✅ Docker build
   ✅ Security scan
3. Reviewer reviews code & CI results
4. If CI fails, merge is blocked
5. On approval, code merged to develop
```

### Workflow: Staging Deployment

```
1. Merge PR to develop branch
2. GitHub Actions runs:
   ✅ All CI checks (same as PR)
   ✅ Build production Docker image
   ✅ Push to container registry
   ✅ Deploy to Vercel staging
   ✅ Run smoke tests
   ✅ Health checks
3. Automatic slack/email notification
4. Team verifies in staging environment
```

### Workflow: Production Deployment

```
1. Merge to main branch (requires approval)
2. GitHub Actions runs:
   ✅ All CI checks
   ✅ Database validation
   ✅ Build optimized Docker image
   ✅ Security scanning (container)
   ✅ Deploy to Vercel production
   ✅ Run smoke tests
   ✅ Verify health
3. Manual database migration approval (if needed)
4. Slack/email notification to ops team
5. Monitor logs & metrics
```

### Secrets Management

#### GitHub Secrets (for CI/CD)

```bash
# Add secrets in GitHub UI:
# Settings > Secrets > New repository secret

# Or via CLI:
gh secret set VERCEL_TOKEN --body "your-token"
gh secret set DATABASE_URL_PROD --body "postgresql://..."
```

#### Vercel Environment Variables

```bash
# Via Vercel dashboard:
# Project > Settings > Environment Variables

# Via Vercel CLI:
vercel env add DATABASE_URL production postgresql://...
vercel env add ANTHROPIC_API_KEY production sk-ant-...
```

#### Rotate Secrets

```bash
# 1. Create new secret value
# 2. Update in secret manager (GitHub/Vercel)
# 3. Deploy to staging, verify works
# 4. Deploy to production
# 5. Monitor logs for any issues
# 6. Delete old secret after 24h
```

---

## Monitoring & Observability

### Health Checks

```bash
# App health endpoint
curl https://booking.example.com/api/health

# Response:
# {
#   "status": "healthy",
#   "timestamp": "2025-02-07T15:47:00Z",
#   "uptime": 86400,
#   "checks": {
#     "database": "ok",
#     "redis": "ok",
#     "external_services": "ok"
#   }
# }
```

### Logging

```bash
# Vercel logs
vercel logs sme-booking-app

# Filter by status
vercel logs sme-booking-app --status=500

# Follow in real-time
vercel logs sme-booking-app --follow
```

### Monitoring Services

- **Sentry**: Error tracking & crash reporting
- **Vercel Analytics**: Performance metrics
- **Datadog** (optional): Infrastructure monitoring
- **New Relic** (optional): Application monitoring

---

## Disaster Recovery

### Backup Procedure

```bash
# Automated backups (configured in deployment)
# - Daily database backups
# - 30-day retention
# - Geographic redundancy

# Verify backup
aws s3 ls s3://sme-booking-backups-prod/
```

### Restore Procedure

```bash
# 1. Stop application (optional)
# 2. Restore database from backup
#    - For RDS: AWS Console > Snapshots > Restore
#    - For Cloud SQL: Cloud Console > Backups > Restore
# 3. Verify data integrity
# 4. Restart application
# 5. Run smoke tests
```

### Incident Response

```bash
# If production is down:
# 1. Check Vercel deployment status
# 2. View Sentry for errors
# 3. Check database connectivity
# 4. Check Redis connectivity
# 5. Review recent deployments
# 6. Rollback if needed
```

### Rollback

```bash
# Via Vercel:
# 1. Project > Deployments
# 2. Find previous working deployment
# 3. Click "Promote to Production"
# 4. Verify in production

# Via GitHub:
# 1. Revert problematic commit
# 2. Push to main
# 3. GitHub Actions deploys previous version
```

---

## Performance Optimization

### Bundle Size

```bash
# Analyze build
npm run build:analyze

# Review .next/server/pages-manifest.json for large chunks
# Optimize imports, lazy load, code split
```

### Database Optimization

```bash
# Monitor slow queries
# In RDS/Cloud SQL dashboard

# Add indexes if needed
# Create migration and deploy
npx prisma migrate dev --name add_indexes
```

### Caching

- **Static assets**: 1-year cache (immutable)
- **HTML/API**: No cache (always fresh)
- **Redis**: 1-hour TTL (configurable)

---

## Support & Documentation

- **Deployment Issues**: `deployment@example.com`
- **Security Issues**: `security@example.com`
- **On-Call**: `#oncall` in Slack
- **Runbooks**: https://docs.example.com/runbooks

---

## Checklist

Before production deployment:

- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Security scan passed
- [ ] Performance acceptable
- [ ] Database migration tested in staging
- [ ] All env vars set in production
- [ ] Monitoring/alerts configured
- [ ] Backup verified
- [ ] Rollback procedure tested
- [ ] Team notified
