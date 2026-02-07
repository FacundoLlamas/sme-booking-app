# CI/CD Pipeline Setup Guide

## Overview

This document describes the complete CI/CD pipeline for SME Booking App:
- **CI (Continuous Integration)**: `.github/workflows/ci.yml` - Automated testing & building
- **CD (Continuous Deployment)**: `.github/workflows/deploy.yml` - Automated deployments

---

## CI Pipeline (.github/workflows/ci.yml)

### Triggers

| Trigger | Branches | When |
|---------|----------|------|
| Push | main, develop | Code pushed to main or develop |
| Pull Request | main, develop | PR opened against main or develop |

### Jobs

#### 1. Lint (Runs first)

**Purpose:** Check code quality and formatting

```
Runs:
✅ Prettier (formatting)
✅ ESLint (linting)
✅ TypeScript (type checking)
```

**Failure blocks:** Merge, Build, Docker

**Fix formatting issues:**
```bash
npm run format:fix
npm run lint:fix
```

#### 2. Test (Runs in parallel with Lint)

**Purpose:** Run all unit and integration tests

```
Runs:
✅ Jest/Vitest test suite
✅ Coverage report
✅ Upload to Codecov
```

**Failure blocks:** Merge, Build, Docker

**Run tests locally:**
```bash
npm test -- --run
npm run test:coverage
```

#### 3. Build (Depends on Lint + Test)

**Purpose:** Build Next.js application

```
Runs:
✅ npm run build
✅ Upload .next artifact
```

**Failure blocks:** Docker, Deploy

**Test build locally:**
```bash
npm run build
npm run start  # Test production build
```

#### 4. Build Docker (Depends on Lint + Test)

**Purpose:** Build Docker image for registry

```
Runs:
✅ Docker build (no push on CI)
✅ Build cache management
```

**Note:** On PR, docker image is built but not pushed

**Test Docker build locally:**
```bash
npm run docker:build
docker run -it sme-booking-app npm run test
```

#### 5. Security (Runs independently)

**Purpose:** Security scanning

```
Runs:
✅ npm audit (dependencies)
✅ Check outdated packages
```

**Fix security issues:**
```bash
npm audit fix
npm update
```

### CI Status Check

All jobs must pass before merge:
- ✅ Lint must pass
- ✅ Test must pass
- ✅ Build must pass
- ✅ Docker build must succeed

**On GitHub:**
```
Pull Request > Checks tab > All checks must have green ✅
```

---

## Deploy Pipeline (.github/workflows/deploy.yml)

### Triggers

| Trigger | Branches | Environment |
|---------|----------|-------------|
| Push | develop | Staging |
| Push | main | Production |
| Manual (workflow_dispatch) | any | Choose environment |

### Jobs

#### 1. Setup (Runs first)

**Purpose:** Determine target environment

```
Outputs:
- environment: staging or production
- vercel-target: preview or production
```

#### 2. Validate (Runs after Setup)

**Purpose:** Pre-deployment validation

```
Checks:
✅ Type check passes
✅ Build succeeds
✅ Required secrets exist
✅ Environment configuration valid
```

**Failure blocks:** Docker build, Deploy

#### 3. Build & Push Docker (Runs after Validate)

**Purpose:** Build Docker image and push to registry

```
Runs:
✅ Setup Docker buildx
✅ Login to registry (ghcr.io)
✅ Build optimized image
✅ Push to registry
✅ Security scan (Trivy)
```

**Access registry:**
```bash
# Login
docker login ghcr.io -u YOUR_USERNAME -p YOUR_TOKEN

# Pull image
docker pull ghcr.io/your-org/sme-booking-app:main-latest

# Push image
docker tag sme-booking-app ghcr.io/your-org/sme-booking-app:latest
docker push ghcr.io/your-org/sme-booking-app:latest
```

#### 4. Deploy Vercel (Runs after Validate)

**Purpose:** Deploy to Vercel

```
Runs:
✅ Pull Vercel project config
✅ Build project
✅ Deploy to Vercel
✅ Returns deployment URL
```

**Vercel environments:**
- Develop → preview (preview.sme-booking.vercel.app)
- Main → production (booking.example.com)

#### 5. Smoke Tests (Runs after Deploy)

**Purpose:** Verify deployment is working

```
Checks:
✅ Health endpoint (GET /api/health)
✅ API endpoint reachable
✅ Response times acceptable
✅ No obvious errors
```

**Failed smoke tests → Automatic rollback**

#### 6. Database Migration (Runs after Deploy)

**Purpose:** Apply pending database migrations

```
For Staging:
✅ Auto-migrate

For Production:
⚠️  Requires manual approval
```

#### 7. Notify (Runs at end)

**Purpose:** Report deployment status

```
Reports:
✅ Success/Failure status
✅ Deployment URL
✅ Commit & author info
```

---

## GitHub Secrets Setup

### Required Secrets

```bash
# Container Registry (for Docker builds)
GITHUB_TOKEN  # Auto-provided by GitHub Actions

# Vercel Deployment
VERCEL_TOKEN              # Get from https://vercel.com/account/tokens
VERCEL_ORG_ID             # From Vercel dashboard
VERCEL_PROJECT_ID         # From Vercel dashboard

# Staging Database
DATABASE_URL_STAGING      # postgresql://user:pass@host:5432/db
DB_USER_STAGING           # Database user
DB_PASSWORD_STAGING       # Database password
DB_NAME_STAGING           # Database name
REDIS_PASSWORD_STAGING    # Redis password

# Production Database
DATABASE_URL_PROD         # postgresql://user:pass@host:5432/db
DB_USER_PROD              # Database user
DB_PASSWORD_PROD          # Database password
DB_NAME_PROD              # Database name
REDIS_PASSWORD_PROD       # Redis password
```

