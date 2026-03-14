-- Migration: Add display_name to studyrooms for user-editable room names.
-- When set, display_name overrides the auto-generated name for display.
-- Existing rows keep name as fallback; display_name is nullable.

ALTER TABLE studyrooms ADD COLUMN IF NOT EXISTS display_name TEXT;
