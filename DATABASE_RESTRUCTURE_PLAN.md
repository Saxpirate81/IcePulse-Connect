# Database Restructure Plan for IcePulse Connect

## Current Situation

You're experiencing issues with the existing Supabase database structure from the original IcePulse app. The current structure may have:
- Complex relationships that don't match the new app's needs
- Legacy data that's causing conflicts
- Schema constraints that limit flexibility
- Data inconsistencies from migrations

## Recommendation: Fresh Start with Migration Path

### Phase 1: Create New Schema (Recommended)

**Create a new Supabase project or new schema within existing project:**

1. **New Supabase Project** (Recommended)
   - Create a completely fresh Supabase project
   - Build the schema from scratch based on this app's needs
   - No legacy constraints or data conflicts
   - Clean slate for development

2. **New Schema in Existing Project** (Alternative)
   - Create a new PostgreSQL schema (e.g., `icepulse_connect_v2`)
   - Keep old schema intact for reference
   - Can query across schemas if needed

### Phase 2: Design New Schema

Based on your app's current needs, here's a suggested structure:

#### Core Tables

```sql
-- Organizations (single organization per your requirement)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
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

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  player_id UUID REFERENCES persons(id),
  position TEXT,
  shift_start TEXT,
  shift_end TEXT,
  -- Common
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 3: Migration Strategy

**Option A: Manual Migration Script**
- Create SQL scripts to migrate specific data
- Run selectively based on what you need
- Full control over what gets migrated

**Option B: API-Based Migration**
- Build a migration API endpoint
- Query old database, transform data, insert into new
- Can run incrementally
- Can validate data before migration

**Option C: Hybrid Approach**
- Start fresh for new development
- Build migration tools for when you're ready
- Migrate data in phases (e.g., players first, then games, then events)

### Phase 4: Implementation Steps

1. **Create New Supabase Project**
   ```bash
   # Get new project URL and keys
   # Update .env.local with new credentials
   ```

2. **Run Schema Creation**
   - Execute the SQL schema above
   - Set up Row Level Security (RLS) policies
   - Create indexes for performance

3. **Update App Configuration**
   - Point app to new Supabase project
   - Test with fresh data
   - Verify all CRUD operations work

4. **Build Migration Tools** (Later)
   - Create migration scripts/API
   - Test on small dataset first
   - Migrate in phases

### Benefits of Fresh Start

✅ **No Legacy Constraints**: Clean schema designed for this app
✅ **Simpler Development**: No need to work around old structure
✅ **Better Performance**: Optimized indexes and relationships
✅ **Easier Testing**: Fresh data, no conflicts
✅ **Clear Migration Path**: Can migrate data when ready

### Migration Considerations

When you're ready to migrate old data:

1. **Data Mapping**: Map old fields to new structure
2. **Data Validation**: Clean and validate data before migration
3. **Incremental Migration**: Migrate in phases (organizations → seasons → teams → players → games)
4. **Testing**: Test migrated data thoroughly
5. **Rollback Plan**: Keep old database as backup

### Recommended Next Steps

1. **Create new Supabase project** (5 minutes)
2. **Run schema creation script** (10 minutes)
3. **Update .env.local** (2 minutes)
4. **Test app with fresh data** (verify everything works)
5. **Build migration tools later** (when ready to bring in old data)

### Questions to Consider

- Do you need to migrate all historical data immediately?
- Can you start fresh and migrate later?
- Are there specific data points from old system that are critical?
- Do you need to maintain referential integrity with old system?

## Recommendation

**Start fresh now, migrate later.** This will:
- Unblock development immediately
- Give you a clean, optimized structure
- Allow you to build migration tools when you have time
- Prevent ongoing conflicts and issues

Would you like me to:
1. Generate the complete SQL schema file?
2. Create migration scripts for specific data types?
3. Set up the new Supabase project structure?

