'use client'

import React, { useEffect, useState } from 'react'
import { useGame } from '@/contexts/GameContext'
import GameClockDisplay from '@/components/GameClockDisplay'
import Calculator from '@/components/Calculator'
import PenaltyTimeCalculator from '@/components/PenaltyTimeCalculator'
import JerseyNumberInput from '@/components/JerseyNumberInput'
import { useRouter } from 'next/navigation'
import { Player } from '@/components/PlayerContainer'
import { X, Edit2, Trash2, Plus } from 'lucide-react'
import { useAdminSettings } from '@/contexts/AdminSettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import GameVideoPlayer from '@/components/GameVideoPlayer'
import { useIsDesktop } from '@/hooks/useIsDesktop'

interface Penalty {
  id: string
  team: 'myTeam' | 'opponent'
  time: string // MM:SS format
  player: {
    type: 'player' | 'unknown' | 'opponent'
    playerId?: string
    jerseyNumber?: number
    firstName?: string
    lastName?: string
    opponentJersey?: number
  }
  penaltyType: string
  penaltyMinutes: number
  penaltySeconds: number
  isOffSetting: boolean
}

const PENALTY_TYPES = [
  'Unknown Penalty',
  'Boarding',
  'Charging',
  'Cross-Checking',
  'Delay of Game',
  'Elbowing',
  'Fighting',
  'High-Sticking',
  'Holding',
  'Hooking',
  'Interference',
  'Kneeing',
  'Roughing',
  'Slashing',
  'Spearing',
  'Tripping',
  'Unsportsmanlike Conduct',
  'Too Many Men',
  'Misconduct',
  'Game Misconduct',
].sort()

