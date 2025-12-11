'use client'

import React, { useState, useEffect } from 'react'
import { useGame } from '@/contexts/GameContext'
import Calculator from '@/components/Calculator'
import { useRouter } from 'next/navigation'
import { Play, Pause } from 'lucide-react'
import { useAdminSettings } from '@/contexts/AdminSettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import GameVideoPlayer from '@/components/GameVideoPlayer'
import { useIsDesktop } from '@/hooks/useIsDesktop'

export default function LogClockScreen() {
  const router = useRouter()
  const { clock, startClock, stopClock, updateClock, setPeriod, myTeamScore, opponentScore, selectedTeam, opponent, setActiveLogView, currentUser, logViewAssignments, setLogViewAssignment, setSelectedGame, setSelectedTeam, setSelectedSeason, setLoggingMode, setSelectedLogItems, loggingMode, gameVideoId, gameDate } = useGame()
  const { useSupabase, selectedOrganizationId } = useAdminSettings()
  const { user } = useAuth()
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])
  const [isVideoMinimized, setIsVideoMinimized] = useState(false)
  const isDesktop = useIsDesktop()
  
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
  
  useEffect(() => {
    setActiveLogView('clock')
    if (currentUser) {
      const assignment = logViewAssignments['clock']
      if (!assignment) {
        setLogViewAssignment('clock', currentUser.id, currentUser.name)
      }
    }
  }, [setActiveLogView, currentUser, logViewAssignments, setLogViewAssignment])
  const [showCalculator, setShowCalculator] = useState(false)
  const [tempTime, setTempTime] = useState('')

  const handleClockClick = () => {
    setTempTime(`${String(clock.minutes).padStart(2, '0')}${String(clock.seconds).padStart(2, '0')}`)
    setShowCalculator(true)
  }

  const handleCalculatorDone = () => {
    if (tempTime.length >= 3) {
      const minutes = parseInt(tempTime.slice(0, -2)) || 0
      const seconds = parseInt(tempTime.slice(-2)) || 0
      if (minutes >= 0 && minutes <= 20 && seconds >= 0 && seconds < 60) {
        updateClock(minutes, seconds)
      }
    } else if (tempTime.length === 2) {
      const seconds = parseInt(tempTime) || 0
      if (seconds < 60) {
        updateClock(0, seconds)
      }
    } else if (tempTime.length === 1) {
      const seconds = parseInt(tempTime) || 0
      if (seconds < 60) {
        updateClock(0, seconds)
      }
    }
    setShowCalculator(false)
    setTempTime('')
  }

  const handlePeriodChange = (delta: number) => {
    const newPeriod = Math.max(1, Math.min(5, clock.period + delta))
    setPeriod(newPeriod)
  }

  return (
    <div className="h-full bg-gradient-to-b from-background to-surface flex flex-col overflow-hidden w-full" style={{ overflowX: 'hidden', overflowY: 'hidden', height: '100%', maxHeight: '100%' }}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="px-4 md:px-6 py-4 md:py-6 w-full">
          <div className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-text mb-2">Log Clock</h1>
              <div className="flex items-center gap-2">
                <p className="text-textSecondary">Master game clock control</p>
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

          {/* Video Player - Only show on mobile when in video mode (desktop shows in split view) */}
          {loggingMode === 'video' && !isDesktop && (
            <div className="mb-6">
              {gameVideoId ? (
                <GameVideoPlayer
                  videoId={gameVideoId}
                  isMinimized={isVideoMinimized}
                  onToggleMinimize={() => setIsVideoMinimized(!isVideoMinimized)}
                  gameDate={gameDate}
                  teamName={teamName}
                  opponent={opponent}
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

          {/* Clock Display - Master Clock (Hide when in video mode) */}
          {loggingMode !== 'video' && (
            <div className="bg-gradient-to-br from-surface to-surfaceLight border-2 border-primary rounded-2xl p-8 mb-6">
            <div className="flex items-center gap-4">
              {/* My Team Score - Fixed width for equal spacing */}
              <div className="text-center flex-shrink-0" style={{ width: '140px', minWidth: '140px' }}>
                <div className="text-sm text-textSecondary mb-1 truncate" title={teamName}>
                  {teamName && teamName.length > 14 ? teamName.substring(0, 11) + '...' : teamName}
                </div>
                <div className="text-4xl font-bold text-primary">
                  {myTeamScore}
                </div>
              </div>

              {/* Clock */}
              <div className="flex-1 text-center">
                {/* Period Display */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <button
                    onClick={() => handlePeriodChange(-1)}
                    className="bg-surface border border-border rounded-lg px-4 py-2 text-text hover:bg-surfaceLight transition-colors"
                  >
                    −
                  </button>
                  <div className="text-center">
                    <div className="text-sm text-textSecondary mb-1">Period</div>
                    <div className="text-3xl font-bold text-text">{clock.period}</div>
                  </div>
                  <button
                    onClick={() => handlePeriodChange(1)}
                    className="bg-surface border border-border rounded-lg px-4 py-2 text-text hover:bg-surfaceLight transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Time Display */}
                <div
                  onClick={handleClockClick}
                  className="cursor-pointer mb-6 hover:scale-105 transition-transform"
                >
                  <div className="text-7xl md:text-8xl font-mono font-bold text-white mb-2">
                    {String(clock.minutes).padStart(2, '0')}:{String(clock.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-sm text-textSecondary">Tap to edit</div>
                </div>

                {/* Control Buttons - No Lock/Unlock */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={clock.isRunning ? stopClock : startClock}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
                      clock.isRunning
                        ? 'bg-error border border-error text-text hover:bg-error/90'
                        : 'bg-success border border-success text-text hover:bg-success/90'
                    }`}
                  >
                    {clock.isRunning ? (
                      <>
                        <Pause size={20} />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play size={20} />
                        Start
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Opponent Score - Fixed width for equal spacing */}
              <div className="text-center flex-shrink-0" style={{ width: '140px', minWidth: '140px' }}>
                <div className="text-sm text-textSecondary mb-1 truncate" title={opponent || 'Opponent'}>
                  {opponent && opponent.length > 14 ? opponent.substring(0, 11) + '...' : (opponent || 'Opponent')}
                </div>
                <div className="text-4xl font-bold text-primary">
                  {opponentScore}
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Status Info */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="text-sm text-textSecondary space-y-2">
              <div className="flex items-center justify-between">
                <span>Clock Status:</span>
                <span className={`font-semibold ${clock.isRunning ? 'text-success' : 'text-textMuted'}`}>
                  {clock.isRunning ? 'Running' : 'Stopped'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Control:</span>
                <span className="font-semibold text-success">
                  Master Clock (Always Active)
                </span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Calculator Modal */}
      {showCalculator && (
        <Calculator
          value={tempTime}
          onChange={setTempTime}
          onClose={handleCalculatorDone}
          title="Set Game Clock"
        />
      )}
    </div>
  )
}
