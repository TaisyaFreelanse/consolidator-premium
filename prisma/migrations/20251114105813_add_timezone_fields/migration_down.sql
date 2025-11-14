-- Rollback: Drop timezone-related columns from events table
-- Note: If indexes on publishedAt and timezone exist, they should be dropped first
-- (Indexes are created in migration 20251114111353_add_published_at_timezone_indexes)

-- Drop indexes first (if they exist from later migration)
DROP INDEX IF EXISTS "events_publishedAt_idx";
DROP INDEX IF EXISTS "events_timezone_idx";

-- AlterTable: Drop columns
ALTER TABLE "events" DROP COLUMN IF EXISTS "createdAtClient";
ALTER TABLE "events" DROP COLUMN IF EXISTS "publishedAt";
ALTER TABLE "events" DROP COLUMN IF EXISTS "timezone";

