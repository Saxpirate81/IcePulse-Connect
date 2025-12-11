/**
 * Supabase Database Queries
 * CRUD operations for all entities
 */

import { supabase, TABLES } from '../supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// Helper to handle Supabase errors
const handleError = (error: any, operation: string) => {
  console.error(`Error ${operation}:`, error)
  throw new Error(error.message || `Failed to ${operation}`)
}

// ==================== ORGANIZATIONS ====================
export const getOrganizations = async () => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from(TABLES.ORGANIZATIONS)
    .select('*')
    .order('name', { ascending: true })
  
  if (error) handleError(error, 'fetching organizations')
  return data || []
}

export const getOrganization = async (id: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from(TABLES.ORGANIZATIONS)
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) handleError(error, 'fetching organization')
  return data
}

export const createOrganization = async (org: { 
  name: string
  status?: string 
}) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from(TABLES.ORGANIZATIONS)
    .insert([{ 
      name: org.name,
      status: org.status || 'active' 
    }])
    .select()
    .single()
  
  if (error) handleError(error, 'creating organization')
  return data
}

export const updateOrganization = async (id: string, org: { 
  name?: string
  status?: string 
}) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from(TABLES.ORGANIZATIONS)
    .update(org)
    .eq('id', id)
    .select()
    .single()
  
  if (error) handleError(error, 'updating organization')
  return data
}

export const deleteOrganization = async (id: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { error } = await supabase
    .from(TABLES.ORGANIZATIONS)
    .delete()
    .eq('id', id)
  
  if (error) handleError(error, 'deleting organization')
}

// ==================== TEAMS ====================
export const getTeams = async (organizationId?: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  let query = supabase
    .from(TABLES.TEAMS)
    .select('*')
    .order('name', { ascending: true })
  
  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }
  
  const { data, error } = await query
  
  if (error) handleError(error, 'fetching teams')
  return data || []
}

export const getTeam = async (id: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from(TABLES.TEAMS)
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) handleError(error, 'fetching team')
  return data
}

export const createTeam = async (team: { name: string; organization_id?: string; status?: string }) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from(TABLES.TEAMS)
    .insert([{ 
      name: team.name,
      organization_id: team.organization_id || null,
      status: team.status || 'active' 
    }])
    .select()
    .single()
  
  if (error) handleError(error, 'creating team')
  return data
}

export const updateTeam = async (id: string, team: { name?: string; organization_id?: string; status?: string }) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from(TABLES.TEAMS)
    .update(team)
    .eq('id', id)
    .select()
    .single()
  
  if (error) handleError(error, 'updating team')
  return data
}

export const archiveTeam = async (id: string) => {
  return updateTeam(id, { status: 'archived' })
}

export const deleteTeam = async (id: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { error } = await supabase
    .from(TABLES.TEAMS)
    .delete()
    .eq('id', id)
  
  if (error) handleError(error, 'deleting team')
}

// ==================== SEASONS ====================
export const getSeasons = async (organizationId?: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  let query = supabase
    .from(TABLES.SEASONS)
    .select('*')
    .order('start_date', { ascending: false }) // Most recent first
    .order('name', { ascending: false }) // Also order by name descending for consistency
  
  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }
  
  const { data, error } = await query
  
  if (error) handleError(error, 'fetching seasons')
  
  // Sort by name descending (newest years first) as fallback
  if (data && data.length > 0) {
    return data.sort((a: any, b: any) => {
      // Try to sort by name (e.g., "2025-2026" > "2024-2025")
      if (a.name && b.name) {
        return b.name.localeCompare(a.name)
      }
      // Fallback to start_date
      if (a.start_date && b.start_date) {
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      }
      return 0
    })
  }
  
  return data || []
}

export const getSeason = async (id: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from(TABLES.SEASONS)
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) handleError(error, 'fetching season')
  return data
}

export const createSeason = async (season: { name: string; start_date: string; end_date: string; organization_id?: string; status?: string }) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from(TABLES.SEASONS)
    .insert([{ ...season, status: season.status || 'active' }])
    .select()
    .single()
  
  if (error) handleError(error, 'creating season')
  return data
}