### Add Secrets via GitHub UI

```
1. Go to Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Add secret name and value
4. Click "Add secret"
```

### Add Secrets via GitHub CLI

```bash
# Install GitHub CLI
# https://cli.github.com/

# Login
gh auth login

# Add secrets
gh secret set VERCEL_TOKEN --body "your-token-here"
gh secret set DATABASE_URL_STAGING --body "postgresql://user:pass@host/db"

# List secrets
gh secret list

# Delete secret
gh secret delete VERCEL_TOKEN
```

---

## Vercel Environment Variables

### Setup in Vercel Dashboard

```
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings > Environment Variables
4. Add variables for preview and production environments
```

### Via Vercel CLI

```bash
# Install
npm install -g vercel

# Login
vercel login

# Add environment variable
vercel env add ANTHROPIC_API_KEY production sk-ant-xxx

# List variables
vercel env ls

# Delete variable
vercel env rm ANTHROPIC_API_KEY production
```

### Required Vercel Variables

```
# Production Environment
NODE_ENV=production
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://booking.example.com

# Staging Environment (same with _STAGING suffix)
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Docker Registry (GHCR)

### Push to GitHub Container Registry

Images are automatically pushed by CI/CD, but you can manually push:

```bash
# Login
echo $GH_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Build and tag
docker build -t ghcr.io/your-org/sme-booking-app:latest .

# Push
docker push ghcr.io/your-org/sme-booking-app:latest

# Pull
docker pull ghcr.io/your-org/sme-booking-app:latest
```

### Make Package Public (Optional)

```
1. Go to GitHub > Packages > sme-booking-app
2. Settings > Manage Actions access
3. Click "Make public" (so others can pull)
```

---

## Monitoring Deployments

### GitHub Actions Dashboard

```
1. Go to GitHub > Actions tab
2. Click workflow (CI or Deploy)
3. Click run to see details
4. Check logs if failed
```

### Vercel Dashboard

```
1. Go to https://vercel.com/dashboard
2. Click project name
3. View Deployments tab
4. Click deployment to see details
5. Check Logs if failed
```

### View Logs

```bash
# GitHub Actions
# Via GitHub UI or:
gh run view WORKFLOW_ID

# Vercel
vercel logs sme-booking-app

# Follow in real-time
vercel logs sme-booking-app --follow
```

---

## Troubleshooting

### CI Fails: Lint Error

```bash
# View error
gh run view WORKFLOW_ID

# Fix locally
npm run format:fix
npm run lint:fix

# Commit and push
git add .
git commit -m "style: fix lint errors"
git push
```

### CI Fails: Test Error

```bash
# Run tests locally
npm test -- --run

# Fix failing tests
vim src/__tests__/failing.test.ts

# Commit
git add .
git commit -m "test: fix failing tests"
git push
```

### Build Fails

```bash
# Try building locally
npm run build

# Check for TypeScript errors
npm run type-check

# Fix and commit
git add .
git commit -m "fix: resolve build errors"
git push
```

### Vercel Deploy Fails

```bash
# Check Vercel logs
vercel logs sme-booking-app

# View deployment details
# https://vercel.com/dashboard > Project > Deployments

# Common issues:
# - Missing environment variables
# - Database connection failed
# - Build command failed
# - Health check failed

# Fix and try manual deploy:
vercel deploy --prod
```

### Smoke Tests Fail

```bash
# Check health endpoint
curl https://your-deployment.vercel.app/api/health

# View logs
vercel logs sme-booking-app --status=500

# Common issues:
# - API endpoints not responding
# - Database not connected
# - Environment variables not set

# Rollback to previous version:
# Vercel > Deployments > Select previous > Promote to Production
```

---

## Best Practices

### PR Workflow

```
1. Create feature branch
   git checkout -b feature/my-feature

2. Make changes and test
   npm test
   npm run build

3. Push to GitHub
   git push origin feature/my-feature

4. Open PR against develop
   - Write clear PR description
   - Link to issue if applicable
   - Request reviewers

5. Wait for CI checks
   - All checks must pass
   - Review feedback

6. Merge to develop
   - GitHub auto-deploys to staging
   - Verify in staging
   - Merge to main for production

7. Delete branch
   git push origin --delete feature/my-feature
```

### Commit Messages

```
Format: <type>: <subject>

Types:
- feat: New feature
- fix: Bug fix
- style: Formatting, no code change
- refactor: Code restructure
- test: Add/update tests
- docs: Documentation
- chore: Build, dependencies, etc.

Examples:
✅ feat: add booking reschedule feature
✅ fix: resolve timezone conversion bug
❌ fixed stuff
❌ updated code
```

### Code Review

- ✅ Verify CI checks pass
- ✅ Review code changes
- ✅ Check test coverage
- ✅ Test locally if needed
- ✅ Approve or request changes

### Production Deployments

- ✅ Deploy to staging first
- ✅ Test in staging (smoke tests)
- ✅ Get approval before main merge
- ✅ Merge to main (triggers production deploy)
- ✅ Monitor logs & metrics post-deploy
- ✅ Rollback if needed

---

## Advanced Configuration

### Custom Docker Build Args

Edit `.github/workflows/deploy.yml`:

```yaml
- uses: docker/build-push-action@v5
  with:
    build-args: |
      BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
      VCS_REF=${{ github.sha }}
```

### Matrix Builds (Multiple Node Versions)

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18.x, 20.x]
```

### Branch-Specific Actions

```yaml
if: github.ref == 'refs/heads/main'
  # Only on main branch
```

### Scheduled Deployments

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
```

---

## Support

- **Questions**: Check `.github/workflows/` for exact configuration
- **Issues**: GitHub > Issues > Create new issue
- **Deployment Help**: `deployment@example.com`
