'use client'

import React, { useEffect, useState } from 'react'
import { useGame } from '@/contexts/GameContext'
import GameClockDisplay from '@/components/GameClockDisplay'
import { useRouter } from 'next/navigation'
import GameVideoPlayer from '@/components/GameVideoPlayer'
import { useAdminSettings } from '@/contexts/AdminSettingsContext'
import { getTeams, getPersonsWithRosters } from '@/lib/supabase/queries'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { useAuth } from '@/contexts/AuthContext'
import IceRink from '@/components/IceRink'
import GoalieShotSelector from '@/components/GoalieShotSelector'
import { Player } from '@/components/PlayerContainer'
import { RotateCw, Trash2 } from 'lucide-react'

interface Shot {
  id: string
  time: string // MM:SS format
  x: number // Percentage of rink width
  y: number // Percentage of rink height
  zone: 'attacking' | 'defending'
  isGoal: boolean // True only if Goal button was clicked first
  isShotOnNet: boolean // True if shot was on net (SOG) but not a goal
  isBlocked: boolean
  team: 'myTeam' | 'opponent'
  player: {
    type: 'player' | 'unknown' | 'opponent'
    playerId?: string
    jerseyNumber?: number
    firstName?: string
    lastName?: string
    opponentJersey?: number
  }
}

