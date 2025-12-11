-- Add youtube_video_id column to games table
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS youtube_video_id TEXT;

