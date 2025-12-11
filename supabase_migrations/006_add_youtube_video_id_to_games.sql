-- Add youtube_video_id column to games table
-- This migration is for existing databases that were created before youtube_video_id was added
-- New databases should use 001_initial_schema.sql which includes this column
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS youtube_video_id TEXT;

