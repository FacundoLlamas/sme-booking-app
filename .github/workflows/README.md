# GitHub Actions Workflows

This directory contains CI/CD pipelines for SME Booking App.

## Workflows

### 1. CI Workflow (`ci.yml`)

**Purpose:** Continuous Integration - Test and build on every push and PR

**Triggers:**
- Push to `main` or `develop` branches
- Pull Requests against `main` or `develop`

**Jobs:**
1. **Lint** - Code formatting and linting
   - Prettier format check
   - ESLint linting
   - TypeScript type checking

2. **Test** - Run test suite
   - Vitest unit tests
   - Coverage report
   - Upload to Codecov

3. **Build** - Build Next.js application
   - `npm run build`
   - Upload build artifact

4. **Build Docker** - Build Docker image
   - Multi-stage Dockerfile
   - Container registry push (staging/prod only)

5. **Security** - Security scanning
   - `npm audit`
   - Check outdated packages

**Status:** All jobs must pass before merge

**View Results:**
- GitHub UI: Pull Request > Checks tab
- CLI: `gh run view <run-id>`

---

### 2. Deploy Workflow (`deploy.yml`)

**Purpose:** Continuous Deployment - Deploy to staging and production

**Triggers:**
- Push to `develop` → Deploy to staging
- Push to `main` → Deploy to production
- Manual trigger via `workflow_dispatch` for custom environments

**Jobs:**

1. **Setup** - Determine target environment
   - develop → staging
   - main → production

2. **Validate** - Pre-deployment checks
   - Type check
   - Build verification
   - Secret validation

3. **Build & Push Docker** - Build and push container image
   - Multi-stage build
   - Push to ghcr.io
   - Security scan with Trivy

4. **Deploy Vercel** - Deploy to Vercel
   - Pull environment configuration
   - Build project
   - Deploy to appropriate environment
   - Returns deployment URL

5. **Smoke Tests** - Verify deployment works
   - Health check endpoint
   - API endpoint tests
   - Response time checks

6. **Migrate Database** - Apply database migrations
   - Staging: Automatic
   - Production: Requires approval

7. **Notify** - Report deployment status
   - Upload summary artifact
   - Print status

**Environment Requirements:**
- `VERCEL_TOKEN` - Vercel CLI token
- `VERCEL_ORG_ID` - Organization ID
- `VERCEL_PROJECT_ID` - Project ID
- `DATABASE_URL_*` - Database connection strings

**View Results:**
- GitHub UI: Actions > Deploy > Click run
- Vercel Dashboard: Deployments tab
- Logs: `vercel logs sme-booking-app --follow`

---

## Setup Instructions

### 1. Add GitHub Secrets

```bash
# Using GitHub CLI
gh secret set VERCEL_TOKEN --body "your-token"
gh secret set VERCEL_ORG_ID --body "your-org-id"
gh secret set VERCEL_PROJECT_ID --body "your-project-id"
gh secret set DATABASE_URL_STAGING --body "postgresql://..."
gh secret set DATABASE_URL_PROD --body "postgresql://..."
```

### 2. Configure Vercel

```bash
# Get tokens and IDs
vercel login
vercel link

# Set environment variables in Vercel dashboard
# Project > Settings > Environment Variables
```

### 3. Configure GitHub Branch Protection

```
Settings > Branches > Add branch protection rule
- Branch: main
- Require status checks to pass before merging: ✅
- Required status checks: lint, test, build, build-docker
- Require approval from code owners: ✅
- Dismiss stale PR approvals when new commits are pushed: ✅
```

---

## Workflow Status

### Current Status

- ✅ CI Workflow: Functional
- ✅ Deploy Workflow: Functional
- ✅ Docker builds: Functional
- ✅ Vercel deployments: Configured
- ⏳ Smoke tests: Basic implementation

### Badges (for README)

```markdown
[![CI](https://github.com/your-org/sme-booking-app/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/sme-booking-app/actions/workflows/ci.yml)
[![Deploy](https://github.com/your-org/sme-booking-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-org/sme-booking-app/actions/workflows/deploy.yml)
```

---

## Debugging Workflows

### View Workflow Runs

```bash
# List recent runs
gh run list

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

### Common Issues

#### Lint Failures
```bash
# Fix locally
npm run lint:fix
npm run format

# Commit and push
git add .
git commit -m "style: fix lint issues"
git push
```

#### Test Failures
```bash
# Run tests locally
npm test -- --run

# Fix failing tests
# Commit and push
git add .
git commit -m "test: fix failing tests"
git push
```

#### Build Failures
```bash
# Test build locally
npm run build

# Check for type errors
npm run type-check

# Fix issues and push
git add .
git commit -m "fix: resolve build errors"
git push
```

#### Deployment Failures
```bash
# Check Vercel logs
vercel logs sme-booking-app --follow

# Common causes:
# - Missing environment variables
# - Database connection issues
# - Health check failing

# Fix and retry
git push origin main  # Triggers new deployment
```

---

## Best Practices

### PR Workflow

1. Create feature branch: `git checkout -b feat/my-feature`
2. Make changes and test: `npm test && npm run build`
3. Push to GitHub: `git push origin feat/my-feature`
4. Open PR against `develop`
5. Wait for CI checks (all must pass)
6. Get code review
7. Merge to `develop` (auto-deploys to staging)
8. Verify in staging
9. Create PR from `develop` to `main`
10. Get approval (production requires this)
11. Merge to `main` (auto-deploys to production)

### Commit Messages

```
Format: <type>: <subject>

Types:
- feat: New feature
- fix: Bug fix
- style: Formatting
- refactor: Code restructure
- test: Tests
- docs: Documentation
- chore: Build, deps, etc

Examples:
✅ feat: add booking reschedule feature
✅ fix: resolve timezone conversion bug
❌ fixed stuff
```

### Environment Promotion

```
develop → staging → main (→ production)
           ↓
      (Test here)
           ↓
        Approve PR
           ↓
          Merge
           ↓
       Deploy prod
```

---

## Customization

### Change Notification Channel

Edit `deploy.yml` to send notifications to Slack:

```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Deployment to ${{ needs.setup.outputs.environment }} complete"
      }
```

### Add More Test Steps

Edit `ci.yml` to add E2E tests:

```yaml
- name: Run E2E tests
  run: npm run test:e2e
```

### Customize Health Checks

Edit `deploy.yml` smoke tests section:

```yaml
- name: Custom health check
  run: |
    curl https://staging.booking.example.com/api/health
    curl https://staging.booking.example.com/api/v1/availability
```

---

## Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Events that Trigger Workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)
- [Vercel CLI](https://vercel.com/docs/cli)

---

## Support

- **Questions:** Check workflow YAML comments
- **Issues:** GitHub > Issues > New issue
- **Help:** devops@example.com

---

**Last Updated:** February 7, 2025
**Maintained By:** DevOps Team
