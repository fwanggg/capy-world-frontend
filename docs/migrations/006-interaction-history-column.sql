-- Migration: Extract interaction_history from prompt column into its own jsonb column.
-- The prompt contains a JSON blob between two markers:
--   START: 'USER INTERACTION HISTORY:\n'
--   END:   '\nYOUR TASK: Generate ONE Natural Response'
-- This migration extracts that JSON into a dedicated column so prompts
-- can be constructed dynamically in application code.

-- Step 1: Add the new column
ALTER TABLE personas ADD COLUMN IF NOT EXISTS interaction_history jsonb;

-- Step 2: Populate from existing prompt
UPDATE personas
SET interaction_history = trim(
  substring(
    prompt,
    position('USER INTERACTION HISTORY:' IN prompt) + length('USER INTERACTION HISTORY:'),
    position('YOUR TASK: Generate ONE Natural Response' IN prompt)
      - (position('USER INTERACTION HISTORY:' IN prompt) + length('USER INTERACTION HISTORY:'))
  )
)::jsonb
WHERE prompt LIKE '%USER INTERACTION HISTORY:%'
  AND prompt LIKE '%YOUR TASK: Generate ONE Natural Response%'
  AND interaction_history IS NULL;
