'use client'

import React, { useEffect, useState } from 'react'
import { useGame } from '@/contexts/GameContext'
import GameClockDisplay from '@/components/GameClockDisplay'
import Calculator from '@/components/Calculator'
import JerseyNumberInput from '@/components/JerseyNumberInput'
import { useRouter } from 'next/navigation'
import { Player } from '@/components/PlayerContainer'
import { X, Edit2, Trash2, Plus } from 'lucide-react'
import { useAdminSettings } from '@/contexts/AdminSettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import GameVideoPlayer from '@/components/GameVideoPlayer'
import { useIsDesktop } from '@/hooks/useIsDesktop'

interface Goal {
  id: string
  team: 'myTeam' | 'opponent'
  time: string // MM:SS format
  scorer: {
    type: 'player' | 'unknown' | 'opponent'
    playerId?: string
    jerseyNumber?: number
    firstName?: string
    lastName?: string
    opponentJersey?: number
  }
  assists: Array<{
    playerId: string
    jerseyNumber: number
    firstName: string
    lastName: string
  }>
}

export default function LogGoalsScreen() {
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
  const [isVideoMinimized, setIsVideoMinimized] = useState(false)
  const isDesktop = useIsDesktop()
  
  const { useSupabase, selectedOrganizationId } = useAdminSettings()
  const { user } = useAuth()
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
  
  const [goals, setGoals] = useState<Goal[]>([])
  const [showAddGoalModal, setShowAddGoalModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [goalTime, setGoalTime] = useState('')
  const [showTimeCalculator, setShowTimeCalculator] = useState(false)
  const [selectedScorer, setSelectedScorer] = useState<Player | null>(null)
  const [selectedAssists, setSelectedAssists] = useState<Player[]>([])
  const [opponentJersey, setOpponentJersey] = useState('')
  const [showJerseyCalculator, setShowJerseyCalculator] = useState(false)
  const [isMyTeam, setIsMyTeam] = useState(true)
  const [isUnknownPlayer, setIsUnknownPlayer] = useState(true)

  useEffect(() => {
    setActiveLogView('goals')
    if (currentUser) {
      const assignment = logViewAssignments['goals']
      if (!assignment) {
        setLogViewAssignment('goals', currentUser.id, currentUser.name)
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

  // Load goals from localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem('goals')
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals))
    }
  }, [])

  // Save goals to localStorage
  useEffect(() => {
    if (goals.length > 0 || localStorage.getItem('goals')) {
      localStorage.setItem('goals', JSON.stringify(goals))
    }
  }, [goals])

  const formatTime = (minutes: number, seconds: number): string => {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const getCurrentTime = (): string => {
    return formatTime(clock.minutes, clock.seconds)
  }

  const openAddGoalModal = (team: 'myTeam' | 'opponent') => {
    setIsMyTeam(team === 'myTeam')
    setGoalTime(getCurrentTime())
    setSelectedScorer(null)
    setSelectedAssists([])
    setOpponentJersey('')
    setIsUnknownPlayer(true)
    setEditingGoal(null)
    setShowAddGoalModal(true)
  }

  const openEditGoalModal = (goal: Goal) => {
    setEditingGoal(goal)
    setIsMyTeam(goal.team === 'myTeam')
    setGoalTime(goal.time)
    if (goal.scorer.type === 'player' && goal.scorer.playerId) {
      const player = players.find(p => p.id === goal.scorer.playerId)
      setSelectedScorer(player || null)
      setIsUnknownPlayer(false)
    } else if (goal.scorer.type === 'opponent' && goal.scorer.opponentJersey) {
      setOpponentJersey(String(goal.scorer.opponentJersey))
      setIsUnknownPlayer(false)
    } else {
      setIsUnknownPlayer(true)
    }
    setSelectedAssists(goal.assists.map(a => {
      return players.find(p => p.id === a.playerId)!
    }).filter(Boolean))
    setShowAddGoalModal(true)
  }

  const handlePlayerClick = (player: Player) => {
    if (!isMyTeam) return // Opponent uses jersey number input
    
    if (!selectedScorer) {
      // First click = goal scorer
      setSelectedScorer(player)
      setIsUnknownPlayer(false)
    } else if (selectedAssists.length < 2 && !selectedAssists.find(a => a.id === player.id)) {
      // Second/third click = assists
      setSelectedAssists([...selectedAssists, player])
    }
  }

  const removeAssist = (playerId: string) => {
    setSelectedAssists(selectedAssists.filter(a => a.id !== playerId))
  }

  const handleSaveGoal = () => {
    if (isMyTeam && !selectedScorer && isUnknownPlayer) {
      // Can't save without a scorer for my team
      return
    }

    if (!isMyTeam && !opponentJersey && isUnknownPlayer) {
      // Can't save without jersey for opponent
      return
    }

    const goal: Goal = {
      id: editingGoal?.id || `goal-${Date.now()}`,
      team: isMyTeam ? 'myTeam' : 'opponent',
      time: goalTime,
      scorer: isMyTeam 
        ? (selectedScorer 
          ? {
              type: 'player',
              playerId: selectedScorer.id,
              jerseyNumber: selectedScorer.jerseyNumber,
              firstName: selectedScorer.firstName,
              lastName: selectedScorer.lastName
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
      assists: selectedAssists.map(a => ({
        playerId: a.id,
        jerseyNumber: a.jerseyNumber,
        firstName: a.firstName,
        lastName: a.lastName
      }))
    }

    if (editingGoal) {
      setGoals(goals.map(g => g.id === goal.id ? goal : g))
    } else {
      setGoals([...goals, goal])
    }

    setShowAddGoalModal(false)
    setEditingGoal(null)
    // Stop the game clock when logging
    stopClock()
  }

  const handleDeleteGoal = (goal: Goal) => {
    setGoals(goals.filter(g => g.id !== goal.id))
    setDeletingGoal(null)
  }

  const formatGoalDisplay = (goal: Goal): { team: string; time: string; scorer: string; assists: string } => {
    const displayTeamName = goal.team === 'myTeam' ? teamName : (opponent || 'Opponent')
    
    let scorer = ''
    if (goal.scorer.type === 'player' && goal.scorer.firstName && goal.scorer.lastName) {
      scorer = `${goal.scorer.firstName[0]}. ${goal.scorer.lastName} (${goal.scorer.jerseyNumber})`
    } else if (goal.scorer.type === 'opponent' && goal.scorer.opponentJersey) {
      scorer = `#${goal.scorer.opponentJersey}`
    } else {
      scorer = 'Unknown Player'
    }

    let assists = ''
    if (goal.assists.length > 0) {
      assists = goal.assists.map(a => `${a.firstName[0]}. ${a.lastName} (${a.jerseyNumber})`).join(', ')
    }

    return {
      team: teamName,
      time: goal.time,
      scorer,
      assists
    }
  }

  const myTeamGoals = goals.filter(g => g.team === 'myTeam').sort((a, b) => {
    const [aMin, aSec] = a.time.split(':').map(Number)
    const [bMin, bSec] = b.time.split(':').map(Number)
    return (bMin * 60 + bSec) - (aMin * 60 + aSec) // Most recent first
  })

  const opponentGoals = goals.filter(g => g.team === 'opponent').sort((a, b) => {
    const [aMin, aSec] = a.time.split(':').map(Number)
    const [bMin, bSec] = b.time.split(':').map(Number)
    return (bMin * 60 + bSec) - (aMin * 60 + aSec) // Most recent first
  })

  return (
    <div className="h-full bg-gradient-to-b from-background to-surface flex flex-col overflow-hidden w-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 overflow-hidden overflow-x-hidden w-full max-w-full">
        <div className="px-4 md:px-6 py-4 md:py-6 w-full overflow-x-hidden max-w-full">
          <div className="w-full max-w-full overflow-x-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-text mb-2">Log Goals</h1>
                <div className="flex items-center gap-2">
                  <p className="text-textSecondary">Record goals during the game</p>
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
          </div>
        </div>
      </div>

      {/* Scrollable Goals Containers - Stack vertically when in split view (on right side) */}
      <div className={`flex-1 overflow-hidden flex flex-col ${isDesktop && loggingMode === 'video' ? 'flex-col' : 'md:flex-row'} gap-4 px-4 md:px-6 pb-4`}>
        {/* My Team Goals */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-text">{teamName} Goals</h2>
            <button
              onClick={() => openAddGoalModal('myTeam')}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-text rounded-lg hover:bg-primaryDark transition-colors"
            >
              <Plus size={16} />
              <span className="text-sm font-semibold">Add Goal</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-surface border border-border rounded-xl p-4 space-y-2">
            {myTeamGoals.length === 0 ? (
              <p className="text-textSecondary text-center py-8">No goals recorded</p>
            ) : (
              myTeamGoals.map((goal) => {
                const display = formatGoalDisplay(goal)
                return (
                  <div key={goal.id} className="flex items-start justify-between gap-3 p-3 bg-surfaceLight rounded-lg">
                    <div className="flex-1">
                      <p className="text-text text-sm">
                        <span className="font-semibold">{display.team}</span> Goal @ {display.time} - <span className="font-bold">{display.scorer}</span>
                        {display.assists && <span> (assisted by {display.assists})</span>}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditGoalModal(goal)}
                        className="p-1.5 text-primary hover:bg-primary/20 rounded transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeletingGoal(goal)}
                        className="p-1.5 text-error hover:bg-error/20 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Opponent Goals */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-text">{opponent || 'Opponent'} Goals</h2>
            <button
              onClick={() => openAddGoalModal('opponent')}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-text rounded-lg hover:bg-primaryDark transition-colors"
            >
              <Plus size={16} />
              <span className="text-sm font-semibold">Add Goal</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-surface border border-border rounded-xl p-4 space-y-2">
            {opponentGoals.length === 0 ? (
              <p className="text-textSecondary text-center py-8">No goals recorded</p>
            ) : (
              opponentGoals.map((goal) => {
                const display = formatGoalDisplay(goal)
                return (
                  <div key={goal.id} className="flex items-start justify-between gap-3 p-3 bg-surfaceLight rounded-lg">
                    <div className="flex-1">
                      <p className="text-text text-sm">
                        <span className="font-semibold">{display.team}</span> Goal @ {display.time} - <span className="font-bold">{display.scorer}</span>
                        {display.assists && <span> (assisted by {display.assists})</span>}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditGoalModal(goal)}
                        className="p-1.5 text-primary hover:bg-primary/20 rounded transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeletingGoal(goal)}
                        className="p-1.5 text-error hover:bg-error/20 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Goal Modal */}
      {showAddGoalModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-text">
                {editingGoal ? 'Edit Goal' : 'Add Goal'}
              </h3>
              <button
                onClick={() => {
                  setShowAddGoalModal(false)
                  setEditingGoal(null)
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
                  {goalTime || '00:00'}
                </div>
                <p className="text-xs text-textSecondary text-center mt-1">Tap to edit</p>
              </div>
            </div>

            {/* Player Selection for My Team */}
            {isMyTeam ? (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-textSecondary mb-3">
                  Goal Scorer {selectedScorer && <span className="text-primary">✓</span>}
                </label>
                {isUnknownPlayer && !selectedScorer && (
                  <div className="mb-3 p-3 bg-warning/20 border border-warning rounded-lg">
                    <p className="text-sm text-textSecondary">Unknown Player (default)</p>
                  </div>
                )}
                {selectedScorer && (
                  <div className="mb-3 p-3 bg-primary/20 border border-primary rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-text">
                        {selectedScorer.firstName[0]}. {selectedScorer.lastName} (#{selectedScorer.jerseyNumber})
                      </p>
                      <p className="text-xs text-textSecondary">Goal Scorer</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedScorer(null)
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
                        selectedScorer?.id === player.id
                          ? 'bg-primary/30 border-primary'
                          : selectedAssists.find(a => a.id === player.id)
                          ? 'bg-success/20 border-success'
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

                {/* Assists */}
                {selectedAssists.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-textSecondary mb-2">
                      Assists ({selectedAssists.length}/2)
                    </label>
                    <div className="space-y-2">
                      {selectedAssists.map((assist) => (
                        <div key={assist.id} className="p-2 bg-success/20 border border-success rounded-lg flex items-center justify-between">
                          <span className="text-sm text-text">
                            {assist.firstName[0]}. {assist.lastName} (#{assist.jerseyNumber})
                          </span>
                          <button
                            onClick={() => removeAssist(assist.id)}
                            className="text-error hover:text-error/80"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveGoal}
                className="flex-1 bg-primary border border-primary rounded-xl p-3 text-text font-semibold hover:bg-primaryDark transition-colors"
              >
                {editingGoal ? 'Update' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setShowAddGoalModal(false)
                  setEditingGoal(null)
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
          value={goalTime.replace(':', '')}
          onChange={(val) => {
            // Always format with colon, even for partial input
            if (val === '') {
              setGoalTime('00:00')
            } else {
              // Pad to 4 digits, then format as MM:SS
              const padded = val.padStart(4, '0')
              const minutes = padded.slice(0, -2).padStart(2, '0')
              const seconds = padded.slice(-2).padStart(2, '0')
              setGoalTime(`${minutes}:${seconds}`)
            }
          }}
          onClose={() => setShowTimeCalculator(false)}
          title="Enter Goal Time"
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
      {deletingGoal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-text mb-4">Delete Goal?</h3>
            <p className="text-textSecondary mb-6">
              Are you sure you would like to delete this goal? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteGoal(deletingGoal)}
                className="flex-1 bg-error border border-error rounded-xl p-3 text-text font-semibold hover:bg-error/90 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeletingGoal(null)}
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
