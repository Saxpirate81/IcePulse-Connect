-- Add status column to organizations table
-- Run this if you've already run 001_initial_schema.sql without the status column

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Update existing organizations to have 'active' status
UPDATE organizations
SET status = 'active'
WHERE status IS NULL;