export const updateSeason = async (id: string, season: { name?: string; start_date?: string; end_date?: string; status?: string }) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from(TABLES.SEASONS)
    .update(season)
    .eq('id', id)
    .select()
    .single()
  
  if (error) handleError(error, 'updating season')
  return data
}

export const archiveSeason = async (id: string) => {
  return updateSeason(id, { status: 'archived' })
}

export const deleteSeason = async (id: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { error } = await supabase
    .from(TABLES.SEASONS)
    .delete()
    .eq('id', id)
  
  if (error) handleError(error, 'deleting season')
}

// ==================== GAMES ====================
export const getGames = async (teamId?: string, seasonId?: string, organizationId?: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  // If organizationId is provided, we need to filter by teams in that organization
  // First, get all team IDs for this organization
  let teamIds: string[] = []
  if (organizationId && !teamId) {
    const { data: orgTeams, error: teamsError } = await supabase
      .from(TABLES.TEAMS)
      .select('id')
      .eq('organization_id', organizationId)
    
    if (teamsError) {
      console.error('Error fetching teams for organization:', teamsError)
      throw teamsError
    } else if (orgTeams && orgTeams.length > 0) {
      teamIds = orgTeams.map((t: any) => t.id)
    } else {
      // No teams found for this organization, return empty array
      console.log(`No teams found for organization ${organizationId}`)
      return []
    }
  }
  
  let query = supabase
    .from(TABLES.GAMES)
    .select(`
      *,
      team:teams(*),
      season:seasons(*)
    `)
    .order('game_date', { ascending: false })
  
  // Apply filters
  if (teamId) {
    // If specific team is requested, use that
    query = query.eq('team_id', teamId)
  } else if (organizationId && teamIds.length > 0) {
    // Filter games by team IDs in the organization
    query = query.in('team_id', teamIds)
  }
  
  if (seasonId) {
    query = query.eq('season_id', seasonId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching games:', error)
    handleError(error, 'fetching games')
  }
  
  // Additional safety check: if organizationId was provided, verify all returned games belong to teams in that org
  if (organizationId && data && data.length > 0 && teamIds.length > 0) {
    const filtered = data.filter((g: any) => teamIds.includes(g.team_id))
    return filtered
  }
  
  return data || []
}

export const getGame = async (id: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from(TABLES.GAMES)
    .select(`
      *,
      team:teams(*),
      season:seasons(*)
    `)
    .eq('id', id)
    .single()
  
  if (error) handleError(error, 'fetching game')
  return data
}

export const createGame = async (game: {
  team_id: string
  season_id?: string
  opponent_name?: string
  game_date?: string
  start_time?: string
  location?: string
  youtube_video_id?: string
  status?: string
}) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const insertData: any = {
    team_id: game.team_id,
    opponent_name: game.opponent_name,
    game_date: game.game_date,
    start_time: game.start_time,
    location: game.location,
    status: game.status || 'scheduled'
  }
  
  if (game.season_id) {
    insertData.season_id = game.season_id
  }
  
  if (game.youtube_video_id) {
    insertData.youtube_video_id = game.youtube_video_id
  }
  
  const { data, error } = await supabase
    .from(TABLES.GAMES)
    .insert([insertData])
    .select()
    .single()
  
  if (error) handleError(error, 'creating game')
  return data
}

export const updateGame = async (id: string, game: {
  team_id?: string
  season_id?: string
  opponent_name?: string
  game_date?: string
  start_time?: string
  location?: string
  youtube_video_id?: string
  status?: string
}) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from(TABLES.GAMES)
    .update(game)
    .eq('id', id)
    .select()
    .single()
  
  if (error) handleError(error, 'updating game')
  return data
}

export const archiveGame = async (id: string) => {
  return updateGame(id, { status: 'archived' })
}

