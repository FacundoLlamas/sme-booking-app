# Database Migrations Guide

## Overview

This guide covers database migrations for SME Booking App using Prisma ORM.

**Key Principles:**
- Migrations are version-controlled in `prisma/migrations/`
- Always test migrations in staging before production
- Maintain rollback capability for all migrations
- Document breaking changes

---

## Quick Start

### Development

```bash
# Create a new migration
npx prisma migrate dev --name add_feature_name

# This will:
# 1. Create a migration file
# 2. Apply it to development database
# 3. Regenerate Prisma Client
```

### Staging/Production

```bash
# Apply pending migrations (no prompts)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

---

## Migration Workflow

### 1. Schema Change

Edit `prisma/schema.prisma`:

```prisma
model Booking {
  id                  Int     @id @default(autoincrement())
  confirmationCode    String  @unique
  status              String  @default("pending")
  // Add new field:
  rescheduleReason    String?  @db.Text
  rescheduledAt       DateTime?
}
```

### 2. Create Migration

```bash
# Creates migration file with SQL
npx prisma migrate dev --name add_reschedule_fields

# Review generated SQL
cat prisma/migrations/XXX_add_reschedule_fields/migration.sql
```

### 3. Test Locally

```bash
# Already applied, but verify:
npm test

# Check if app starts
npm run dev

# Query new fields
npm run prisma:studio
```

### 4. Commit & Push

```bash
git add prisma/
git commit -m "feat: add reschedule fields"
git push origin feature-branch
```

### 5. Deploy to Staging

```bash
# Merge to develop (or push to develop)
git push origin develop

# GitHub Actions will:
# 1. Run CI checks
# 2. Deploy to staging
# 3. Run: npx prisma migrate deploy
# 4. Run smoke tests
```

### 6. Test in Staging

```bash
# Verify migration ran successfully
curl https://staging.booking.example.com/api/health

# Check logs
vercel logs sme-booking-app --env=staging

# Verify data is intact
# - Check booking records still exist
# - Check new fields are NULL for existing records
```

### 7. Deploy to Production

```bash
# Merge to main (requires PR approval)
git push origin main

# GitHub Actions will:
# 1. Run full CI suite
# 2. Validate environment
# 3. Deploy to Vercel
# 4. Run: npx prisma migrate deploy
# 5. Run smoke tests
```

### 8. Monitor

```bash
# Monitor logs
vercel logs sme-booking-app --env=production

# Watch for errors related to new columns
# Verify application still responding
# Check database for successful migration
```

---

## Migration Types

### Safe Migration (Non-Breaking)

✅ **Adding columns with defaults:**
```prisma
model Booking {
  createdAt DateTime @default(now())
}
```

✅ **Adding optional columns:**
```prisma
model Booking {
  notes String? @db.Text
}
```

✅ **Renaming with backwards compatibility:**
```prisma
// Old: email field
// New: customerEmail field
// Keep old field, add new one
```

**Zero downtime deployment:**
```bash
# 1. Deploy code that reads both old & new field
# 2. Migrate database (add new field)
# 3. Deploy code that only reads new field
```

### Risky Migration (Breaking)

⚠️  **Deleting columns:**
```prisma
// Remove field from schema
// Generated migration will DROP COLUMN
// This deletes data!
```

⚠️  **Changing column type:**
```prisma
// String → Int
// Generated migration tries to CAST
// May fail if data incompatible
```

⚠️  **Adding NOT NULL columns:**
```prisma
model Booking {
  status String  // Previously nullable
}
```

### Handling Breaking Changes

**Approach 1: Gradual Migration (Recommended)**

```
1. Add new column alongside old
2. Deploy code that populates both
3. In staging, verify data migrated
4. In production, after time period:
   a. Deploy code that only uses new column
   b. Run migration to drop old column
```

**Approach 2: Zero-Downtime Deployment**

```
1. Deploy code that handles both old & new column
2. Run migration (add new column with data migration)
3. Verify in staging
4. Deploy to production
5. Migration happens while app still running
6. App accepts requests on both old & new columns
7. Next deployment removes old column support
```

---

## Common Migration Scenarios

### Add a new field to model

```bash
# 1. Edit schema
vim prisma/schema.prisma
# Add field

# 2. Create migration
npx prisma migrate dev --name add_custom_field

# Generated migration.sql:
# ALTER TABLE "Booking" ADD COLUMN "customField" VARCHAR(255);

# 3. Verify
npm test

