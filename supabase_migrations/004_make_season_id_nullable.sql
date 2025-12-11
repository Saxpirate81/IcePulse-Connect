-- Make season_id nullable in games table
ALTER TABLE games ALTER COLUMN season_id DROP NOT NULL;

