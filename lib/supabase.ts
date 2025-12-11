/**
 * Supabase Client Setup
 * Based on ice-pulse-app backend structure
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration - will be loaded from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// For server-side operations, use service role key (never expose to client)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not configured. Some features may not work.')
}

// Client-side Supabase client (uses anon key)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

// Server-side Supabase client (uses service role key - only use in API routes)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Database table names (matching new schema)
export const TABLES = {
  ORGANIZATIONS: 'organizations',
  TEAMS: 'teams',
  SEASONS: 'seasons',
  GAMES: 'games',
  USERS: 'users',
  ROSTER_MEMBERSHIPS: 'roster_memberships',
  PERSONS: 'persons',
  USER_PLAYER_ASSOCIATIONS: 'user_player_associations',
  USER_TEAM_SEASON_ASSIGNMENTS: 'user_team_season_assignments',
  GAME_EVENTS: 'game_events',
} as const