export default function LogPenaltiesScreen() {
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
    selectedTeam,
    selectedSeason,
    opponent,
    loggingMode,
    gameVideoId,
    gameDate,
    stopClock
  } = useGame()
  
  const { useSupabase, selectedOrganizationId } = useAdminSettings()
  const { user } = useAuth()
  const [isVideoMinimized, setIsVideoMinimized] = useState(false)
  const isDesktop = useIsDesktop()
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])
  
  // Load teams to get team name
  useEffect(() => {
    const loadTeams = async () => {
      if (useSupabase && selectedOrganizationId && selectedTeam) {
        try {
          const { getTeams } = await import('@/lib/supabase/queries')
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
  
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [showAddPenaltyModal, setShowAddPenaltyModal] = useState(false)
  const [editingPenalty, setEditingPenalty] = useState<Penalty | null>(null)
  const [deletingPenalty, setDeletingPenalty] = useState<Penalty | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [penaltyTime, setPenaltyTime] = useState('')
  const [showTimeCalculator, setShowTimeCalculator] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [opponentJersey, setOpponentJersey] = useState('')
  const [showJerseyCalculator, setShowJerseyCalculator] = useState(false)
  const [isMyTeam, setIsMyTeam] = useState(true)
  const [isUnknownPlayer, setIsUnknownPlayer] = useState(true)
  const [penaltyType, setPenaltyType] = useState('Unknown Penalty')
  const [penaltyMinutes, setPenaltyMinutes] = useState(2)
  const [penaltySeconds, setPenaltySeconds] = useState(0)
  const [showPenaltyTimeCalculator, setShowPenaltyTimeCalculator] = useState(false)
  const [isOffSetting, setIsOffSetting] = useState(false)

  useEffect(() => {
    setActiveLogView('penalties')
    if (currentUser) {
      const assignment = logViewAssignments['penalties']
      if (!assignment) {
        setLogViewAssignment('penalties', currentUser.id, currentUser.name)
      }
    }
  }, [setActiveLogView, currentUser, logViewAssignments, setLogViewAssignment])

  // Load players from Supabase
  useEffect(() => {
    const loadPlayers = async () => {
      if (useSupabase && selectedOrganizationId && selectedTeam && selectedSeason) {
        try {
          const { getPersonsWithRosters } = await import('@/lib/supabase/queries')
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

          setPlayers(filteredPlayers)
        } catch (error) {
          console.error('Error loading players:', error)
          setPlayers([])
        }
      } else {
        setPlayers([])
      }
    }
    
    loadPlayers()
  }, [useSupabase, selectedOrganizationId, selectedTeam, selectedSeason])

  // Load penalties from localStorage
  useEffect(() => {
    const savedPenalties = localStorage.getItem('penalties')
    if (savedPenalties) {
      setPenalties(JSON.parse(savedPenalties))
    }
  }, [])

  // Save penalties to localStorage
  useEffect(() => {
    if (penalties.length > 0 || localStorage.getItem('penalties')) {
      localStorage.setItem('penalties', JSON.stringify(penalties))
    }
  }, [penalties])

  const formatTime = (minutes: number, seconds: number): string => {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const getCurrentTime = (): string => {
    return formatTime(clock.minutes, clock.seconds)
  }

  const openAddPenaltyModal = (team: 'myTeam' | 'opponent') => {
    setIsMyTeam(team === 'myTeam')
    setPenaltyTime(getCurrentTime())
    setSelectedPlayer(null)
    setOpponentJersey('')
    setIsUnknownPlayer(true)
    setPenaltyType('Unknown Penalty')
    setPenaltyMinutes(2)
    setPenaltySeconds(0)
    setIsOffSetting(false)
    setEditingPenalty(null)
    setShowAddPenaltyModal(true)
  }

  const openEditPenaltyModal = (penalty: Penalty) => {
    setEditingPenalty(penalty)
    setIsMyTeam(penalty.team === 'myTeam')
    setPenaltyTime(penalty.time)
    setPenaltyType(penalty.penaltyType)
    setPenaltyMinutes(penalty.penaltyMinutes)
    setPenaltySeconds(penalty.penaltySeconds)
    setIsOffSetting(penalty.isOffSetting)
    
    if (penalty.player.type === 'player' && penalty.player.playerId) {
      const player = players.find(p => p.id === penalty.player.playerId)
      setSelectedPlayer(player || null)
      setIsUnknownPlayer(false)
    } else if (penalty.player.type === 'opponent' && penalty.player.opponentJersey) {
      setOpponentJersey(String(penalty.player.opponentJersey))
      setIsUnknownPlayer(false)
    } else {
      setIsUnknownPlayer(true)
    }
    setShowAddPenaltyModal(true)
  }

  const handlePlayerClick = (player: Player) => {
    if (!isMyTeam) return // Opponent uses jersey number input
    setSelectedPlayer(player)
    setIsUnknownPlayer(false)
  }

  const handleSavePenalty = () => {
    const penalty: Penalty = {
      id: editingPenalty?.id || `penalty-${Date.now()}`,
      team: isMyTeam ? 'myTeam' : 'opponent',
      time: penaltyTime,
      player: isMyTeam 
        ? (selectedPlayer 
          ? {
              type: 'player',
              playerId: selectedPlayer.id,
              jerseyNumber: selectedPlayer.jerseyNumber,
              firstName: selectedPlayer.firstName,
              lastName: selectedPlayer.lastName
            }
          : {
              type: 'unknown'
            })
        : (opponentJersey
          ? {
              type: 'opponent',
              opponentJersey: parseInt(opponentJersey)
            }
          : {
              type: 'unknown'
            }),
      penaltyType: penaltyType,
      penaltyMinutes: penaltyMinutes,
      penaltySeconds: penaltySeconds,
      isOffSetting: isOffSetting
    }

    if (editingPenalty) {
      setPenalties(penalties.map(p => p.id === penalty.id ? penalty : p))
    } else {
      setPenalties([...penalties, penalty])
    }

    setShowAddPenaltyModal(false)
    setEditingPenalty(null)
    // Stop the game clock when logging
    stopClock()
  }

  const handleDeletePenalty = (penalty: Penalty) => {
    setPenalties(penalties.filter(p => p.id !== penalty.id))
    setDeletingPenalty(null)
  }

  const formatPenaltyDisplay = (penalty: Penalty): string => {
    const displayTeamName = penalty.team === 'myTeam' ? teamName : (opponent || 'Opponent')
    let display = `${displayTeamName} Penalty @ ${penalty.time} - `
    
    if (penalty.player.type === 'player' && penalty.player.firstName && penalty.player.lastName) {
      display += `${penalty.player.firstName[0]}. ${penalty.player.lastName} (${penalty.player.jerseyNumber})`
    } else if (penalty.player.type === 'opponent' && penalty.player.opponentJersey) {
      display += `#${penalty.player.opponentJersey}`
    } else {
      display += 'Unknown Player'
    }

    display += ` - ${penalty.penaltyType} (${formatTime(penalty.penaltyMinutes, penalty.penaltySeconds)})`
    
    if (penalty.isOffSetting) {
      display += ' [Off-Setting]'
    }

    return display
  }

  const myTeamPenalties = penalties.filter(p => p.team === 'myTeam').sort((a, b) => {
    const [aMin, aSec] = a.time.split(':').map(Number)
    const [bMin, bSec] = b.time.split(':').map(Number)
    return (bMin * 60 + bSec) - (aMin * 60 + aSec) // Most recent first
  })

  const opponentPenalties = penalties.filter(p => p.team === 'opponent').sort((a, b) => {
    const [aMin, aSec] = a.time.split(':').map(Number)
    const [bMin, bSec] = b.time.split(':').map(Number)
    return (bMin * 60 + bSec) - (aMin * 60 + bSec) // Most recent first
  })

  return (
    <div className="h-full bg-gradient-to-b from-background to-surface flex flex-col overflow-hidden w-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 overflow-hidden overflow-x-hidden w-full max-w-full">
        <div className="px-4 md:px-6 py-4 md:py-6 w-full overflow-x-hidden max-w-full">
          <div className="w-full max-w-full overflow-x-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-text mb-2">Log Penalties</h1>
                  {user && (
                    <p className="text-xs text-textSecondary">
                      Welcome, <span className="text-text font-medium">{user.name}</span>
                    </p>
                  )}
                </div>
                <p className="text-textSecondary">Record penalties during the game</p>
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
          </div>
        </div>
      </div>

      {/* Scrollable Penalties Containers - Stack vertically when in split view (on right side) */}
      <div className={`flex-1 overflow-hidden flex flex-col ${isDesktop && loggingMode === 'video' ? 'flex-col' : 'md:flex-row'} gap-4 px-4 md:px-6 pb-4`}>
        {/* My Team Penalties */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-text">{teamName} Penalties</h2>
            <button
              onClick={() => openAddPenaltyModal('myTeam')}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-text rounded-lg hover:bg-primaryDark transition-colors"
            >
              <Plus size={16} />
              <span className="text-sm font-semibold">Add Penalty</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-surface border border-border rounded-xl p-4 space-y-2">
            {myTeamPenalties.length === 0 ? (
              <p className="text-textSecondary text-center py-8">No penalties recorded</p>
            ) : (
              myTeamPenalties.map((penalty) => (
                <div key={penalty.id} className="flex items-start justify-between gap-3 p-3 bg-surfaceLight rounded-lg">
                  <div className="flex-1">
                    <p className="text-text text-sm">{formatPenaltyDisplay(penalty)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditPenaltyModal(penalty)}
                      className="p-1.5 text-primary hover:bg-primary/20 rounded transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingPenalty(penalty)}
                      className="p-1.5 text-error hover:bg-error/20 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Opponent Penalties */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-text">{opponent || 'Opponent'} Penalties</h2>
            <button
              onClick={() => openAddPenaltyModal('opponent')}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-text rounded-lg hover:bg-primaryDark transition-colors"
            >
              <Plus size={16} />
              <span className="text-sm font-semibold">Add Penalty</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-surface border border-border rounded-xl p-4 space-y-2">
            {opponentPenalties.length === 0 ? (
              <p className="text-textSecondary text-center py-8">No penalties recorded</p>
            ) : (
              opponentPenalties.map((penalty) => (
                <div key={penalty.id} className="flex items-start justify-between gap-3 p-3 bg-surfaceLight rounded-lg">
                  <div className="flex-1">
                    <p className="text-text text-sm">{formatPenaltyDisplay(penalty)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditPenaltyModal(penalty)}
                      className="p-1.5 text-primary hover:bg-primary/20 rounded transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingPenalty(penalty)}
                      className="p-1.5 text-error hover:bg-error/20 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Penalty Modal */}
      {showAddPenaltyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-text">
                {editingPenalty ? 'Edit Penalty' : 'Add Penalty'}
              </h3>
              <button
                onClick={() => {
                  setShowAddPenaltyModal(false)
                  setEditingPenalty(null)
                }}
                className="text-textSecondary hover:text-text"
              >
                <X size={24} />
              </button>
            </div>

            {/* Game Clock */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-textSecondary mb-2">Game Clock</label>
              <div
                onClick={() => setShowTimeCalculator(true)}
                className="bg-background border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors"
              >
                <div className="text-2xl font-mono font-bold text-white text-center">
                  {penaltyTime || '00:00'}
                </div>
                <p className="text-xs text-textSecondary text-center mt-1">Tap to edit</p>
              </div>
            </div>

            {/* Player Selection for My Team */}
            {isMyTeam ? (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-textSecondary mb-3">
                  Player {selectedPlayer && <span className="text-primary">✓</span>}
                </label>
                {isUnknownPlayer && !selectedPlayer && (
                  <div className="mb-3 p-3 bg-warning/20 border border-warning rounded-lg">
                    <p className="text-sm text-textSecondary">Unknown Player (default)</p>
                  </div>
                )}
                {selectedPlayer && (
                  <div className="mb-3 p-3 bg-primary/20 border border-primary rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-text">
                        {selectedPlayer.firstName[0]}. {selectedPlayer.lastName} (#{selectedPlayer.jerseyNumber})
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPlayer(null)
                        setIsUnknownPlayer(true)
                      }}
                      className="text-error hover:text-error/80"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-4 md:grid-cols-6 gap-3 max-h-48 overflow-y-auto p-2 bg-surfaceLight rounded-lg">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => handlePlayerClick(player)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                        selectedPlayer?.id === player.id
                          ? 'bg-primary/30 border-primary'
                          : 'bg-surface border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-lg font-bold text-text">{player.jerseyNumber}</div>
                      <div className="text-xs text-textSecondary truncate">
                        {player.firstName[0]}. {player.lastName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Opponent Jersey Input */
              <div className="mb-6">
                <label className="block text-sm font-semibold text-textSecondary mb-2">
                  Opponent Jersey Number
                </label>
                {isUnknownPlayer && !opponentJersey && (
                  <div className="mb-3 p-3 bg-warning/20 border border-warning rounded-lg">
                    <p className="text-sm text-textSecondary">Unknown Player (default)</p>
                  </div>
                )}
                <div
                  onClick={() => setShowJerseyCalculator(true)}
                  className="bg-background border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors"
                >
                  <div className="text-4xl font-mono font-bold text-primary text-center">
                    {opponentJersey ? opponentJersey.padStart(2, '0') : '00'}
                  </div>
                  <p className="text-xs text-textSecondary text-center mt-1">Tap to edit</p>
                </div>
              </div>
            )}

            {/* Penalty Type */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-textSecondary mb-2">Penalty Type</label>
              <select
                value={penaltyType}
                onChange={(e) => setPenaltyType(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
              >
                {PENALTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Total Penalty Time */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-textSecondary mb-2">Total Penalty Time</label>
              <div
                onClick={() => setShowPenaltyTimeCalculator(true)}
                className="bg-background border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors"
              >
                <div className="text-2xl font-mono font-bold text-primary text-center">
                  {formatTime(penaltyMinutes, penaltySeconds)}
                </div>
                <p className="text-xs text-textSecondary text-center mt-1">Tap to edit</p>
              </div>
            </div>

            {/* Off-Setting Penalty Checkbox */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOffSetting}
                  onChange={(e) => setIsOffSetting(e.target.checked)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-text font-semibold">Off-Setting Penalty</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSavePenalty}
                className="flex-1 bg-primary border border-primary rounded-xl p-3 text-text font-semibold hover:bg-primaryDark transition-colors"
              >
                {editingPenalty ? 'Update' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setShowAddPenaltyModal(false)
                  setEditingPenalty(null)
                }}
                className="flex-1 bg-surface border border-border rounded-xl p-3 text-textSecondary font-semibold hover:bg-surfaceLight transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Calculator */}
      {showTimeCalculator && (
        <Calculator
          value={penaltyTime.replace(':', '')}
          onChange={(val) => {
            // Always format with colon, even for partial input
            if (val === '') {
              setPenaltyTime('00:00')
            } else {
              // Pad to 4 digits, then format as MM:SS
              const padded = val.padStart(4, '0')
              const minutes = padded.slice(0, -2).padStart(2, '0')
              const seconds = padded.slice(-2).padStart(2, '0')
              setPenaltyTime(`${minutes}:${seconds}`)
            }
          }}
          onClose={() => setShowTimeCalculator(false)}
          title="Enter Game Clock Time"
        />
      )}

      {/* Penalty Time Calculator */}
      {showPenaltyTimeCalculator && (
        <PenaltyTimeCalculator
          minutes={penaltyMinutes}
          seconds={penaltySeconds}
          onChange={(mins, secs) => {
            setPenaltyMinutes(mins)
            setPenaltySeconds(secs)
          }}
          onClose={() => setShowPenaltyTimeCalculator(false)}
          title="Enter Penalty Duration"
        />
      )}

      {/* Jersey Number Calculator */}
      {showJerseyCalculator && (
        <JerseyNumberInput
          value={opponentJersey}
          onChange={(val) => {
            setOpponentJersey(val)
            setIsUnknownPlayer(val === '')
          }}
          onClose={() => setShowJerseyCalculator(false)}
          title="Enter Opponent Jersey Number"
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingPenalty && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-text mb-4">Delete Penalty?</h3>
            <p className="text-textSecondary mb-6">
              Are you sure you would like to delete this penalty? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeletePenalty(deletingPenalty)}
                className="flex-1 bg-error border border-error rounded-xl p-3 text-text font-semibold hover:bg-error/90 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeletingPenalty(null)}
                className="flex-1 bg-surface border border-border rounded-xl p-3 text-textSecondary font-semibold hover:bg-surfaceLight transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
