'use client'

import React, { useEffect, useState } from 'react'
import { useGame } from '@/contexts/GameContext'
import GameClockDisplay from '@/components/GameClockDisplay'
import { useRouter } from 'next/navigation'
import GameVideoPlayer from '@/components/GameVideoPlayer'
import { useAdminSettings } from '@/contexts/AdminSettingsContext'
import { getTeams, getPersonsWithRosters } from '@/lib/supabase/queries'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import IceRink from '@/components/IceRink'
import FaceoffSelector from '@/components/FaceoffSelector'
import { Player } from '@/components/PlayerContainer'
import { RotateCw, Trash2 } from 'lucide-react'

interface Faceoff {
  id: string
  time: string // MM:SS format
  location: string // 'attacking-top', 'attacking-bottom', 'center', 'defending-top', 'defending-bottom'
  x: number // Percentage of rink width
  y: number // Percentage of rink height
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

export default function LogFaceoffsScreen() {
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
  const [isVideoMinimized, setIsVideoMinimized] = useState(false)
  const isDesktop = useIsDesktop()
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [faceoffs, setFaceoffs] = useState<Faceoff[]>([])
  const [showFaceoffSelector, setShowFaceoffSelector] = useState(false)
  const [pendingFaceoff, setPendingFaceoff] = useState<{ x: number; y: number; location: string } | null>(null)
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
  
  // Get team name from ID
  const teamName = selectedTeam ? (teams.find(t => t.id === selectedTeam)?.name || selectedTeam) : 'My Team'
  
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
  
  useEffect(() => {
    setActiveLogView('faceoffs')
    if (currentUser) {
      const assignment = logViewAssignments['faceoffs']
      if (!assignment) {
        setLogViewAssignment('faceoffs', currentUser.id, currentUser.name)
      }
    }
  }, [setActiveLogView, currentUser, logViewAssignments, setLogViewAssignment])

  // Load faceoffs from localStorage
  useEffect(() => {
    const savedFaceoffs = localStorage.getItem('faceoffs')
    if (savedFaceoffs) {
      try {
        setFaceoffs(JSON.parse(savedFaceoffs))
      } catch (e) {
        console.error('Error loading faceoffs:', e)
      }
    }
  }, [])

  // Save faceoffs to localStorage
  useEffect(() => {
    if (faceoffs.length > 0 || localStorage.getItem('faceoffs')) {
      localStorage.setItem('faceoffs', JSON.stringify(faceoffs))
    }
  }, [faceoffs])

  const getCurrentTime = (): string => {
    return `${String(clock.minutes).padStart(2, '0')}:${String(clock.seconds).padStart(2, '0')}`
  }

  const handleFaceoffClick = (x: number, y: number, location: string) => {
    setPendingFaceoff({ x, y, location })
    setShowFaceoffSelector(true)
  }

  const handleFaceoffSave = (team: 'myTeam' | 'opponent', player: Player | null, opponentJersey: string | null) => {
    if (!pendingFaceoff) return

    const faceoff: Faceoff = {
      id: `faceoff-${Date.now()}`,
      time: getCurrentTime(),
      location: pendingFaceoff.location,
      x: pendingFaceoff.x,
      y: pendingFaceoff.y,
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

    setFaceoffs([...faceoffs, faceoff])
    setPendingFaceoff(null)
    setShowFaceoffSelector(false)
  }

  const handleDeleteFaceoff = (faceoffId: string) => {
    setFaceoffs(faceoffs.filter(f => f.id !== faceoffId))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev === 0 ? 180 : 0))
  }

  const formatFaceoffDisplay = (faceoff: Faceoff): string => {
    const locationNames: Record<string, string> = {
      'attacking-top': 'Attacking Top',
      'attacking-bottom': 'Attacking Bottom',
      'center': 'Center',
      'defending-top': 'Defending Top',
      'defending-bottom': 'Defending Bottom',
    }
    
    const winningTeamName = faceoff.team === 'myTeam' ? teamName : (opponent || 'Opponent')
    const location = locationNames[faceoff.location] || faceoff.location
    
    let playerName = ''
    if (faceoff.player.type === 'player' && faceoff.player.firstName && faceoff.player.lastName) {
      playerName = `${faceoff.player.firstName[0]}. ${faceoff.player.lastName} (${faceoff.player.jerseyNumber})`
    } else if (faceoff.player.type === 'opponent' && faceoff.player.opponentJersey) {
      playerName = `#${faceoff.player.opponentJersey}`
    } else {
      playerName = 'Unknown Player'
    }
    
    return `${winningTeamName} @ ${faceoff.time} - ${location} - ${playerName}`
  }

  return (
    <div className="h-full bg-gradient-to-b from-background to-surface flex flex-col overflow-hidden w-full" style={{ overflowX: 'hidden', overflowY: 'hidden', height: '100%', maxHeight: '100%' }}>
      <div className="flex-1 overflow-hidden overflow-x-hidden w-full flex flex-col min-h-0">
        <div className="px-4 md:px-6 py-4 md:py-6 w-full flex flex-col flex-1 min-h-0">
          <div className="w-full max-w-full flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-text mb-2">Log Faceoffs</h1>
              <p className="text-textSecondary">Record faceoffs during the game</p>
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
                onFaceoffClick={handleFaceoffClick}
                rotation={rotation}
                mode="faceoffs"
                shots={[]}
              />
            </div>
            <p className="text-xs text-textSecondary mt-4 text-center flex-shrink-0">
              Click on the faceoff dots to log a faceoff
            </p>
          </div>

          {/* Faceoffs List */}
          <div className="bg-surface border border-border rounded-xl p-4 md:p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Recorded Faceoffs</h2>
            {faceoffs.length === 0 ? (
              <p className="text-textSecondary text-center py-8">No faceoffs recorded</p>
            ) : (
              <div className="space-y-2">
                {faceoffs.map((faceoff) => (
                  <div key={faceoff.id} className="flex items-center justify-between gap-3 p-3 bg-surfaceLight rounded-lg">
                    <div className="flex-1">
                      <p className="text-text text-sm">
                        {formatFaceoffDisplay(faceoff)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteFaceoff(faceoff.id)}
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

      {/* Faceoff Selector Modal */}
      {showFaceoffSelector && pendingFaceoff && (
        <FaceoffSelector
          onSave={handleFaceoffSave}
          onClose={() => {
            setShowFaceoffSelector(false)
            setPendingFaceoff(null)
          }}
          players={players}
          teamName={teamName}
          opponentName={opponent || 'Opponent'}
          faceoffType={pendingFaceoff.location}
        />
      )}
    </div>
  )
}