# 4. Commit & deploy
git add prisma/
git commit -m "feat: add customField to Booking"
```

### Create a new model

```bash
# 1. Edit schema
model BookingFeedback {
  id        Int     @id @default(autoincrement())
  bookingId Int
  booking   Booking @relation(fields: [bookingId], references: [id])
  rating    Int
  comment   String?
}

# 2. Create migration
npx prisma migrate dev --name add_booking_feedback

# Generated migration.sql:
# CREATE TABLE "BookingFeedback" (...)
# ALTER TABLE "BookingFeedback" ADD CONSTRAINT ... FOREIGN KEY ...

# 3. Test
npm test

# 4. Deploy
git add prisma/
git commit -m "feat: add BookingFeedback model"
```

### Add a unique constraint

```bash
# 1. Edit schema
model Customer {
  email String @unique
}

# 2. Create migration
npx prisma migrate dev --name add_unique_email

# Generated migration.sql:
# ALTER TABLE "Customer" ADD CONSTRAINT "Customer_email_key" UNIQUE ("email");

# Note: If duplicates exist, migration will fail!
# Solution: Clean up duplicates first:

npx prisma studio
# Manually delete duplicate emails
# Then run migration again
```

### Add an index

```bash
# 1. Edit schema
model Booking {
  @@index([technicianId])  // For faster queries
}

# 2. Create migration
npx prisma migrate dev --name add_booking_index

# Generated migration.sql:
# CREATE INDEX "Booking_technicianId_idx" ON "Booking"("technicianId");
```

### Rename a column (risky!)

**Option 1: Slow migration (safe)**
```bash
# 1. Add new column
model Booking {
  // Old field
  tech_id    Int?
  // New field
  technicianId Int?
}

# 2. Deploy code that writes to both
# 3. Migrate database
# 4. Migrate data from old → new
# 5. Deploy code that only reads new
# 6. Drop old column

# This ensures no data loss
```

**Option 2: Direct rename (fast, requires downtime)**
```bash
# 1. Edit schema
model Booking {
  technicianId Int  // Renamed from tech_id
}

# 2. Create migration
npx prisma migrate dev --name rename_tech_id

# Generated migration.sql:
# ALTER TABLE "Booking" RENAME COLUMN "tech_id" TO "technicianId";

# ⚠️  Database will be locked during migration
# ⚠️  App might have errors during migration
```

---

## Rollback Procedure

### Option 1: Reset Development Database

```bash
# Delete and recreate (loses all data!)
npx prisma migrate reset

# This will:
# 1. Drop database
# 2. Recreate from scratch
# 3. Apply all migrations
# 4. Run seed script
```

### Option 2: Resolve Migration (Production-Safe)

```bash
# Mark migration as rolled back (doesn't undo)
npx prisma migrate resolve --rolled-back XXX_migration_name

# This tells Prisma: "This migration failed, don't apply again"
# Must manually handle database changes!

# Steps:
# 1. Identify failed migration
npx prisma migrate status

# 2. Manually undo database changes (if needed)
# E.g., if DROP COLUMN failed, column still exists

# 3. Mark as resolved
npx prisma migrate resolve --rolled-back 20250207120000_add_feature

# 4. Create new migration to fix
npx prisma migrate dev --name fix_failed_migration

# 5. Deploy new fixed migration
```

### Option 3: Create Rollback Migration

```bash
# After bad migration is deployed:

# 1. Create rollback migration
npx prisma migrate dev --name rollback_bad_migration

# Edit migration file to undo changes:
# Instead of: ALTER TABLE ... ADD COLUMN
# Write:      ALTER TABLE ... DROP COLUMN

# 2. Test
npm test

# 3. Deploy
git add prisma/
git commit -m "chore: rollback bad migration"
git push

# 4. This creates a new migration that undoes the previous one
```

---

## Production Migration Strategy

### Before Production Deployment

```bash
# 1. Test migration in staging
# 2. Verify no data loss
# 3. Check performance impact
# 4. Get approval for production
```

### Zero-Downtime Deployment

```
1. Code deployment with backward compatibility
   - Accept both old & new column names
   - Read from whichever exists

2. Database migration
   - Add new column with default values
   - Copy data from old column
   - Verify data integrity

3. Code deployment
   - Only read new column
   - Old column no longer used

4. Cleanup migration (later)
   - Remove old column
   - No app changes needed
```

### Example: Adding Required Column

```
Scenario: Add "status" field to Booking (cannot be NULL)