export const deleteGame = async (id: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { error } = await supabase
    .from(TABLES.GAMES)
    .delete()
    .eq('id', id)
  
  if (error) handleError(error, 'deleting game')
}

// ==================== USERS ====================
export const getUsers = async (organizationId?: string, teamId?: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  let query = supabase
    .from(TABLES.USERS)
    .select('*')
    .order('email', { ascending: true })
  
  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }
  
  // Note: teamId filtering removed - users don't have a direct team_id column
  // Team associations are handled through user_player_associations table
  
  const { data, error } = await query
  
  if (error) handleError(error, 'fetching users')
  return data || []
}

export const getUser = async (id: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) handleError(error, 'fetching user')
  return data
}

export const createUser = async (user: {
  email: string
  name?: string
  role: string
  password?: string
  organization_id?: string
  subscription_tier?: string
  status?: string
  auth_user_id?: string
}) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  // Convert role to lowercase to match database constraint
  // Also map 'Admin' to 'organizational'
  const roleMap: Record<string, string> = {
    'Admin': 'organizational',
    'Coach': 'coach',
    'Player': 'player',
    'Parent': 'parent'
  }
  const dbRole = roleMap[user.role] || user.role.toLowerCase()
  
  // Handle subscription_tier: must be 'free', 'basic', 'premium', or undefined (to use default)
  const validSubscriptionTiers = ['free', 'basic', 'premium']
  const subscriptionTier = user.subscription_tier && validSubscriptionTiers.includes(user.subscription_tier.toLowerCase())
    ? user.subscription_tier.toLowerCase()
    : undefined // Use database default ('free')
  
  // Remove team_id and username - they don't exist in the schema
  const { team_id, role, subscription_tier, ...userData } = user as any
  
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .insert([{ 
      ...userData, 
      role: dbRole,
      subscription_tier: subscriptionTier, // Only include if valid, otherwise undefined uses default
      status: user.status || 'active',
      name: user.name || user.email.split('@')[0] // Use email prefix as name if not provided
    }])
    .select()
    .single()
  
  if (error) handleError(error, 'creating user')
  return data
}

export const updateUser = async (id: string, user: {
  email?: string
  name?: string
  role?: string
  password?: string
  subscription_tier?: string
  status?: string
  auth_user_id?: string
}) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  // Convert role to lowercase to match database constraint
  // Also map 'Admin' to 'organizational'
  const roleMap: Record<string, string> = {
    'Admin': 'organizational',
    'Coach': 'coach',
    'Player': 'player',
    'Parent': 'parent'
  }
  const dbRole = user.role ? (roleMap[user.role] || user.role.toLowerCase()) : undefined
  
  // Handle subscription_tier: must be 'free', 'basic', 'premium', or undefined
  const validSubscriptionTiers = ['free', 'basic', 'premium']
  const subscriptionTier = user.subscription_tier && validSubscriptionTiers.includes(user.subscription_tier.toLowerCase())
    ? user.subscription_tier.toLowerCase()
    : undefined
  
  // Remove team_id and username - they don't exist in the schema
  const { team_id, username, role, subscription_tier, ...updateData } = user as any
  
  // Add role if it was provided
  if (dbRole) {
    updateData.role = dbRole
  }
  
  // Add subscription_tier if it was provided and valid
  if (subscriptionTier) {
    updateData.subscription_tier = subscriptionTier
  }
  
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) handleError(error, 'updating user')
  return data
}

export const archiveUser = async (id: string) => {
  return updateUser(id, { status: 'archived' })
}

export const deleteUser = async (id: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { error } = await supabase
    .from(TABLES.USERS)
    .delete()
    .eq('id', id)
  
  if (error) handleError(error, 'deleting user')
}

