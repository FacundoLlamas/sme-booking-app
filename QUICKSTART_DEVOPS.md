# DevOps Quick Start Guide

Get the SME Booking App CI/CD pipeline and deployment running in 15 minutes.

---

## 5-Minute Setup

### 1. Create GitHub Secrets (5 min)

```bash
# Install GitHub CLI if needed: https://cli.github.com/

# Create Vercel account and project
# Go to https://vercel.com/dashboard

# Get tokens and IDs
vercel login
vercel link

# Copy from Vercel dashboard:
# Settings > API Tokens → VERCEL_TOKEN
# Account Settings > Team/Org ID → VERCEL_ORG_ID
# Select project → Project ID → VERCEL_PROJECT_ID

# Add to GitHub Secrets
gh secret set VERCEL_TOKEN --body "your-vercel-token"
gh secret set VERCEL_ORG_ID --body "your-org-id"
gh secret set VERCEL_PROJECT_ID --body "your-project-id"
gh secret set DATABASE_URL_STAGING --body "postgresql://user:pass@host:5432/db"
gh secret set DATABASE_URL_PROD --body "postgresql://user:pass@host:5432/db"
```

### 2. Deploy to Staging (2 min)

```bash
# Push to develop branch
git checkout develop
git pull origin develop
git commit -m "feat: add new feature" --allow-empty
git push origin develop

# GitHub Actions automatically:
# ✅ Runs CI checks
# ✅ Builds Docker image
# ✅ Deploys to Vercel staging
# ✅ Runs smoke tests
```

### 3. Deploy to Production (1 min)

```bash
# Merge to main
git checkout main
git pull origin develop
git push origin main

# GitHub Actions automatically:
# ✅ All CI checks
# ✅ Deploy to production
# ✅ Health checks
# ✅ Notifications
```

---

## Common Commands

### Local Development

```bash
# Start all services
docker-compose up

# Run tests
npm test

# Type check
npm run type-check

# Build
npm run build

# Format & lint
npm run format:fix
npm run lint:fix

# Check health
curl http://localhost:3000/api/health
```

### Local Docker

```bash
# Build image
npm run docker:build

# Run in container
docker run -p 3000:3000 sme-booking-app

# With compose
docker-compose up app
```

### Staging

```bash
# View logs
vercel logs sme-booking-app --env=staging --follow

# View deployments
vercel deployments --env=staging

# Health check
curl https://staging.booking.example.com/api/health
```

### Production

```bash
# View logs
vercel logs sme-booking-app --env=production --follow

# View deployments
vercel deployments --env=production

# Health check
curl https://booking.example.com/api/health

# Rollback to previous
# Vercel UI → Deployments → Select previous → Promote to Production
```

---

## Troubleshooting

### CI Fails

```bash
# Check which step failed
# GitHub: Pull Request > Checks > Click failing job

# Common fixes:
npm run lint:fix        # Lint/format errors
npm run type-check      # TypeScript errors
npm test -- --run       # Test failures
npm run build           # Build errors

# Commit and push
git add .
git commit -m "fix: resolve CI errors"
git push
```

### Deployment Fails

```bash
# Check Vercel logs
vercel logs sme-booking-app --follow

# Common issues:
# - Missing env variables → Add to Vercel dashboard
# - Database not connected → Check DATABASE_URL
# - Health check failed → Check /api/health endpoint
# - Build failed → Check build command in vercel.json

# Fix and retry
git push origin main
```

### Docker Build Fails

```bash
# Test locally
npm run docker:build

# Check Dockerfile
cat Dockerfile

# Common issues:
# - npm ci fails → Check package-lock.json
# - Prisma generate fails → npm run prisma:generate
# - Build fails → npm run build

# Fix and push
git push origin develop  # Triggers GitHub Actions
```

---

## File Locations

| File | Purpose | Edit When |
|------|---------|-----------|
| `.github/workflows/ci.yml` | CI pipeline | Add lint/test steps |
| `.github/workflows/deploy.yml` | CD pipeline | Change deploy process |
| `Dockerfile` | Container image | Change base image, deps |
| `docker-compose.yml` | Local dev setup | Add services (postgres, etc) |
| `vercel.json` | Vercel config | Change build/routes |
| `.env.example` | Dev variables | Add new env vars |
| `.env.production.example` | Prod variables | Document prod vars |
| `docs/DEPLOYMENT.md` | Deployment guide | When deploying |
| `docs/DATABASE_MIGRATIONS.md` | Migration guide | When changing schema |

---

## Environment Variables

### Development (.env)

```bash
# Copy example and edit
cp .env.development.example .env

# Most defaults work, but update if needed:
# - DATABASE_URL (if using PostgreSQL)
# - ANTHROPIC_API_KEY (if testing with real LLM)
# - GOOGLE_CALENDAR_MOCK (false for real calendar)
```

