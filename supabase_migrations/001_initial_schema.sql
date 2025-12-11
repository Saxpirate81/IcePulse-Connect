-- IcePulse Connect - Initial Database Schema
-- Run this in your new Supabase project SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (single organization per requirement)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'USA',
  phone TEXT,
  email TEXT,
  website TEXT,
  contact_name TEXT,
  contact_title TEXT,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seasons
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Games
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  opponent_name TEXT,
  game_date DATE,
  start_time TIME,
  location TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Persons (Players)
CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE,
  height TEXT,
  weight TEXT,
  position TEXT,
  parent_guardian_name TEXT,
  parent_guardian_email TEXT,
  parent_guardian_phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_conditions TEXT,
  allergies TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roster Memberships (Player-Team-Season assignments)
CREATE TABLE roster_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  jersey_number TEXT NOT NULL,
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, team_id, season_id)
);

-- Users (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE, -- Links to Supabase Auth users.id
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('organizational', 'coach', 'player', 'parent')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Player Associations (for player/parent roles)
CREATE TABLE user_player_associations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  roster_membership_id UUID REFERENCES roster_memberships(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, roster_membership_id)
);

-- Game Events (Goals, Penalties, Shifts)
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('goal', 'penalty', 'shift')),
  game_clock_time TEXT, -- MM:SS format
  team_type TEXT CHECK (team_type IN ('my_team', 'opponent')),
  -- Goal specific
  scorer_id UUID REFERENCES persons(id),
  first_assist_id UUID REFERENCES persons(id),
  second_assist_id UUID REFERENCES persons(id),
  opponent_jersey_number TEXT,
  -- Penalty specific
  player_id UUID REFERENCES persons(id),
  penalty_type TEXT,
  penalty_minutes TEXT, -- M:SS format
  is_offsetting BOOLEAN DEFAULT false,
  -- Shift specific
  position TEXT,
  shift_start TEXT,
  shift_end TEXT,
  -- Common
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_seasons_organization ON seasons(organization_id);
CREATE INDEX idx_teams_organization ON teams(organization_id);
CREATE INDEX idx_games_team ON games(team_id);
CREATE INDEX idx_games_season ON games(season_id);
CREATE INDEX idx_persons_organization ON persons(organization_id);
CREATE INDEX idx_roster_memberships_person ON roster_memberships(person_id);
CREATE INDEX idx_roster_memberships_team ON roster_memberships(team_id);
CREATE INDEX idx_roster_memberships_season ON roster_memberships(season_id);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_auth_user ON users(auth_user_id);
CREATE INDEX idx_user_player_associations_user ON user_player_associations(user_id);
CREATE INDEX idx_game_events_game ON game_events(game_id);

-- Row Level Security (RLS) Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_player_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow all operations for authenticated users (we'll refine this later)
-- For now, we'll use service role key for admin operations
CREATE POLICY "Allow all for authenticated users" ON organizations FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON seasons FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON teams FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON games FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON persons FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON roster_memberships FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON user_player_associations FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON game_events FOR ALL USING (true);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roster_memberships_updated_at BEFORE UPDATE ON roster_memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_game_events_updated_at BEFORE UPDATE ON game_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default organization
INSERT INTO organizations (name) VALUES ('IcePulse Organization') RETURNING id;