❌ Wrong approach:
- Deploy migration: ALTER TABLE ADD COLUMN status VARCHAR(255) NOT NULL;
- ❌ Fails! Existing rows have no value for status

✅ Right approach:
1. Deploy migration: ALTER TABLE ADD COLUMN status VARCHAR(255) DEFAULT 'pending';
2. Deploy code that uses status field
3. Later migration: DROP DEFAULT, add NOT NULL constraint if needed

OR:

1. Deploy code that handles both with and without status
2. Deploy migration: ADD COLUMN status DEFAULT 'pending'
3. Run data migration to ensure all rows have status
4. Deploy code that requires status
```

---

## Database Validation

### Check Migration Status

```bash
npx prisma migrate status

# Output:
# 2 migrations found in prisma/migrations
#
# Following migrations have been applied to the database:
# migrations/
#   └─ 20250207100000_initial/
#   └─ 20250207110000_add_bookings/
#
# 1 migration pending:
# migrations/
#   └─ 20250207120000_add_feedback/
```

### Verify Schema

```bash
# Generate updated Prisma Client
npx prisma generate

# Check schema file
cat prisma/schema.prisma

# Introspect actual database schema
npx prisma db pull
```

### Test Migration Locally

```bash
# With SQLite (development)
npx prisma migrate dev --name test_feature

# With PostgreSQL (staging)
DATABASE_URL=postgresql://... npx prisma migrate deploy
```

---

## Monitoring Migrations

### In Staging

```bash
# Check logs
vercel logs sme-booking-app --env=staging

# Look for:
# ✅ "prisma migrate deployed successfully"
# ❌ "Migration failed: ..." (error)

# Verify data integrity
curl https://staging.booking.example.com/api/v1/bookings
```

### In Production

```bash
# Monitor during deployment
vercel logs sme-booking-app --env=production --follow

# Verify health after migration
curl https://booking.example.com/api/health

# Check for any errors in logs
# Especially around database operations
```

---

## Performance Considerations

### Large Table Migrations

For tables with millions of rows, migrations can lock the table and cause downtime.

**Solution: Batch migration**

```sql
-- Instead of:
-- ALTER TABLE "Booking" ADD COLUMN "status" VARCHAR(255) DEFAULT 'pending';
-- ❌ Locks entire table

-- Do:
-- Add column without default (fast)
ALTER TABLE "Booking" ADD COLUMN "status" VARCHAR(255);

-- Batch update in application code
for batch in chunks(all_bookings, size=1000) {
  UPDATE Booking SET status='pending' WHERE id IN batch;
}

-- Add NOT NULL constraint (fast, already has values)
ALTER TABLE "Booking" ALTER COLUMN "status" SET NOT NULL;
```

### Adding Indexes

For large tables, index creation can be slow:

```bash
# Use CONCURRENTLY to avoid locks (PostgreSQL)
CREATE INDEX CONCURRENTLY idx_booking_tech ON "Booking"("technicianId");
```

---

## Disaster Recovery

### If Migration Fails in Production

```bash
# 1. Check error
vercel logs sme-booking-app --env=production

# 2. Diagnose issue
npx prisma migrate status

# 3. Options:

# Option A: Resolve and fix
npx prisma migrate resolve --rolled-back XXX_name
npx prisma migrate dev --name fix_issue
git push

# Option B: Rollback deployment
# Vercel: Deploy > Select previous working > Promote

# Option C: Manual database fix
# 1. SSH to database
# 2. Run manual SQL to undo changes
# 3. Create new migration to fix
```

### Data Loss Prevention

```bash
# 1. Always backup before migration
# - Automated daily backups
# - Manual backup before major migrations

# 2. Test in staging first
# - Apply same migration to staging
# - Verify data integrity

# 3. Have rollback migration ready
# - Pre-write migration to undo changes
# - Test rollback in staging

# 4. Monitor after deployment
# - Watch error logs
# - Verify data counts
# - Run data validation queries
```

---

## Checklist

Before production migration:

- [ ] Migration tested in development
- [ ] Migration tested in staging
- [ ] No data loss in staging test
- [ ] Rollback procedure documented
- [ ] Team notified of migration
- [ ] Health checks configured
- [ ] Monitoring enabled
- [ ] Backup verified
- [ ] Zero-downtime strategy (if applicable)
- [ ] Post-migration verification planned

---

## Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Schema](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Database Constraints](https://www.prisma.io/docs/concepts/components/prisma-schema/features)