// ==================== PLAYERS/ROSTERS ====================
// Get all roster memberships (each represents a player on a specific team/season)
export const getPlayers = async (teamId?: string, seasonId?: string, organizationId?: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  let query = supabase
    .from(TABLES.ROSTER_MEMBERSHIPS)
    .select(`
      *,
      person:persons(*),
      team:teams(*),
      season:seasons(*)
    `)
  
  if (teamId) {
    query = query.eq('team_id', teamId)
  }
  
  if (seasonId) {
    query = query.eq('season_id', seasonId)
  }
  
  // If organizationId is provided, filter by teams in that organization
  if (organizationId && !teamId) {
    const { data: orgTeams } = await supabase
      .from(TABLES.TEAMS)
      .select('id')
      .eq('organization_id', organizationId)
    
    if (orgTeams && orgTeams.length > 0) {
      const teamIds = orgTeams.map((t: any) => t.id)
      query = query.in('team_id', teamIds)
    } else {
      return [] // No teams in organization
    }
  }
  
  const { data, error } = await query
  
  if (error) handleError(error, 'fetching players')
  
  // Transform the data to match expected format
  return (data || []).map((item: any) => ({
    id: item.person?.id || item.person_id,
    rosterId: item.id,
    name: item.person?.name || 'Unknown',
    jerseyNumber: item.jersey_number || '',
    teamId: item.team_id,
    seasonId: item.season_id,
    teamName: item.team?.name || 'Unknown Team',
    seasonName: item.season?.name || 'Unknown Season',
  }))
}

// Get all persons with their roster memberships grouped
export const getPersonsWithRosters = async (organizationId?: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  // First get all roster memberships
  let query = supabase
    .from(TABLES.ROSTER_MEMBERSHIPS)
    .select(`
      *,
      person:persons(*),
      team:teams(*),
      season:seasons(*)
    `)
  
  // If organizationId is provided, filter by teams in that organization
  if (organizationId) {
    const { data: orgTeams } = await supabase
      .from(TABLES.TEAMS)
      .select('id')
      .eq('organization_id', organizationId)
    
    if (orgTeams && orgTeams.length > 0) {
      const teamIds = orgTeams.map((t: any) => t.id)
      query = query.in('team_id', teamIds)
    } else {
      return [] // No teams in organization
    }
  }
  
  const { data, error } = await query
  
  if (error) handleError(error, 'fetching persons with rosters')
  
  // Group by person_id
  const personsMap = new Map<string, {
    id: string
    name: string
    dateOfBirth?: string
    height?: string
    weight?: string
    parentGuardianName?: string
    parentGuardianEmail?: string
    parentGuardianPhone?: string
    emergencyContactName?: string
    emergencyContactPhone?: string
    medicalConditions?: string
    allergies?: string
    notes?: string
    rosterMemberships: Array<{
      rosterId: string
      jerseyNumber: number | string
      teamId: string
      seasonId: string
      teamName: string
      seasonName: string
    }>
  }>()
  
  ;(data || []).forEach((item: any) => {
    const personId = item.person_id
    const person = item.person || {}
    
    if (!personsMap.has(personId)) {
      personsMap.set(personId, {
        id: personId,
        name: person.name || 'Unknown',
        dateOfBirth: person.date_of_birth || person.dateOfBirth,
        height: person.height,
        weight: person.weight,
        parentGuardianName: person.parent_guardian_name || person.parentGuardianName,
        parentGuardianEmail: person.parent_guardian_email || person.parentGuardianEmail,
        parentGuardianPhone: person.parent_guardian_phone || person.parentGuardianPhone,
        emergencyContactName: person.emergency_contact_name || person.emergencyContactName,
        emergencyContactPhone: person.emergency_contact_phone || person.emergencyContactPhone,
        medicalConditions: person.medical_conditions || person.medicalConditions,
        allergies: person.allergies,
        notes: person.notes,
        rosterMemberships: []
      })
    }
    
    const personData = personsMap.get(personId)!
    personData.rosterMemberships.push({
      rosterId: item.id,
      jerseyNumber: item.jersey_number || '',
      teamId: item.team_id,
      seasonId: item.season_id,
      teamName: item.team?.name || 'Unknown Team',
      seasonName: item.season?.name || 'Unknown Season',
    })
  })
  
  return Array.from(personsMap.values())
}

