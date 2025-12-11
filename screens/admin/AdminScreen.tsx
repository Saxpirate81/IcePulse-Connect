'use client'

import React, { useState, useEffect } from 'react'
import { Settings, Shield, Edit2, LogOut } from 'lucide-react'
import TeamManagement from '@/components/admin/TeamManagement'
import GameManagement from '@/components/admin/GameManagement'
import UserManagement from '@/components/admin/UserManagement'
import SeasonManagement from '@/components/admin/SeasonManagement'
import OrganizationManagement from '@/components/admin/OrganizationManagement'
import PlayerManagement from '@/components/admin/PlayerManagement'
import { getOrganizations, getTeams, getSeasons, getTeamCount, getPlayerCount, getGameCount, getOrganizationCounts } from '@/lib/supabase/queries'
import { useAdminSettings } from '@/contexts/AdminSettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

type PrivilegeLevel = 'organizational' | 'coach' | 'player' | 'parent'

interface AdminScreenProps {
  privilegeLevel?: PrivilegeLevel
}

export default function AdminScreen({ privilegeLevel: initialPrivilegeLevel = 'organizational' }: AdminScreenProps) {
  const router = useRouter()
  const { logout, user } = useAuth()
  const { 
    useSupabase, 
    setUseSupabase, 
    selectedOrganizationId, 
    setSelectedOrganizationId,
    privilegeLevel,
    setPrivilegeLevel
  } = useAdminSettings()
  
  const [activeSection, setActiveSection] = useState<'profile' | 'setup'>('profile')
  const [activeSetupTab, setActiveSetupTab] = useState<'teams' | 'games' | 'users' | 'seasons' | 'organizations' | 'players'>('teams')
  const [showPrivilegeToggle, setShowPrivilegeToggle] = useState(true) // Admin-only toggle for testing
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; teams: number; players: number; status: 'active' | 'inactive' }>>([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)
  const [availableTeams, setAvailableTeams] = useState<Array<{ id: string; name: string }>>([])
  const [availableSeasons, setAvailableSeasons] = useState<Array<{ id: string; name: string }>>([])
  const [stats, setStats] = useState({
    teams: 0,
    players: 0,
    games: 0
  })
  
  // Mock user data - will be replaced with real data
  const currentUser = {
    name: 'Admin User',
    email: 'admin@icepulse.com',
    role: 'Admin',
    privilegeLevel: privilegeLevel,
    initials: 'AU'
  }

  // Start with empty arrays - data will be loaded from Supabase or remain empty
  const [teams, setTeams] = useState<Array<{ id: string; name: string; players: number; games: number; season?: string; status?: 'active' | 'archived' }>>([])
  
  const [games, setGames] = useState<Array<{ id: string; team: string; opponent: string; date: string; startTime?: string; season: string; periodLength?: number; youtubeVideoId?: string; status?: 'active' | 'archived' }>>([])
  
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; role: 'Admin' | 'Coach' | 'Player' | 'Parent'; team?: string; status: 'active' | 'inactive' | 'archived'; subscriptionTier?: string; selectedRosterIds?: string[] }>>([])
  
  const [seasons, setSeasons] = useState<Array<{ id: string; name: string; startDate: string; endDate: string; teams: number; status?: 'active' | 'archived' }>>([])

  // Load organizations from Supabase
  useEffect(() => {
    if (useSupabase) {
      loadOrganizations()
    }
  }, [useSupabase])

  // Load stats
  const loadStats = async () => {
    if (useSupabase && selectedOrganizationId) {
      try {
        const [teamsCount, playersCount, gamesCount] = await Promise.all([
          getTeamCount(selectedOrganizationId),
          getPlayerCount(selectedOrganizationId),
          getGameCount(selectedOrganizationId)
        ])
        setStats({
          teams: teamsCount,
          players: playersCount,
          games: gamesCount
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    } else {
      setStats({ teams: 0, players: 0, games: 0 })
    }
  }

  // Reload data when organization changes (if using Supabase)
  useEffect(() => {
    if (useSupabase && selectedOrganizationId) {
      // Data will reload automatically when components detect organizationId change
      // This is handled by each component's useEffect
      loadTeamsAndSeasons()
      loadStats()
    }
  }, [selectedOrganizationId, useSupabase])

  const loadTeamsAndSeasons = async () => {
    if (!useSupabase || !selectedOrganizationId) return
    
    try {
      const [teamsData, seasonsData] = await Promise.all([
        getTeams(selectedOrganizationId),
        getSeasons(selectedOrganizationId)
      ])
      
      setAvailableTeams(teamsData.map((t: any) => ({ id: t.id, name: t.name })))
      setAvailableSeasons(seasonsData.map((s: any) => ({ id: s.id, name: s.name })))
    } catch (error) {
      console.error('Error loading teams and seasons:', error)
    }
  }

  const loadOrganizations = async () => {
    try {
      setLoadingOrgs(true)
      const orgs = await getOrganizations()
      
      // Calculate counts for each organization
      const orgsWithCounts = await Promise.all(
        orgs.map(async (o: any) => {
          const counts = await getOrganizationCounts(o.id)
          return {
            id: o.id,
            name: o.name,
            teams: counts.teams,
            players: counts.players,
            status: o.status || 'active'
          }
        })
      )
      
      setOrganizations(orgsWithCounts)
      // Auto-select first organization if none selected
      if (orgs.length > 0 && !selectedOrganizationId) {
        setSelectedOrganizationId(orgs[0].id)
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
      // Don't set fallback data - let it remain empty
      setOrganizations([])
    } finally {
      setLoadingOrgs(false)
    }
  }

  const profileMenuItems = [
    { icon: Edit2, label: 'Edit Profile', action: () => {}, isDestructive: false },
    { icon: Settings, label: 'Settings', action: () => {}, isDestructive: false },
    { icon: Shield, label: 'Privacy', action: () => {}, isDestructive: false },
  ]

  // Determine what's visible based on privilege level
  const canViewOrganizations = privilegeLevel === 'organizational'
  const canViewAllTeams = privilegeLevel === 'organizational' || privilegeLevel === 'coach'
  const canViewAllGames = privilegeLevel === 'organizational' || privilegeLevel === 'coach'
  const canViewAllUsers = privilegeLevel === 'organizational' || privilegeLevel === 'coach'

  return (
    <div className="h-full bg-gradient-to-b from-background to-surface flex flex-col overflow-hidden w-full">
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="px-4 md:px-6 py-4 md:py-6 w-full">
          <div className="w-full max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-text mb-2">Admin</h1>
                  <div className="flex items-center gap-2">
                    <p className="text-textSecondary">Manage your profile and organization</p>
                    {user && (
                      <>
                        <span className="text-textSecondary">•</span>
                        <p className="text-xs text-textSecondary">
                          Welcome, <span className="text-text font-medium">{user.name}</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Clear all localStorage data
                    localStorage.removeItem('currentUser')
                    localStorage.removeItem('useSupabase')
                    localStorage.removeItem('selectedOrganizationId')
                    localStorage.removeItem('privilegeLevel')
                    localStorage.removeItem('gameState')
                    
                    // Call logout from auth context
                    logout()
                    
                    // Redirect to login page
                    router.push('/')
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-error/10 hover:bg-error/20 text-error border border-error/30 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap"
                  title="Logout"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-2 mb-6 border-b border-border">
              <button
                onClick={() => setActiveSection('profile')}
                className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                  activeSection === 'profile'
                    ? 'text-primary border-primary'
                    : 'text-textSecondary border-transparent hover:text-text'
                }`}
              >
                User Profile
              </button>
              <button
                onClick={() => setActiveSection('setup')}
                className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                  activeSection === 'setup'
                    ? 'text-primary border-primary'
                    : 'text-textSecondary border-transparent hover:text-text'
                }`}
              >
                Organizational Setup
              </button>
            </div>

            {/* User Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                {/* User Info Card */}
                <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                      <span className="text-3xl font-bold text-text">{currentUser.initials}</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-text mb-1">{currentUser.name}</h2>
                      <p className="text-textSecondary mb-2">{currentUser.email}</p>
                      <div className="flex gap-2">
                        <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                          {currentUser.role}
                        </span>
                        <span className="bg-surface border border-border text-textSecondary px-3 py-1 rounded-full text-sm font-semibold capitalize">
                          {currentUser.privilegeLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary mb-1">{stats.teams}</p>
                      <p className="text-xs text-textSecondary">Teams</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary mb-1">{stats.players}</p>
                      <p className="text-xs text-textSecondary">Players</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary mb-1">{stats.games}</p>
                      <p className="text-xs text-textSecondary">Games</p>
                    </div>
                  </div>
                </div>

                {/* Profile Menu Items - Scrollable */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {profileMenuItems.map((item, index) => {
                    const IconComponent = item.icon
                    return (
                      <button
                        key={index}
                        onClick={item.action}
                        className={`w-full flex items-center space-x-4 bg-surface border rounded-xl p-4 hover:border-primary/50 transition-colors ${
                          item.isDestructive ? 'border-error' : 'border-border'
                        }`}
                      >
                        <IconComponent size={20} className={item.isDestructive ? 'text-error' : 'text-textSecondary'} />
                        <span className={`flex-1 text-left font-medium ${
                          item.isDestructive ? 'text-error' : 'text-text'
                        }`}>
                          {item.label}
                        </span>
                        <span className="text-textSecondary text-xl">›</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Organizational Setup Section */}
            {activeSection === 'setup' && (
              <div className="space-y-6">
                            {/* Setup Tabs */}
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                              {canViewOrganizations && (
                                <button
                                  onClick={() => setActiveSetupTab('organizations')}
                                  className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                                    activeSetupTab === 'organizations'
                                      ? 'bg-primary text-text'
                                      : 'bg-surface border border-border text-textSecondary hover:bg-surfaceLight'
                                  }`}
                                >
                                  Organization
                                </button>
                              )}
                              {canViewAllTeams && (
                                <button
                                  onClick={() => setActiveSetupTab('teams')}
                                  className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                                    activeSetupTab === 'teams'
                                      ? 'bg-primary text-text'
                                      : 'bg-surface border border-border text-textSecondary hover:bg-surfaceLight'
                                  }`}
                                >
                                  Teams
                                </button>
                              )}
                              {canViewAllGames && (
                                <button
                                  onClick={() => setActiveSetupTab('games')}
                                  className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                                    activeSetupTab === 'games'
                                      ? 'bg-primary text-text'
                                      : 'bg-surface border border-border text-textSecondary hover:bg-surfaceLight'
                                  }`}
                                >
                                  Games
                                </button>
                              )}
                              <button
                                onClick={() => setActiveSetupTab('seasons')}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                                  activeSetupTab === 'seasons'
                                    ? 'bg-primary text-text'
                                    : 'bg-surface border border-border text-textSecondary hover:bg-surfaceLight'
                                }`}
                              >
                                Seasons
                              </button>
                              {canViewAllTeams && (
                                <button
                                  onClick={() => setActiveSetupTab('players')}
                                  className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                                    activeSetupTab === 'players'
                                      ? 'bg-primary text-text'
                                      : 'bg-surface border border-border text-textSecondary hover:bg-surfaceLight'
                                  }`}
                                >
                                  Players
                                </button>
                              )}
                              {canViewAllUsers && (
                                <button
                                  onClick={() => setActiveSetupTab('users')}
                                  className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                                    activeSetupTab === 'users'
                                      ? 'bg-primary text-text'
                                      : 'bg-surface border border-border text-textSecondary hover:bg-surfaceLight'
                                  }`}
                                >
                                  Users
                                </button>
                              )}
                            </div>

                {/* Teams Tab */}
                {activeSetupTab === 'teams' && canViewAllTeams && (
                  <TeamManagement
                    teams={teams}
                    onAdd={(team) => {
                      if (!useSupabase) {
                        setTeams([...teams, { ...team, id: String(Date.now()) }])
                      }
                    }}
                    onEdit={(id, team) => {
                      if (!useSupabase) {
                        setTeams(teams.map(t => t.id === id ? { ...team, id } : t))
                      }
                    }}
                    onDelete={(id) => {
                      if (!useSupabase) {
                        setTeams(teams.filter(t => t.id !== id))
                      }
                    }}
                    onArchive={(id) => {
                      if (!useSupabase) {
                        setTeams(teams.map(t => t.id === id ? { ...t, status: 'archived' as const } : t))
                      }
                    }}
                    seasons={seasons.map(s => s.name)}
                    useSupabase={useSupabase}
                    organizationId={selectedOrganizationId || undefined}
                  />
                )}

                {/* Games Tab */}
                {activeSetupTab === 'games' && canViewAllGames && (
                  <GameManagement
                    games={games}
                    onAdd={(game) => {
                      if (!useSupabase) {
                        setGames([...games, { ...game, id: String(Date.now()) }])
                      }
                    }}
                    onEdit={(id, game) => {
                      if (!useSupabase) {
                        setGames(games.map(g => g.id === id ? { ...game, id } : g))
                      }
                    }}
                    onDelete={(id) => {
                      if (!useSupabase) {
                        setGames(games.filter(g => g.id !== id))
                      }
                    }}
                    onArchive={(id) => {
                      if (!useSupabase) {
                        setGames(games.map(g => g.id === id ? { ...g, status: 'archived' as const } : g))
                      }
                    }}
                    teams={teams.map(t => t.name)}
                    seasons={seasons.map(s => s.name)}
                    useSupabase={useSupabase}
                    organizationId={selectedOrganizationId || undefined}
                  />
                )}

                {/* Users Tab */}
                {activeSetupTab === 'users' && canViewAllUsers && (
                  <UserManagement
                    users={users}
                    onAdd={(user) => {
                      if (!useSupabase) {
                        setUsers([...users, { ...user, id: String(Date.now()) }])
                      }
                    }}
                    onEdit={(id, user) => {
                      if (!useSupabase) {
                        setUsers(users.map(u => u.id === id ? { ...user, id } : u))
                      }
                    }}
                    onDelete={(id) => {
                      if (!useSupabase) {
                        setUsers(users.filter(u => u.id !== id))
                      }
                    }}
                    onArchive={(id) => {
                      if (!useSupabase) {
                        setUsers(users.map(u => u.id === id ? { ...u, status: 'archived' as const } : u))
                      }
                    }}
                    teams={teams.map(t => t.name)}
                    players={[]}
                    seasons={seasons.map(s => ({ id: s.id, name: s.name }))}
                    useSupabase={useSupabase}
                    organizationId={selectedOrganizationId || undefined}
                  />
                )}

                {/* Seasons Tab */}
                {activeSetupTab === 'seasons' && (
                  <SeasonManagement
                    seasons={seasons}
                    onAdd={(season) => {
                      if (!useSupabase) {
                        setSeasons([...seasons, { ...season, id: String(Date.now()), teams: 0 }])
                      }
                    }}
                    onEdit={(id, season) => {
                      if (!useSupabase) {
                        const existing = seasons.find(s => s.id === id)
                        setSeasons(seasons.map(s => s.id === id ? { ...season, id, teams: existing?.teams || 0 } : s))
                      }
                    }}
                    onDelete={(id) => {
                      if (!useSupabase) {
                        setSeasons(seasons.filter(s => s.id !== id))
                      }
                    }}
                    onArchive={(id) => {
                      if (!useSupabase) {
                        setSeasons(seasons.map(s => s.id === id ? { ...s, status: 'archived' as const } : s))
                      }
                    }}
                    useSupabase={useSupabase}
                    organizationId={selectedOrganizationId || undefined}
                  />
                )}

                {/* Players Tab */}
                {activeSetupTab === 'players' && canViewAllTeams && (
                  <PlayerManagement
                    players={[]}
                    onAdd={(player) => {
                      if (!useSupabase) {
                        // Mock data handling if needed
                      }
                    }}
                    onEdit={(id, player) => {
                      if (!useSupabase) {
                        // Mock data handling if needed
                      }
                    }}
                    onDelete={(id) => {
                      if (!useSupabase) {
                        // Mock data handling if needed
                      }
                    }}
                    teams={availableTeams}
                    seasons={availableSeasons}
                    useSupabase={useSupabase}
                    organizationId={selectedOrganizationId || undefined}
                  />
                )}

                {/* Organizations Tab */}
                {activeSetupTab === 'organizations' && canViewOrganizations && (
                  <OrganizationManagement
                    organizations={organizations}
                    onAdd={(org) => {
                      if (!useSupabase) {
                        setOrganizations([...organizations, { ...org, id: String(Date.now()), teams: 0, players: 0 }])
                      } else {
                        loadOrganizations() // Reload from Supabase
                      }
                    }}
                    onEdit={(id, org) => {
                      if (!useSupabase) {
                        const existing = organizations.find(o => o.id === id)
                        setOrganizations(organizations.map(o => o.id === id ? { ...org, id, teams: existing?.teams || 0, players: existing?.players || 0 } : o))
                      } else {
                        loadOrganizations() // Reload from Supabase
                      }
                    }}
                    onDelete={(id) => {
                      if (!useSupabase) {
                        setOrganizations(organizations.filter(o => o.id !== id))
                      } else {
                        loadOrganizations() // Reload from Supabase
                      }
                    }}
                    useSupabase={useSupabase}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