export default function LogShotsScreen() {
  const router = useRouter()
  const { 
    clock, 
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
    gameDate,
    opponent,
    selectedTeam,
    selectedSeason,
    stopClock
  } = useGame()
  const { useSupabase, selectedOrganizationId } = useAdminSettings()
  const { user } = useAuth()
  const [isVideoMinimized, setIsVideoMinimized] = useState(false)
  const isDesktop = useIsDesktop()
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [shots, setShots] = useState<Shot[]>([])
  const [showGoalieSelector, setShowGoalieSelector] = useState(false)
  const [pendingShot, setPendingShot] = useState<{ x: number; y: number; zone: 'attacking' | 'defending' } | null>(null)
  const [editingShot, setEditingShot] = useState<Shot | null>(null)
  const [rotation, setRotation] = useState(0)
  
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
  
  // Load players
  useEffect(() => {
    const loadPlayers = async () => {
      if (useSupabase && selectedOrganizationId && selectedTeam && selectedSeason) {
        try {
          const personsData = await getPersonsWithRosters(selectedOrganizationId)
          const filteredPlayers: Player[] = []
          
          personsData.forEach((person: any) => {
            const nameParts = person.name?.split(' ') || []
            const firstName = nameParts[0] || ''
            const lastName = nameParts.slice(1).join(' ') || ''
            
            person.rosterMemberships?.forEach((roster: any) => {
              if (roster.teamId === selectedTeam && roster.seasonId === selectedSeason) {
                filteredPlayers.push({
                  id: `${person.id}-${roster.rosterId}`,
                  jerseyNumber: parseInt(String(roster.jerseyNumber)) || 0,
                  firstName,
                  lastName,
                })
              }
            })
          })

          filteredPlayers.sort((a, b) => a.jerseyNumber - b.jerseyNumber)
          setPlayers(filteredPlayers)
        } catch (error) {
          console.error('Error loading players:', error)
          setPlayers([])
        }
      }
    }
    loadPlayers()
  }, [useSupabase, selectedOrganizationId, selectedTeam, selectedSeason])
  
  // Get team name from ID
  const teamName = selectedTeam ? (teams.find(t => t.id === selectedTeam)?.name || selectedTeam) : 'My Team'
  
  useEffect(() => {
    setActiveLogView('shots')
    if (currentUser) {
      const assignment = logViewAssignments['shots']
      if (!assignment) {
        setLogViewAssignment('shots', currentUser.id, currentUser.name)
      }
    }
  }, [setActiveLogView, currentUser, logViewAssignments, setLogViewAssignment])

  // Load shots from localStorage
  useEffect(() => {
    const savedShots = localStorage.getItem('shots')
    if (savedShots) {
      try {
        setShots(JSON.parse(savedShots))
      } catch (e) {
        console.error('Error loading shots:', e)
      }
    }
  }, [])

  // Save shots to localStorage
  useEffect(() => {
    if (shots.length > 0 || localStorage.getItem('shots')) {
      localStorage.setItem('shots', JSON.stringify(shots))
    }
  }, [shots])

  const getCurrentTime = (): string => {
    return `${String(clock.minutes).padStart(2, '0')}:${String(clock.seconds).padStart(2, '0')}`
  }

  const handleRinkClick = (x: number, y: number, zone: 'attacking' | 'defending') => {
    // Allow clicks in both zones - both can log shots
    setPendingShot({ x, y, zone })
    setShowGoalieSelector(true)
  }

  const handleShotSave = (
    shotLocation: { x: number; y: number } | null, 
    isGoal: boolean, 
    isBlocked: boolean,
    player: Player | null, 
    opponentJersey: string | null,
    team: 'myTeam' | 'opponent',
    isShotOnNet?: boolean
  ) => {
    if (!pendingShot && !editingShot) return
    // For blocked shots, location can be null
    if (!isBlocked && !shotLocation) return

    const shotData: Shot = {
      id: editingShot?.id || `shot-${Date.now()}`,
      time: editingShot?.time || getCurrentTime(),
      x: shotLocation ? shotLocation.x : (pendingShot?.x || editingShot?.x || 0),
      y: shotLocation ? shotLocation.y : (pendingShot?.y || editingShot?.y || 0),
      zone: pendingShot?.zone || editingShot?.zone || 'attacking',
      isGoal: isGoal, // Only true if Goal button was clicked first
      isShotOnNet: isShotOnNet || false, // True if shot was on net but not a goal
      isBlocked,
      team,
      player: team === 'myTeam'
        ? (player
            ? {
                type: 'player',
                playerId: player.id,
                jerseyNumber: player.jerseyNumber,
                firstName: player.firstName,
                lastName: player.lastName,
              }
            : {
                type: 'unknown',
              })
        : (opponentJersey
            ? {
                type: 'opponent',
                opponentJersey: parseInt(opponentJersey),
              }
            : {
                type: 'unknown',
              }),
    }

    if (editingShot) {
      // Update existing shot
      setShots(shots.map(s => s.id === editingShot.id ? shotData : s))
      setEditingShot(null)
    } else {
      // Add new shot
      setShots([...shots, shotData])
    }
    
    setPendingShot(null)
    setShowGoalieSelector(false)
    // Stop the game clock when logging
    stopClock()
  }

  const handleDeleteShot = (shotId: string) => {
    setShots(shots.filter(s => s.id !== shotId))
    setEditingShot(null)
    setShowGoalieSelector(false)
  }

  const handleEditShot = (shot: Shot) => {
    setEditingShot(shot)
    setPendingShot({ x: shot.x, y: shot.y, zone: shot.zone })
    setShowGoalieSelector(true)
  }

  const handleRotate = () => {
    setRotation((prev) => (prev === 0 ? 180 : 0))
  }

  const formatShotDisplay = (shot: Shot): string => {
    const shotTeamName = shot.team === 'myTeam' ? teamName : (opponent || 'Opponent')
    
    let playerName = ''
    if (shot.player.type === 'player' && shot.player.firstName && shot.player.lastName) {
      playerName = `${shot.player.firstName[0]}. ${shot.player.lastName} (${shot.player.jerseyNumber})`
    } else if (shot.player.type === 'opponent' && shot.player.opponentJersey) {
      playerName = `#${shot.player.opponentJersey}`
    } else {
      playerName = 'Unknown Player'
    }
    
    let shotType = ''
    if (shot.isBlocked) {
      shotType = 'BLOCKED'
    } else if (shot.isGoal) {
      shotType = 'GOAL'
    } else if (shot.isShotOnNet) {
      shotType = 'SOG'
    } else {
      shotType = 'MISS'
    }
    
    return `${shotType} @ ${shot.time} - ${shotTeamName} - ${playerName}`
  }

  return (
    <div className="h-full bg-gradient-to-b from-background to-surface flex flex-col overflow-hidden w-full" style={{ overflowX: 'hidden', overflowY: 'hidden', height: '100%', maxHeight: '100%' }}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="px-4 md:px-6 py-4 md:py-6 w-full">
          <div className="w-full max-w-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-text mb-2">Log Shots</h1>
              <p className="text-textSecondary">Record shots during the game</p>
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

          {/* Ice Rink */}
          <div 
            className="bg-surface border border-border rounded-xl p-4 md:p-6 mb-4 flex flex-col"
            style={{ 
              minHeight: '400px',
              maxHeight: 'calc(100vh - 450px)', // Leave room for header, controls, and list
              height: 'auto'
            }}
          >
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-lg font-semibold text-text">Ice Rink</h2>
              <button
                onClick={handleRotate}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-text rounded-lg hover:bg-primaryDark transition-colors"
              >
                <RotateCw size={16} />
                <span className="text-sm font-semibold">Rotate</span>
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <IceRink
                onSpotClick={handleRinkClick}
                rotation={rotation}
                shots={shots.map(shot => ({
                  id: shot.id,
                  x: shot.x,
                  y: shot.y,
                  zone: shot.zone,
                  isGoal: shot.isGoal,
                  team: shot.team,
                }))}
                mode="shots"
              />
            </div>
          </div>

          {/* Shots List */}
          <div className="bg-surface border border-border rounded-xl p-4 md:p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Recorded Shots</h2>
            {shots.length === 0 ? (
              <p className="text-textSecondary text-center py-8">No shots recorded</p>
            ) : (
              <div className="space-y-2">
                {shots.map((shot) => (
                  <div 
                    key={shot.id} 
                    className="flex items-center justify-between gap-3 p-3 bg-surfaceLight rounded-lg cursor-pointer hover:bg-surfaceLight/80 transition-colors"
                    onClick={() => handleEditShot(shot)}
                  >
                    <div className="flex-1">
                      <p className="text-text text-sm">
                        {formatShotDisplay(shot)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteShot(shot.id)
                      }}
                      className="p-1.5 text-error hover:bg-error/20 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Goalie Shot Selector Modal */}
      {showGoalieSelector && (pendingShot || editingShot) && (
        <GoalieShotSelector
          onSave={handleShotSave}
          onClose={() => {
            setShowGoalieSelector(false)
            setPendingShot(null)
            setEditingShot(null)
          }}
          players={players}
          defaultPlayer={editingShot?.player?.type === 'player' && editingShot.player.playerId 
            ? players.find(p => p.id === editingShot.player.playerId) || null
            : null}
          teamName={teamName}
          opponentName={opponent || 'Opponent'}
          zone={pendingShot?.zone || editingShot?.zone || 'attacking'}
          editingShot={editingShot ? {
            isGoal: editingShot.isGoal,
            isShotOnNet: editingShot.isShotOnNet,
            isBlocked: editingShot.isBlocked,
            team: editingShot.team,
            player: editingShot.player.type === 'player' && editingShot.player.playerId
              ? players.find(p => p.id === editingShot.player.playerId) || null
              : null,
            opponentJersey: editingShot.player.type === 'opponent' && editingShot.player.opponentJersey
              ? editingShot.player.opponentJersey.toString()
              : null,
          } : null}
        />
      )}
    </div>
  )
}