export const getPlayer = async (id: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from(TABLES.ROSTER_MEMBERSHIPS)
    .select(`
      *,
      person:persons(*),
      team:teams(*),
      season:seasons(*)
    `)
    .eq('id', id)
    .single()
  
  if (error) handleError(error, 'fetching player')
  
  return {
    id: data.person?.id || data.person_id,
    rosterId: data.id,
    name: data.person?.name || 'Unknown',
    jerseyNumber: data.jersey_number || '',
    teamId: data.team_id,
    seasonId: data.season_id,
    teamName: data.team?.name || 'Unknown Team',
    seasonName: data.season?.name || 'Unknown Season',
  }
}

export const createPlayer = async (player: {
  name: string
  jersey_number: number | string
  team_id: string
  season_id: string
  dateOfBirth?: string
  height?: string
  weight?: string
  parentGuardianName?: string
  parentGuardianEmail?: string
  parentGuardianPhone?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  medicalConditions?: string
  allergies?: string
  notes?: string
}) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  // First, create or get the person
  let personId: string
  
  // Check if person with this name already exists
  const { data: existingPerson } = await supabase
    .from(TABLES.PERSONS)
    .select('id')
    .eq('name', player.name)
    .single()
  
  const personData: any = {
    name: player.name,
  }
  
  // Add optional person fields
  if (player.dateOfBirth) personData.date_of_birth = player.dateOfBirth
  if (player.height) personData.height = player.height
  if (player.weight) personData.weight = player.weight
  if (player.parentGuardianName) personData.parent_guardian_name = player.parentGuardianName
  if (player.parentGuardianEmail) personData.parent_guardian_email = player.parentGuardianEmail
  if (player.parentGuardianPhone) personData.parent_guardian_phone = player.parentGuardianPhone
  if (player.emergencyContactName) personData.emergency_contact_name = player.emergencyContactName
  if (player.emergencyContactPhone) personData.emergency_contact_phone = player.emergencyContactPhone
  if (player.medicalConditions) personData.medical_conditions = player.medicalConditions
  if (player.allergies) personData.allergies = player.allergies
  if (player.notes) personData.notes = player.notes
  
  if (existingPerson) {
    personId = existingPerson.id
    // Update existing person with new data
    const { error: updateError } = await supabase
      .from(TABLES.PERSONS)
      .update(personData)
      .eq('id', personId)
    
    if (updateError) handleError(updateError, 'updating person')
  } else {
    // Create new person
    const { data: newPerson, error: personError } = await supabase
      .from(TABLES.PERSONS)
      .insert([personData])
      .select()
      .single()
    
    if (personError) handleError(personError, 'creating person')
    personId = newPerson.id
  }
  
  // Create roster membership
  const rosterData: any = {
    person_id: personId,
    team_id: player.team_id,
    season_id: player.season_id,
    jersey_number: player.jersey_number
  }
  
  
  const { data, error } = await supabase
    .from(TABLES.ROSTER_MEMBERSHIPS)
    .insert([rosterData])
    .select(`
      *,
      person:persons(*),
      team:teams(*),
      season:seasons(*)
    `)
    .single()
  
  if (error) handleError(error, 'creating player')
  
  return {
    id: data.person?.id || data.person_id,
    rosterId: data.id,
    name: data.person?.name || 'Unknown',
    jerseyNumber: data.jersey_number || '',
    position: data.position,
    teamId: data.team_id,
    seasonId: data.season_id,
    teamName: data.team?.name || 'Unknown Team',
    seasonName: data.season?.name || 'Unknown Season',
  }
}

