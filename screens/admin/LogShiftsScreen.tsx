'use client'

import React, { useState, useEffect } from 'react'
import { useGame } from '@/contexts/GameContext'
import { useAdminSettings } from '@/contexts/AdminSettingsContext'
import PlayerContainer, { Player } from '@/components/PlayerContainer'
import GameClockDisplay from '@/components/GameClockDisplay'
import { useRouter } from 'next/navigation'
import { Lock, Unlock, X } from 'lucide-react'
import { getPersonsWithRosters, getTeams } from '@/lib/supabase/queries'
import { useAuth } from '@/contexts/AuthContext'
import GameVideoPlayer from '@/components/GameVideoPlayer'
import { useIsDesktop } from '@/hooks/useIsDesktop'

export default function LogShiftsScreen() {
  const router = useRouter()
  const { 
    clock, 
    startClock, 
    stopClock, 
    toggleClockLock, 
    setActiveLogView,
    currentUser,
    logViewAssignments,
    setLogViewAssignment,
    setSelectedGame,
    setSelectedTeam,
    setSelectedSeason,
    setLoggingMode,
    setSelectedLogItems,
    loggingMode,
    gameVideoId,
    setGameVideoId,
    gameDate,
    opponent,
    selectedGame,
  } = useGame()
  const { user } = useAuth()
  const { useSupabase, selectedOrganizationId } = useAdminSettings()
  const [isVideoMinimized, setIsVideoMinimized] = useState(false)
  const isDesktop = useIsDesktop()
  
  // Get selectedTeam and selectedSeason from context
  const { selectedTeam, selectedSeason } = useGame()
  
  // Load gameVideoId if not set but game is selected
  useEffect(() => {
    const loadGameVideoId = async () => {
      if (useSupabase && selectedOrganizationId && selectedTeam && selectedSeason && selectedGame && !gameVideoId) {
        try {
          const { getGames } = await import('@/lib/supabase/queries')
          const gamesData = await getGames(selectedTeam, selectedSeason, selectedOrganizationId)
          const game = gamesData.find((g: any) => g.id === selectedGame)
          if (game && game.youtube_video_id) {
            setGameVideoId(game.youtube_video_id)
            console.log('Loaded gameVideoId in LogShiftsScreen:', game.youtube_video_id)
          }
        } catch (error) {
          console.error('Error loading game video ID:', error)
        }
      }
    }
    loadGameVideoId()
  }, [useSupabase, selectedOrganizationId, selectedTeam, selectedSeason, selectedGame, gameVideoId, setGameVideoId])
  
  useEffect(() => {
    setActiveLogView('shifts')
    // Ensure only current user is assigned to this view
    if (currentUser) {
      const assignment = logViewAssignments['shifts']
      if (!assignment) {
        // No one assigned, assign current user
        setLogViewAssignment('shifts', currentUser.id, currentUser.name)
      } else if (assignment.userId !== currentUser.id) {
        // Someone else is assigned - don't override, but we could show a warning
        console.warn(`Shifts view is already assigned to ${assignment.userName}`)
      }
    }
  }, [setActiveLogView, currentUser, logViewAssignments, setLogViewAssignment])
  const [players, setPlayers] = useState<Player[]>([])
  const [onIcePlayers, setOnIcePlayers] = useState<{
    forwards: Player[]
    defense: Player[]
    goalie: Player[]
  }>({
    forwards: [],
    defense: [],
    goalie: [],
  })
  const [positionLocked, setPositionLocked] = useState(false)
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])

  // Load teams to get team name
  useEffect(() => {
    const loadTeams = async () => {
      if (useSupabase && selectedOrganizationId && selectedTeam) {
        try {
          const teamsData = await getTeams(selectedOrganizationId)
          setTeams(teamsData.map((t: any) => ({ id: t.id, name: t.name })))
        } catch (error) {
          console.error('Error loading teams:', error)
        }
      }
    }
    loadTeams()
  }, [useSupabase, selectedOrganizationId, selectedTeam])

  // Get team name from ID
  const teamName = selectedTeam ? (teams.find(t => t.id === selectedTeam)?.name || selectedTeam) : 'My Team'

  // Load players from Supabase
  useEffect(() => {
    const loadPlayers = async () => {
      if (useSupabase && selectedOrganizationId && selectedTeam && selectedSeason) {
        try {
          // Get all players for the organization
          const personsData = await getPersonsWithRosters(selectedOrganizationId)
          
          // Filter players by selected team and season
          const filteredPlayers: Player[] = []
          
          personsData.forEach((person) => {
            // Find roster membership matching selected team and season
            const roster = person.rosterMemberships.find(
              (rm: any) => rm.teamId === selectedTeam && rm.seasonId === selectedSeason
            )
            
            if (roster) {
              // Split name into first and last
              const nameParts = person.name.split(' ')
              const firstName = nameParts[0] || ''
              const lastName = nameParts.slice(1).join(' ') || ''
              
              filteredPlayers.push({
                id: `${person.id}-${roster.rosterId}`, // Unique ID for this roster membership
                jerseyNumber: parseInt(String(roster.jerseyNumber)) || 0,
                firstName,
                lastName,
              })
            }
          })

          // Load saved positions and availability from localStorage
          const savedPositions = localStorage.getItem('playerPositions')
          const savedAvailability = localStorage.getItem('playerAvailability')
          
          if (savedPositions) {
            const positions = JSON.parse(savedPositions)
            let hasPositions = false
            filteredPlayers.forEach((player) => {
              if (positions[player.id]) {
                player.position = positions[player.id]
                hasPositions = true
              }
            })
            
            // If positions exist from a previous game, lock positions by default
            if (hasPositions) {
              setPositionLocked(true)
            }
          }
          
          if (savedAvailability) {
            const availability = JSON.parse(savedAvailability)
            filteredPlayers.forEach((player) => {
              if (availability[player.id] !== undefined) {
                player.isAvailable = availability[player.id]
              }
            })
          }

          // Sort players: available first (by jersey number), then unavailable at bottom
          filteredPlayers.sort((a, b) => {
            const aAvailable = a.isAvailable !== false
            const bAvailable = b.isAvailable !== false
            if (aAvailable && !bAvailable) return -1
            if (!aAvailable && bAvailable) return 1
            return a.jerseyNumber - b.jerseyNumber
          })

          setPlayers(filteredPlayers)
        } catch (error) {
          console.error('Error loading players:', error)
          setPlayers([])
        }
      } else {
        // Fallback to empty array if not using Supabase or missing required data
        setPlayers([])
      }
    }
    
    loadPlayers()
  }, [useSupabase, selectedOrganizationId, selectedTeam, selectedSeason])

  const handlePositionAssigned = (playerId: string, position: 'Forward' | 'Defense' | 'Goalie' | null, isAvailable?: boolean) => {
    setPlayers((prev) => {
      const updated = prev.map((p) => {
        if (p.id === playerId) {
          if (isAvailable === false) {
            return { ...p, position: undefined, isAvailable: false }
          } else {
            return { ...p, position: position || undefined, isAvailable: isAvailable !== undefined ? isAvailable : true }
          }
        }
        return p
      })
      
      // Save to localStorage
      const positions: Record<string, 'Forward' | 'Defense' | 'Goalie' | 'Not Available'> = {}
      const availability: Record<string, boolean> = {}
      updated.forEach((p) => {
        if (p.position) {
          positions[p.id] = p.position
        }
        if (p.isAvailable !== undefined) {
          availability[p.id] = p.isAvailable
        }
      })
      localStorage.setItem('playerPositions', JSON.stringify(positions))
      localStorage.setItem('playerAvailability', JSON.stringify(availability))
      
      return updated
    })
  }

  const handlePlayerClick = (player: Player) => {
    if (!player.position) return

    const totalOnIce = onIcePlayers.forwards.length + onIcePlayers.defense.length + onIcePlayers.goalie.length
    
    // Check if player is already on ice
    const isOnIce = 
      onIcePlayers.forwards.some((p) => p.id === player.id) ||
      onIcePlayers.defense.some((p) => p.id === player.id) ||
      onIcePlayers.goalie.some((p) => p.id === player.id)

    if (isOnIce) {
      // Remove from ice
      setOnIcePlayers((prev) => ({
        forwards: prev.forwards.filter((p) => p.id !== player.id),
        defense: prev.defense.filter((p) => p.id !== player.id),
        goalie: prev.goalie.filter((p) => p.id !== player.id),
      }))
    } else {
      // Add to ice (max 6 players)
      if (totalOnIce >= 6) return

      setOnIcePlayers((prev) => {
        const newState = { ...prev }
        // Allow up to 6 total players regardless of position distribution
        if (player.position === 'Forward') {
          newState.forwards = [...newState.forwards, player]
        } else if (player.position === 'Defense') {
          newState.defense = [...newState.defense, player]
        } else if (player.position === 'Goalie') {
          newState.goalie = [player]
        }
        return newState
      })
    }
  }

  const getPositionColor = (position: 'Forward' | 'Defense' | 'Goalie') => {
    switch (position) {
      case 'Forward':
        return 'bg-blue-500/30 border-blue-500'
      case 'Defense':
        return 'bg-green-500/30 border-green-500'
      case 'Goalie':
        return 'bg-yellow-500/30 border-yellow-500'
    }
  }

  const totalOnIce = onIcePlayers.forwards.length + onIcePlayers.defense.length + onIcePlayers.goalie.length

  // Get all on-ice player IDs
  const onIcePlayerIds = new Set([
    ...onIcePlayers.forwards.map(p => p.id),
    ...onIcePlayers.defense.map(p => p.id),
    ...onIcePlayers.goalie.map(p => p.id),
  ])

  // Filter out players who are on ice from the bench
  const benchPlayers = players.filter(player => !onIcePlayerIds.has(player.id))

  return (
    <div className="h-full bg-gradient-to-b from-background to-surface flex flex-col overflow-hidden w-full" style={{ overflowX: 'hidden', overflowY: 'hidden', height: '100%', maxHeight: '100%' }}>
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 overflow-hidden overflow-x-hidden w-full max-w-full">
        <div className="px-4 md:px-6 py-4 md:py-6 w-full overflow-x-hidden max-w-full" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
          <div className="w-full max-w-full overflow-x-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-text mb-2">Log Shifts</h1>
              <div className="flex items-center gap-2">
                <p className="text-textSecondary">Manage player shifts and positions</p>
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
                        setActiveLogView(null)
                        setLoggingMode(null)
                        setSelectedLogItems([])
                        router.push('/admin')
                      }}
                      className="text-textSecondary hover:text-text"
                    >
                      ← Back
                    </button>
          </div>

          {/* Clock Display - Hide when in video mode */}
          {loggingMode !== 'video' && (
            <div className="mb-6">
              <GameClockDisplay size="small" showControls={true} showScores={true} showLockButton={true} teamName={teamName} />
            </div>
          )}

          {/* Video Player - Only show on mobile when in video mode (desktop shows in split view) */}
          {loggingMode === 'video' && !isDesktop && (
            <div className="mb-6">
              {gameVideoId ? (
                <GameVideoPlayer
                  videoId={gameVideoId}
                  isMinimized={isVideoMinimized}
                  onToggleMinimize={() => setIsVideoMinimized(!isVideoMinimized)}
                  gameDate={gameDate || undefined}
                  teamName={teamName || undefined}
                  opponent={opponent || undefined}
                  showGameClock={true}
                />
              ) : (
                <div className="bg-surface border border-border rounded-xl p-4">
                  <p className="text-textSecondary text-sm text-center">
                    No video link attached to this game. Please add a YouTube video link in the game settings.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* On Ice Container */}
          <div className="bg-surface border border-border rounded-xl px-4 md:px-6 pt-6 pb-3 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-text">On Ice ({totalOnIce}/6)</h2>
                    </div>
                    <div className="flex items-start gap-2 md:gap-4 w-full overflow-hidden overflow-x-hidden">
                      {/* Forwards - 50% width */}
                      <div className="flex-[1_1_0] min-w-0 max-w-[50%]">
                        <div className="text-sm font-semibold text-blue-500 mb-2">Forwards</div>
                <div className="min-h-[80px] bg-blue-500/10 border-2 border-dashed border-blue-500/30 rounded-lg p-1 md:p-2 flex gap-2 md:gap-3 items-center justify-center flex-nowrap overflow-hidden overflow-x-hidden w-full">
                  {onIcePlayers.forwards.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => handlePlayerClick(player)}
                      className="bg-blue-500/30 border-2 border-blue-500 rounded-lg cursor-pointer hover:bg-blue-500/40 transition-colors text-center flex-shrink-0 flex items-center justify-center relative max-w-full"
                      style={{ 
                        width: 'clamp(60px, 12vw, 100px)',
                        height: 'clamp(60px, 12vw, 100px)',
                        padding: 'clamp(2px, 0.5vw, 4px)',
                        maxWidth: '100%'
                      }}
                    >
                      {player.isAvailable === false && (
                        <div className="absolute inset-0 bg-gray-800/50 rounded-lg pointer-events-none z-10" />
                      )}
                      <div className="flex flex-col items-center justify-center w-full h-full relative z-0">
                        <div className="text-[clamp(4.5rem, 18vw, 9rem)] font-bold text-white whitespace-nowrap leading-none">{player.jerseyNumber}</div>
                        <div className="text-[clamp(0.35rem, 0.9vw, 0.55rem)] text-textSecondary mt-0.5 truncate w-full">{player.firstName[0]}. {player.lastName}</div>
                        {player.isAvailable === false && (
                          <div className="text-[clamp(0.3rem, 0.7vw, 0.45rem)] text-red-400 font-bold mt-0.5 brightness-150">Not Available</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {onIcePlayers.forwards.length > 0 && (
                  <button
                    onClick={() => setOnIcePlayers((prev) => ({ ...prev, forwards: [] }))}
                    className="mt-2 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-error/20 border border-error rounded text-error hover:bg-error/30 transition-colors mx-auto"
                  >
                    <X size={12} />
                    Clear
                  </button>
                )}
              </div>

                      {/* Defense - 35% width */}
                      <div className="flex-[0.7_1_0] min-w-0 max-w-[35%]">
                        <div className="text-sm font-semibold text-green-500 mb-2">Defense</div>
                <div className="min-h-[80px] bg-green-500/10 border-2 border-dashed border-green-500/30 rounded-lg p-1 md:p-2 flex gap-2 md:gap-3 items-center justify-center flex-nowrap overflow-hidden overflow-x-hidden w-full">
                  {onIcePlayers.defense.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => handlePlayerClick(player)}
                      className="bg-green-500/30 border-2 border-green-500 rounded-lg cursor-pointer hover:bg-green-500/40 transition-colors text-center flex-shrink-0 flex items-center justify-center relative max-w-full"
                      style={{ 
                        width: 'clamp(60px, 12vw, 100px)',
                        height: 'clamp(60px, 12vw, 100px)',
                        padding: 'clamp(2px, 0.5vw, 4px)',
                        maxWidth: '100%'
                      }}
                    >
                      {player.isAvailable === false && (
                        <div className="absolute inset-0 bg-gray-800/50 rounded-lg pointer-events-none z-10" />
                      )}
                      <div className="flex flex-col items-center justify-center w-full h-full relative z-0">
                        <div className="text-[clamp(4.5rem, 18vw, 9rem)] font-bold text-white whitespace-nowrap leading-none">{player.jerseyNumber}</div>
                        <div className="text-[clamp(0.35rem, 0.9vw, 0.55rem)] text-textSecondary mt-0.5 truncate w-full">{player.firstName[0]}. {player.lastName}</div>
                        {player.isAvailable === false && (
                          <div className="text-[clamp(0.3rem, 0.7vw, 0.45rem)] text-red-400 font-bold mt-0.5 brightness-150">Not Available</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {onIcePlayers.defense.length > 0 && (
                  <button
                    onClick={() => setOnIcePlayers((prev) => ({ ...prev, defense: [] }))}
                    className="mt-2 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-error/20 border border-error rounded text-error hover:bg-error/30 transition-colors mx-auto"
                  >
                    <X size={12} />
                    Clear
                  </button>
                )}
              </div>

              {/* Goalie - 15% width */}
              <div className="flex-[0.3_1_0] min-w-0 max-w-[15%]">
                <div className="text-sm font-semibold text-yellow-500 mb-2">Goalie</div>
                <div className="min-h-[80px] bg-yellow-500/10 border-2 border-dashed border-yellow-500/30 rounded-lg p-1 md:p-2 flex gap-2 md:gap-3 items-center justify-center flex-nowrap overflow-hidden overflow-x-hidden w-full">
                  {onIcePlayers.goalie.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => handlePlayerClick(player)}
                      className="bg-yellow-500/30 border-2 border-yellow-500 rounded-lg cursor-pointer hover:bg-yellow-500/40 transition-colors text-center flex-shrink-0 flex items-center justify-center relative max-w-full"
                      style={{ 
                        width: 'clamp(60px, 12vw, 100px)',
                        height: 'clamp(60px, 12vw, 100px)',
                        padding: 'clamp(2px, 0.5vw, 4px)',
                        maxWidth: '100%'
                      }}
                    >
                      {player.isAvailable === false && (
                        <div className="absolute inset-0 bg-gray-800/50 rounded-lg pointer-events-none z-10" />
                      )}
                      <div className="flex flex-col items-center justify-center w-full h-full relative z-0">
                        <div className="text-[clamp(4.5rem, 18vw, 9rem)] font-bold text-white whitespace-nowrap leading-none">{player.jerseyNumber}</div>
                        <div className="text-[clamp(0.35rem, 0.9vw, 0.55rem)] text-textSecondary mt-0.5 truncate w-full">{player.firstName[0]}. {player.lastName}</div>
                        {player.isAvailable === false && (
                          <div className="text-[clamp(0.3rem, 0.7vw, 0.45rem)] text-red-400 font-bold mt-0.5 brightness-150">Not Available</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {onIcePlayers.goalie.length > 0 && (
                  <button
                    onClick={() => setOnIcePlayers((prev) => ({ ...prev, goalie: [] }))}
                    className="mt-2 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-error/20 border border-error rounded text-error hover:bg-error/30 transition-colors mx-auto"
                  >
                    <X size={12} />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Scrollable Bench Container */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 w-full">
        <div className="w-full h-full flex flex-col overflow-hidden px-4 md:px-6">
          <div className="flex items-center justify-between mb-4 flex-shrink-0 pt-4">
            <h2 className="text-xl font-semibold text-text">The Bench</h2>
            <button
              onClick={() => setPositionLocked(!positionLocked)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                positionLocked
                  ? 'bg-error/20 border-error text-error hover:bg-error/30'
                  : 'bg-success/20 border-success text-success hover:bg-success/30'
              }`}
            >
              {positionLocked ? <Lock size={14} /> : <Unlock size={14} />}
              <span className="text-xs font-semibold">
                {positionLocked ? 'Unlock Positions' : 'Lock Positions'}
              </span>
            </button>
          </div>
                  <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
                    <PlayerContainer
                      players={benchPlayers.sort((a, b) => {
                        const aAvailable = a.isAvailable !== false
                        const bAvailable = b.isAvailable !== false
                        if (aAvailable && !bAvailable) return -1
                        if (!aAvailable && bAvailable) return 1
                        return a.jerseyNumber - b.jerseyNumber
                      })}
                      onPlayerClick={handlePlayerClick}
                      onPlayerLongPress={positionLocked ? undefined : undefined}
                      showPositions={true}
                      allowPositionAssignment={!positionLocked}
                      onPositionAssigned={handlePositionAssigned}
                    />
                  </div>
                  {/* Padding at bottom */}
                  <div className="h-6 flex-shrink-0"></div>
        </div>
      </div>
    </div>
  )
}

