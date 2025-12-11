-- Add start_date and end_date columns to seasons table
-- Run this in Supabase SQL Editor

ALTER TABLE seasons
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Add comments to document the columns
COMMENT ON COLUMN seasons.start_date IS 'Start date of the season (e.g., 2025-09-01)';
COMMENT ON COLUMN seasons.end_date IS 'End date of the season (e.g., 2026-05-31)';

-- Optional: Update existing seasons with default dates based on their name
-- This assumes season names are in format "YYYY-YYYY" (e.g., "2025-2026")
UPDATE seasons
SET 
  start_date = CASE 
    WHEN name ~ '^\d{4}-\d{4}$' THEN 
      TO_DATE(SPLIT_PART(name, '-', 1) || '-09-01', 'YYYY-MM-DD')
    ELSE NULL
  END,
  end_date = CASE 
    WHEN name ~ '^\d{4}-\d{4}$' THEN 
      TO_DATE(SPLIT_PART(name, '-', 2) || '-05-31', 'YYYY-MM-DD')
    ELSE NULL
  END
WHERE start_date IS NULL OR end_date IS NULL;