export const updatePlayer = async (id: string, player: {
  name?: string
  jersey_number?: number | string
  position?: string
  team_id?: string
  season_id?: string
  dateOfBirth?: string
  height?: string
  weight?: string
  parentGuardianName?: string
  parentGuardianEmail?: string
  parentGuardianPhone?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  medicalConditions?: string
  allergies?: string
  notes?: string
}) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  // Get existing roster membership
  const { data: existing } = await supabase
    .from(TABLES.ROSTER_MEMBERSHIPS)
    .select('person_id')
    .eq('id', id)
    .single()
  
  if (!existing) throw new Error('Player not found')
  
  // Update person data if provided
  const personUpdateData: any = {}
  if (player.name) personUpdateData.name = player.name
  if (player.dateOfBirth !== undefined) personUpdateData.date_of_birth = player.dateOfBirth || null
  if (player.height !== undefined) personUpdateData.height = player.height || null
  if (player.weight !== undefined) personUpdateData.weight = player.weight || null
  if (player.parentGuardianName !== undefined) personUpdateData.parent_guardian_name = player.parentGuardianName || null
  if (player.parentGuardianEmail !== undefined) personUpdateData.parent_guardian_email = player.parentGuardianEmail || null
  if (player.parentGuardianPhone !== undefined) personUpdateData.parent_guardian_phone = player.parentGuardianPhone || null
  if (player.emergencyContactName !== undefined) personUpdateData.emergency_contact_name = player.emergencyContactName || null
  if (player.emergencyContactPhone !== undefined) personUpdateData.emergency_contact_phone = player.emergencyContactPhone || null
  if (player.medicalConditions !== undefined) personUpdateData.medical_conditions = player.medicalConditions || null
  if (player.allergies !== undefined) personUpdateData.allergies = player.allergies || null
  if (player.notes !== undefined) personUpdateData.notes = player.notes || null
  
  if (Object.keys(personUpdateData).length > 0) {
    const { error: personError } = await supabase
      .from(TABLES.PERSONS)
      .update(personUpdateData)
      .eq('id', existing.person_id)
    
    if (personError) handleError(personError, 'updating person')
  }
  
  // Update roster membership
  const updateData: any = {}
  if (player.jersey_number !== undefined) updateData.jersey_number = player.jersey_number
  if (player.team_id) updateData.team_id = player.team_id
  if (player.season_id) updateData.season_id = player.season_id
  
  const { data, error } = await supabase
    .from(TABLES.ROSTER_MEMBERSHIPS)
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      person:persons(*),
      team:teams(*),
      season:seasons(*)
    `)
    .single()
  
  if (error) handleError(error, 'updating player')
  
  return {
    id: data.person?.id || data.person_id,
    rosterId: data.id,
    name: data.person?.name || 'Unknown',
    jerseyNumber: data.jersey_number || '',
    position: data.position,
    teamId: data.team_id,
    seasonId: data.season_id,
    teamName: data.team?.name || 'Unknown Team',
    seasonName: data.season?.name || 'Unknown Season',
  }
}

export const deletePlayer = async (id: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  // Delete roster membership (person record remains for historical data)
  const { error } = await supabase
    .from(TABLES.ROSTER_MEMBERSHIPS)
    .delete()
    .eq('id', id)
  
  if (error) handleError(error, 'deleting player')
}

// ==================== COUNT FUNCTIONS ====================
export const getTeamCount = async (organizationId?: string): Promise<number> => {
  if (!supabase) throw new Error('Supabase not configured')
  
  let query = supabase
    .from(TABLES.TEAMS)
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
  
  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }
  
  const { count, error } = await query
  
  if (error) handleError(error, 'counting teams')
  return count || 0
}

export const getPlayerCount = async (organizationId?: string): Promise<number> => {
  if (!supabase) throw new Error('Supabase not configured')
  
  if (organizationId) {
    // Count unique persons who have roster memberships in teams belonging to this organization
    const { data: teams, error: teamsError } = await supabase
      .from(TABLES.TEAMS)
      .select('id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
    
    if (teamsError) handleError(teamsError, 'fetching teams for player count')
    
    if (!teams || teams.length === 0) return 0
    
    const teamIds = teams.map((t: any) => t.id)
    
    // Get unique person_ids
    const { data, error } = await supabase
      .from(TABLES.ROSTER_MEMBERSHIPS)
      .select('person_id')
      .in('team_id', teamIds)
    
    if (error) handleError(error, 'counting players')
    
    // Count unique person_ids
    const uniquePersonIds = new Set(data?.map((r: any) => r.person_id) || [])
    return uniquePersonIds.size
  } else {
    // Get unique person_ids across all roster memberships
    const { data, error } = await supabase
      .from(TABLES.ROSTER_MEMBERSHIPS)
      .select('person_id')
    
    if (error) handleError(error, 'counting players')
    
    // Count unique person_ids
    const uniquePersonIds = new Set(data?.map((r: any) => r.person_id) || [])
    return uniquePersonIds.size
  }
}

export const getCoachCount = async (organizationId?: string): Promise<number> => {
  if (!supabase) throw new Error('Supabase not configured')
  
  let query = supabase
    .from(TABLES.USERS)
    .select('id', { count: 'exact', head: true })
    .eq('role', 'coach')
    .eq('status', 'active')
  
  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }
  
  const { count, error } = await query
  
  if (error) handleError(error, 'counting coaches')
  return count || 0
}

export const getParentCount = async (organizationId?: string): Promise<number> => {
  if (!supabase) throw new Error('Supabase not configured')
  
  let query = supabase
    .from(TABLES.USERS)
    .select('id', { count: 'exact', head: true })
    .eq('role', 'parent')
    .eq('status', 'active')
  
  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }
  
  const { count, error } = await query
  
  if (error) handleError(error, 'counting parents')
  return count || 0
}

export const getGameCount = async (organizationId?: string): Promise<number> => {
  if (!supabase) throw new Error('Supabase not configured')
  
  if (organizationId) {
    // Get all team IDs for this organization
    const { data: teams, error: teamsError } = await supabase
      .from(TABLES.TEAMS)
      .select('id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
    
    if (teamsError) handleError(teamsError, 'fetching teams for game count')
    
    if (!teams || teams.length === 0) return 0
    
    const teamIds = teams.map((t: any) => t.id)
    
    const { count, error } = await supabase
      .from(TABLES.GAMES)
      .select('id', { count: 'exact', head: true })
      .in('team_id', teamIds)
    
    if (error) handleError(error, 'counting games')
    return count || 0
  } else {
    const { count, error } = await supabase
      .from(TABLES.GAMES)
      .select('id', { count: 'exact', head: true })
    
    if (error) handleError(error, 'counting games')
    return count || 0
  }
}

// Helper function to count players for a specific team
export const getPlayerCountForTeam = async (teamId: string): Promise<number> => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from(TABLES.ROSTER_MEMBERSHIPS)
    .select('person_id')
    .eq('team_id', teamId)
  
  if (error) handleError(error, 'counting players for team')
  
  // Count unique person_ids
  const uniquePersonIds = new Set(data?.map((r: any) => r.person_id) || [])
  return uniquePersonIds.size
}

// Helper function to count games for a specific team
export const getGameCountForTeam = async (teamId: string): Promise<number> => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { count, error } = await supabase
    .from(TABLES.GAMES)
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId)
  
  if (error) handleError(error, 'counting games for team')
  return count || 0
}

// Helper function to count teams for a specific season
export const getTeamCountForSeason = async (seasonId: string): Promise<number> => {
  if (!supabase) throw new Error('Supabase not configured')
  
  // Count teams that have games in this season
  const { data, error } = await supabase
    .from(TABLES.GAMES)
    .select('team_id')
    .eq('season_id', seasonId)
  
  if (error) handleError(error, 'counting teams for season')
  
  // Count unique team_ids
  const uniqueTeamIds = new Set(data?.map((g: any) => g.team_id) || [])
  return uniqueTeamIds.size
}

// Helper function to get team and player counts for an organization
export const getOrganizationCounts = async (organizationId: string): Promise<{ teams: number; players: number }> => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const [teamsCount, playersCount] = await Promise.all([
    getTeamCount(organizationId),
    getPlayerCount(organizationId)
  ])
  
  return { teams: teamsCount, players: playersCount }
}

