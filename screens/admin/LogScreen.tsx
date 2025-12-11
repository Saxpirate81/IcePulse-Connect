'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useGame } from '@/contexts/GameContext'
import { useAdminSettings } from '@/contexts/AdminSettingsContext'
import Link from 'next/link'
import LogItemSelectionModal from '@/components/LogItemSelectionModal'
import { useRouter } from 'next/navigation'
import { getSeasons, getTeams, getGames, getTeamCount, getPlayerCount, getCoachCount, getParentCount } from '@/lib/supabase/queries'
import AdminPageHeader from '@/components/AdminPageHeader'

const availableLogItems = [
  { id: 'shifts', name: 'Log Shifts', icon: '🔄' },
  { id: 'goals', name: 'Goals', icon: '⚽' },
  { id: 'penalties', name: 'Penalties', icon: '⚠️' },
  { id: 'shots', name: 'Shots', icon: '🎯' },
  { id: 'faceoffs', name: 'Faceoffs', icon: '🔄' },
  { id: 'clock', name: 'Clock', icon: '⏱️' },
]

export default function LogScreen() {
  const router = useRouter()
  const { 
    selectedSeason, 
    setSelectedSeason,
    selectedTeam, 
    setSelectedTeam,
    selectedGame, 
    setSelectedGame,
    loggingMode,
    setLoggingMode,
    gameDate,
    setGameDate,
    opponent,
    setOpponent,
    gameVideoId,
    setGameVideoId,
    selectedLogItems,
    setSelectedLogItems,
    setActiveLogView,
    currentUser,
    logViewAssignments,
    setLogViewAssignment,
  } = useGame()
  
  const { useSupabase, selectedOrganizationId } = useAdminSettings()
  const [showSelectionModal, setShowSelectionModal] = useState(false)
  const [showModalOnBack, setShowModalOnBack] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [justConfirmedSelection, setJustConfirmedSelection] = useState(false)
  const justConfirmedSelectionRef = useRef(false)
  const [seasons, setSeasons] = useState<Array<{ id: string; name: string }>>([])
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])
  const [games, setGames] = useState<Array<{ id: string; name: string; team: string; opponent: string; date: string; youtubeVideoId?: string }>>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    teams: 0,
    players: 0,
    coaches: 0,
    parents: 0
  })

  const hasGameSelected = selectedSeason && selectedTeam && selectedGame

  // Load data from Supabase or use mock data
  useEffect(() => {
    const loadData = async () => {
      if (useSupabase) {
        try {
          setLoading(true)
          // Load seasons
          const seasonsData = await getSeasons(selectedOrganizationId || undefined)
          setSeasons(seasonsData.map((s: any) => ({
            id: s.id,
            name: s.name
          })))

          // Load teams (filtered by organization, not by season - teams are organization-scoped)
          const teamsData = await getTeams(selectedOrganizationId || undefined)
          setTeams(teamsData.map((t: any) => ({
            id: t.id,
            name: t.name
          })))

          // Load games if team and season are selected (games are filtered by both team and season)
          if (selectedTeam && selectedSeason) {
            const gamesData = await getGames(selectedTeam, selectedSeason, selectedOrganizationId || undefined)
            const mappedGames = gamesData.map((g: any) => ({
              id: g.id,
              name: `${g.team?.name || 'Team'} vs ${g.opponent_name || 'Opponent'}`,
              team: g.team?.name || g.team_id || '',
              opponent: g.opponent_name || '',
              date: g.game_date || '',
              youtubeVideoId: g.youtube_video_id || undefined
            }))
            setGames(mappedGames)
            
            // If a game is already selected, restore its video ID
            if (selectedGame && !gameVideoId) {
              const selectedGameData = mappedGames.find((g: any) => g.id === selectedGame)
              if (selectedGameData && selectedGameData.youtubeVideoId) {
                setGameVideoId(selectedGameData.youtubeVideoId)
              }
            }
          } else {
            setGames([])
          }
        } catch (error) {
          console.error('Error loading data:', error)
          // Fallback to mock data on error
          setSeasons([
            { id: '1', name: '2024-2025' },
            { id: '2', name: '2023-2024' },
            { id: '3', name: '2022-2023' }
          ])
          setTeams([
            { id: '1', name: 'Team A' },
            { id: '2', name: 'Team B' },
            { id: '3', name: 'Team C' }
          ])
          setGames([
            { id: '1', name: 'Game 1', team: 'Team A', opponent: 'Opponent 1', date: '' },
            { id: '2', name: 'Game 2', team: 'Team A', opponent: 'Opponent 2', date: '' },
            { id: '3', name: 'Game 3', team: 'Team A', opponent: 'Opponent 3', date: '' }
          ])
        } finally {
          setLoading(false)
          setIsInitialLoad(false)
        }
      } else {
        // Use mock data
        setSeasons([
          { id: '1', name: '2024-2025' },
          { id: '2', name: '2023-2024' },
          { id: '3', name: '2022-2023' }
        ])
        setTeams([
          { id: '1', name: 'Team A' },
          { id: '2', name: 'Team B' },
          { id: '3', name: 'Team C' }
        ])
        setGames([
          { id: '1', name: 'Game 1', team: 'Team A', opponent: 'Opponent 1', date: '' },
          { id: '2', name: 'Game 2', team: 'Team A', opponent: 'Opponent 2', date: '' },
          { id: '3', name: 'Game 3', team: 'Team A', opponent: 'Opponent 3', date: '' }
        ])
        setIsInitialLoad(false)
      }
    }

    loadData()
  }, [useSupabase, selectedOrganizationId, selectedSeason, selectedTeam, selectedGame, gameVideoId])

  // Load stats
  const loadStats = async () => {
    if (useSupabase && selectedOrganizationId) {
      try {
        const [teamsCount, playersCount, coachesCount, parentsCount] = await Promise.all([
          getTeamCount(selectedOrganizationId),
          getPlayerCount(selectedOrganizationId),
          getCoachCount(selectedOrganizationId),
          getParentCount(selectedOrganizationId)
        ])
        setStats({
          teams: teamsCount,
          players: playersCount,
          coaches: coachesCount,
          parents: parentsCount
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    } else {
      // Use default values when not using Supabase
      setStats({ teams: 0, players: 0, coaches: 0, parents: 0 })
    }
  }

  // Load stats when organization changes
  useEffect(() => {
    loadStats()
  }, [useSupabase, selectedOrganizationId])

  // Don't auto-select season - let user choose
  // Removed auto-selection to prevent rendering issues

  // Ensure gameVideoId is loaded when clicking "By Video" and a game is selected
  useEffect(() => {
    if (loggingMode === 'video' && selectedGame && !gameVideoId && games.length > 0) {
      // Find the selected game in the games array and load its video ID
      const selectedGameData = games.find((g) => g.id === selectedGame)
      if (selectedGameData && selectedGameData.youtubeVideoId) {
        console.log('Loading gameVideoId for video mode:', selectedGameData.youtubeVideoId)
        setGameVideoId(selectedGameData.youtubeVideoId)
      } else if (selectedGameData && !selectedGameData.youtubeVideoId) {
        console.log('Selected game has no video ID')
      }
    }
  }, [loggingMode, selectedGame, gameVideoId, games])

  // Show selection modal when logging mode is set and no items are selected
  useEffect(() => {
    if ((loggingMode === 'live' || loggingMode === 'video') && selectedLogItems.length === 0 && hasGameSelected) {
      setShowSelectionModal(true)
    }
  }, [loggingMode, selectedLogItems.length, hasGameSelected])
  
  // Show modal when coming back from a logger view (check URL change)
  useEffect(() => {
    // If we're on the main log screen and have selected items, show modal on mount
    if (hasGameSelected && (loggingMode === 'live' || loggingMode === 'video') && selectedLogItems.length > 0) {
      // Check if we just navigated here from a logger view
      const justNavigated = sessionStorage.getItem('navigatedFromLogger')
      if (justNavigated === 'true') {
        setShowSelectionModal(true)
        sessionStorage.removeItem('navigatedFromLogger')
      }
    }
  }, [hasGameSelected, loggingMode, selectedLogItems.length])

  const handleLogItemsSelected = (items: string[]) => {
    console.log('=== handleLogItemsSelected ===')
    console.log('items:', items)
    console.log('current loggingMode:', loggingMode)
    console.log('preserving loggingMode:', loggingMode)
    
    // Set flag to indicate we just confirmed a selection (use ref for immediate access)
    justConfirmedSelectionRef.current = true
    setJustConfirmedSelection(true)
    
    // Close the modal
    setShowSelectionModal(false)
    
    setSelectedLogItems(items)
    // Auto-assign current user to all selected items if not already assigned
    if (currentUser) {
      items.forEach((itemId) => {
        if (!logViewAssignments[itemId]) {
          setLogViewAssignment(itemId, currentUser.id, currentUser.name)
        }
      })
    }
    if (items.length > 0) {
      // IMPORTANT: Preserve loggingMode when navigating to logger views
      // Don't clear it - it should persist
      console.log('Navigating to logger view, preserving loggingMode:', loggingMode)
      
      // Ensure loggingMode is preserved (in case it was cleared)
      if (loggingMode && (loggingMode === 'live' || loggingMode === 'video')) {
        console.log('Re-setting loggingMode to ensure it persists:', loggingMode)
        setLoggingMode(loggingMode)
      }
      
      // Navigate to first selected item
      const firstItem = items[0]
      setActiveLogView(firstItem)
      const routes: Record<string, string> = {
        'shifts': '/admin/log/shifts',
        'goals': '/admin/log/goals',
        'penalties': '/admin/log/penalties',
        'shots': '/admin/log/shots',
        'faceoffs': '/admin/log/faceoffs',
        'clock': '/admin/log/clock',
      }
      if (routes[firstItem]) {
        router.push(routes[firstItem])
      }
    } else {
      // If no items selected, stay on log screen
      console.log('No items selected, clearing loggingMode')
      setLoggingMode(null)
    }
    console.log('=== end handleLogItemsSelected ===')
  }


  return (
    <div className="h-full bg-gradient-to-b from-background to-surface flex flex-col overflow-hidden w-full">
      <AdminPageHeader />
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="px-4 md:px-6 pt-0 pb-4 md:pb-6 w-full overflow-x-hidden">
          <div className="w-full max-w-full overflow-x-hidden">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-2">Log</h1>
          <p className="text-textSecondary mb-6 md:mb-8">Activity log and events</p>

          {/* Game Selection - Always show when no game is fully selected */}
          {!hasGameSelected && (
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">Select Season</label>
                <select 
                  value={selectedSeason || ''}
                  onChange={(e) => {
                    setSelectedSeason(e.target.value || null)
                    setSelectedTeam(null)
                    setSelectedGame(null)
                  }}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text"
                  disabled={loading}
                >
                  <option value="">Select Season</option>
                  {seasons.map((season) => (
                    <option key={season.id} value={season.id}>{season.name}</option>
                  ))}
                </select>
              </div>
              {selectedSeason && (
                <div>
                  <label className="block text-sm font-semibold text-textSecondary mb-2">Select Team</label>
                  <select 
                    value={selectedTeam || ''}
                    onChange={(e) => {
                      setSelectedTeam(e.target.value || null)
                      setSelectedGame(null)
                    }}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text"
                    disabled={loading || teams.length === 0}
                  >
                    <option value="">Select Team</option>
                    {teams.length === 0 ? (
                      <option value="" disabled>No teams available</option>
                    ) : (
                      teams.map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))
                    )}
                  </select>
                </div>
              )}
              {selectedTeam && selectedSeason && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-textSecondary mb-2">Select Game</label>
                    <select 
                      value={selectedGame || ''}
                  onChange={(e) => {
                    const game = games.find(g => g.id === e.target.value)
                    setSelectedGame(e.target.value || null)
                    if (game) {
                      setGameDate(game.date)
                      setOpponent(game.opponent)
                      setGameVideoId(game.youtubeVideoId || null)
                    } else {
                      setGameVideoId(null)
                    }
                  }}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text"
                  disabled={loading}
                    >
                      <option value="">Select Game</option>
                      {games.map((game) => (
                    <option key={game.id} value={game.id}>{game.name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedGame && (
                    <>
                      <div>
                        <label htmlFor="game-date-input" className="block text-sm font-semibold text-textSecondary mb-2">Game Date</label>
                        <input
                          id="game-date-input"
                          name="gameDate"
                          type="date"
                          value={gameDate || ''}
                          onChange={(e) => setGameDate(e.target.value || null)}
                          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text"
                        />
                      </div>
                      <div>
                        <label htmlFor="opponent-input" className="block text-sm font-semibold text-textSecondary mb-2">Opponent</label>
                        <input
                          id="opponent-input"
                          name="opponent"
                          type="text"
                          value={opponent || ''}
                          onChange={(e) => setOpponent(e.target.value || null)}
                          placeholder="Enter opponent team name"
                          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Logging Mode Selection */}
          {hasGameSelected && !loggingMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setLoggingMode('live')}
                className="bg-gradient-to-br from-surface to-surfaceLight border-2 border-primary rounded-2xl p-6 hover:border-primary/50 transition-colors cursor-pointer text-left"
              >
                <h3 className="text-2xl font-bold text-primary mb-2">Logging Events Live</h3>
                <p className="text-textSecondary">Log events in real-time during the game</p>
              </button>
              <button
                onClick={() => {
                  console.log('=== Clicking By Video button ===')
                  setLoggingMode('video')
                  console.log('Set loggingMode to video')
                  
                  // If a game is selected, ensure gameVideoId is loaded
                  if (selectedGame && !gameVideoId) {
                    const selectedGameData = games.find((g) => g.id === selectedGame)
                    if (selectedGameData && selectedGameData.youtubeVideoId) {
                      console.log('Loading gameVideoId for video mode:', selectedGameData.youtubeVideoId)
                      setGameVideoId(selectedGameData.youtubeVideoId)
                    }
                  }
                  
                  // Verify it was set
                  setTimeout(() => {
                    const saved = localStorage.getItem('loggingMode')
                    console.log('Verified localStorage loggingMode after click:', saved)
                  }, 100)
                }}
                className="bg-gradient-to-br from-surface to-surfaceLight border-2 border-border rounded-2xl p-6 hover:border-primary/50 transition-colors cursor-pointer text-left"
              >
                <h3 className="text-2xl font-bold text-text mb-2">By Video</h3>
                <p className="text-textSecondary">Log events from video footage</p>
              </button>
            </div>
          )}

          {/* Video Logging Options - Only show if items not selected yet */}
          {hasGameSelected && loggingMode === 'video' && selectedLogItems.length === 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-text">Logging By Video</h2>
                <button
                  onClick={() => setLoggingMode(null)}
                  className="text-textSecondary hover:text-text"
                >
                  ← Back
                </button>
              </div>
              
              <p className="text-textSecondary mb-4">
                Please select which items you'd like to log from the video footage.
              </p>
              
              {!gameVideoId && (
                <div className="bg-warning/20 border border-warning rounded-xl p-4 mb-4">
                  <p className="text-warning text-sm">
                    ⚠️ No video link attached to this game. Please add a YouTube video link in the game settings.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Live Logging Options - Only show if items not selected yet */}
          {hasGameSelected && loggingMode === 'live' && selectedLogItems.length === 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-text">Logging Events Live</h2>
                <button
                  onClick={() => setLoggingMode(null)}
                  className="text-textSecondary hover:text-text"
                >
                  ← Back
                </button>
              </div>
              
              <p className="text-textSecondary mb-4">
                Please select which items you'd like to log during this game.
              </p>
            </div>
          )}

          {/* Show selected log items info */}
          {hasGameSelected && loggingMode === 'live' && selectedLogItems.length > 0 && (
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-text">Active Logging Views</h2>
                <button
                  onClick={() => {
                    sessionStorage.setItem('navigatedFromLogger', 'true')
                    setShowSelectionModal(true)
                  }}
                  className="text-primary hover:text-primaryDark"
                >
                  Edit Views
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedLogItems.map((itemId) => {
                  const item = availableLogItems.find(i => i.id === itemId)
                  return (
                    <button
                      key={itemId}
                      onClick={() => {
                        setActiveLogView(itemId)
                        const routes: Record<string, string> = {
                          'shifts': '/admin/log/shifts',
                          'goals': '/admin/log/goals',
                          'penalties': '/admin/log/penalties',
                          'shots': '/admin/log/shots',
                          'faceoffs': '/admin/log/faceoffs',
                          'clock': '/admin/log/clock',
                        }
                        if (routes[itemId]) {
                          router.push(routes[itemId])
                        }
                      }}
                      className="bg-gradient-to-br from-surface to-surfaceLight border-2 border-primary rounded-xl p-4 hover:border-primary/50 transition-colors text-left"
                    >
                      <div className="text-3xl mb-2">{item?.icon}</div>
                      <div className="text-lg font-semibold text-text">{item?.name}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Stats Cards - Always show when no game selected or no logging mode */}
          {(!hasGameSelected || !loggingMode) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 mt-8">
              <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm text-textSecondary mb-2">Teams</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stats.teams}</p>
              </div>
              <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm text-textSecondary mb-2">Players</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stats.players}</p>
              </div>
              <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm text-textSecondary mb-2">Coaches</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stats.coaches}</p>
              </div>
              <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm text-textSecondary mb-2">Parents</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stats.parents}</p>
              </div>
            </div>
          )}
          
          {/* Stats Cards - Show when in live mode waiting for item selection */}
          {hasGameSelected && loggingMode === 'live' && selectedLogItems.length === 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 mt-8">
              <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm text-textSecondary mb-2">Teams</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stats.teams}</p>
              </div>
              <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm text-textSecondary mb-2">Players</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stats.players}</p>
              </div>
              <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm text-textSecondary mb-2">Coaches</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stats.coaches}</p>
              </div>
              <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm text-textSecondary mb-2">Parents</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stats.parents}</p>
              </div>
            </div>
          )}
          
          {/* Stats Cards - Also show when in live mode with items selected (below the active views) */}
          {hasGameSelected && loggingMode === 'live' && selectedLogItems.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm text-textSecondary mb-2">Teams</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stats.teams}</p>
              </div>
              <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm text-textSecondary mb-2">Players</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stats.players}</p>
              </div>
              <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm text-textSecondary mb-2">Coaches</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stats.coaches}</p>
              </div>
              <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm text-textSecondary mb-2">Parents</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stats.parents}</p>
              </div>
            </div>
          )}
          
          {/* Stats Cards - Show when in live mode waiting for item selection */}
          {hasGameSelected && loggingMode === 'live' && selectedLogItems.length === 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 mt-8">
              <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm text-textSecondary mb-2">Teams</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stats.teams}</p>
              </div>
              <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm text-textSecondary mb-2">Players</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stats.players}</p>
              </div>
              <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm text-textSecondary mb-2">Coaches</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stats.coaches}</p>
              </div>
              <div className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <p className="text-sm text-textSecondary mb-2">Parents</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stats.parents}</p>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Log Item Selection Modal */}
      <LogItemSelectionModal
        isOpen={showSelectionModal}
        onClose={() => {
          console.log('=== Modal onClose called ===')
          console.log('justConfirmedSelection (state):', justConfirmedSelection)
          console.log('justConfirmedSelection (ref):', justConfirmedSelectionRef.current)
          console.log('selectedLogItems.length:', selectedLogItems.length)
          console.log('loggingMode:', loggingMode)
          
          setShowSelectionModal(false)
          
          // Only clear loggingMode if:
          // 1. We didn't just confirm a selection (check ref for immediate value - this is the key!)
          // 2. AND we have no selected items (or items.length is 0)
          // 3. AND loggingMode is set
          // IMPORTANT: If justConfirmedSelectionRef.current is true, we just confirmed items,
          // so DON'T clear loggingMode even if selectedLogItems.length is 0 (state hasn't updated yet)
          // ALSO: If selectedLogItems.length > 0, we have items, so NEVER clear loggingMode
          const shouldClearLoggingMode = 
            !justConfirmedSelectionRef.current && 
            selectedLogItems.length === 0 && 
            (loggingMode === 'live' || loggingMode === 'video')
          
          if (shouldClearLoggingMode) {
            console.log('Closing modal without items and no confirmation, clearing loggingMode')
            setLoggingMode(null)
          } else {
            console.log('Closing modal but preserving loggingMode:', loggingMode)
            console.log('Reason: justConfirmedSelectionRef=', justConfirmedSelectionRef.current, 'selectedLogItems.length=', selectedLogItems.length)
            // Double-check: if we have items, ensure loggingMode is preserved
            if (selectedLogItems.length > 0 && loggingMode) {
              console.log('Selected items exist, ensuring loggingMode is preserved')
              setLoggingMode(loggingMode)
            }
          }
          
          // Reset the flags AFTER a short delay to ensure state updates have propagated
          setTimeout(() => {
            justConfirmedSelectionRef.current = false
            setJustConfirmedSelection(false)
          }, 100)
        }}
        onConfirm={handleLogItemsSelected}
        availableItems={availableLogItems}
        selectedItems={selectedLogItems}
        showClearAll={selectedLogItems.length > 0}
      />
    </div>
  )
}
