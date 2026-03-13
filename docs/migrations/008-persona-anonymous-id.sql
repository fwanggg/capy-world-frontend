-- Migration: Add anonymous_id to personas for privacy-compliant display.
-- Hash only at write (backfill + future inserts). Read path uses anonymous_id as-is.
--
-- Formula: anonymous_id = left(md5(reddit_username), 8)
-- Future inserts must set anonymous_id using the same formula.

-- Step 1: Add column (nullable for backfill)
ALTER TABLE personas ADD COLUMN IF NOT EXISTS anonymous_id TEXT;

-- Step 2: Backfill existing rows (hash only at write)
UPDATE personas
SET anonymous_id = left(md5(reddit_username), 8)
WHERE anonymous_id IS NULL AND reddit_username IS NOT NULL;

-- Fallback for rows with null reddit_username (edge case)
UPDATE personas
SET anonymous_id = 'p' || id
WHERE anonymous_id IS NULL;

-- Step 3: Set NOT NULL and add index
ALTER TABLE personas ALTER COLUMN anonymous_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_personas_anonymous_id ON personas(anonymous_id);
