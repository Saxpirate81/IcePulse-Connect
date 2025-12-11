-- User Team Season Assignments
-- Unified table for assigning users (coaches, parents, players) to teams and seasons
-- For players, this complements user_player_associations (which links to roster_memberships)
-- For coaches and parents, this is the primary way to assign them to teams/seasons

CREATE TABLE IF NOT EXISTS user_team_season_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, team_id, season_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_assignments_user ON user_team_season_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_team ON user_team_season_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_season ON user_team_season_assignments(season_id);

-- Enable RLS
ALTER TABLE user_team_season_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Allow all for authenticated users" ON user_team_season_assignments FOR ALL USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_user_assignments_updated_at 
  BEFORE UPDATE ON user_team_season_assignments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