### Staging (GitHub Secrets)

```bash
# Add to GitHub:
# DATABASE_URL_STAGING=postgresql://...
# DB_USER_STAGING=user
# DB_PASSWORD_STAGING=pass
# REDIS_PASSWORD_STAGING=pass
```

### Production (Vercel + GitHub Secrets)

```bash
# Add same to GitHub Secrets with _PROD suffix

# Also add to Vercel:
# Settings > Environment Variables
# DATABASE_URL: postgresql://...
# ANTHROPIC_API_KEY: sk-ant-...
# NEXTAUTH_SECRET: very-long-random-secret
```

---

## Deployment Flow

### Standard Workflow

```
1. Create feature branch
   git checkout -b feat/my-feature

2. Make changes & test
   npm test
   npm run build

3. Push & open PR
   git push origin feat/my-feature
   
   → GitHub Actions runs CI
   → All checks must pass to merge

4. Get approval & merge to develop
   git push origin develop
   
   → Deploys to staging
   → Verify in staging

5. Create PR: develop → main
   
   → Code review
   → Approval required

6. Merge to main
   git push origin main
   
   → Deploys to production
   → Health checks
   → Smoke tests
```

### Quick Deploy (Small Hotfix)

```bash
# If you need urgent production deploy:

git checkout -b hotfix/my-fix
# Make minimal fix
npm test
npm run build

# Merge directly if urgent:
git push origin hotfix/my-fix
git checkout main
git merge hotfix/my-fix
git push origin main

# ⚠️  Do this only for critical fixes!
# Normal workflow is safer
```

---

## Monitoring

### During Deployment

```bash
# Watch Vercel build
vercel logs sme-booking-app --follow

# Or GitHub UI:
# Actions > Deploy > Watch live
```

### After Deployment

```bash
# Check health
curl https://booking.example.com/api/health

# View errors
vercel logs sme-booking-app --follow

# Performance
# Vercel dashboard > Analytics
```

### Long-term Monitoring

- Errors: Sentry dashboard
- Performance: Vercel analytics
- Infrastructure: Docker stats
- Database: Managed service dashboard

---

## Database Migrations

### Simple Migration

```bash
# Make schema change
vim prisma/schema.prisma

# Create migration
npx prisma migrate dev --name add_feature

# Test locally
npm test

# Deploy
git add prisma/
git commit -m "feat: add feature (with migration)"
git push

# Auto-applied in CI/CD ✅
```

### Production Migration

```bash
# 1. Test in staging
# ✅ Verified working

# 2. Create PR
git push origin develop  # Staging
# (wait for deployment, test it)

# 3. Merge to main
git push origin main

# 4. GitHub Actions:
#    - Asks for migration approval
#    - Manual step in CD workflow
#    - Applies migration
#    - Smoke tests
```

---

## Rollback

### Code Rollback

```bash
# Revert last commit
git revert HEAD~1
git push origin main

# Or rollback via Vercel:
# Dashboard > Deployments > Previous > Promote
```

### Database Rollback

```bash
# If migration failed:
npx prisma migrate resolve --rolled-back XXX_name

# Create rollback migration
npx prisma migrate dev --name rollback_feature

# Deploy
git push origin main
```

---

## Useful Links

| Link | Purpose |
|------|---------|
| [GitHub Actions](https://docs.github.com/actions) | Workflow docs |
| [Vercel Docs](https://vercel.com/docs) | Deployment docs |
| [Docker Compose](https://docs.docker.com/compose) | Local dev |
| [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate) | DB migrations |
| [Next.js Deployment](https://nextjs.org/docs/deployment) | Framework guide |

---

## Emergency

### App Down

```bash
# 1. Check status
vercel logs sme-booking-app --env=production

# 2. Identify issue
# - Health check failing? → Check dependencies
# - Build failed? → Check build logs
# - Deploy failed? → Check deployment
# - Runtime error? → Check error logs

# 3. Rollback if needed
# Vercel > Deployments > Previous > Promote

# 4. Fix and re-deploy
git revert HEAD~1
git push origin main
```

### Database Down

```bash
# 1. Check connectivity
# Managed service dashboard

# 2. If not responding
# - Check network/firewall
# - Check credentials
# - Check resource limits

# 3. Restore from backup
# Managed service console > Backups > Restore
```

---

## Contact

- **Deployment Help**: `devops@example.com`
- **Emergencies**: `#oncall` in Slack
- **Documentation**: `/docs` folder

---

## Next Steps

1. ✅ Set up GitHub Secrets (5 min)
2. ✅ Deploy to staging (2 min)
3. ✅ Verify in staging (3 min)
4. ✅ Deploy to production (1 min)
5. ✅ Monitor & celebrate 🎉

---

**Ready to deploy? Start with:**
```bash
git push origin develop
```

Happy deploying! 🚀
