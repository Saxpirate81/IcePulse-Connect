'use client'

import LogViewNavigator from '@/components/LogViewNavigator'
import TakeOverRequestHandler from '@/components/TakeOverRequestHandler'
import ResizableSplitView from '@/components/ResizableSplitView'
import { useGame } from '@/contexts/GameContext'
import GameVideoPlayer from '@/components/GameVideoPlayer'
import { useState, useEffect } from 'react'
import { useAdminSettings } from '@/contexts/AdminSettingsContext'
import { getTeams, getGames } from '@/lib/supabase/queries'
import { Play, Pause } from 'lucide-react'
import Calculator from '@/components/Calculator'

export default function LogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { 
    loggingMode, 
    gameVideoId,
    setGameVideoId,
    gameDate, 
    opponent, 
    selectedTeam,
    selectedGame,
    selectedSeason,
    clock,
    startClock,
    stopClock,
    updateClock,
    setPeriod,
    myTeamScore,
    opponentScore
  } = useGame()
  const { useSupabase, selectedOrganizationId } = useAdminSettings()
  const [isVideoMinimized, setIsVideoMinimized] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [teamName, setTeamName] = useState<string | null>(null)
  const [showCalculator, setShowCalculator] = useState(false)
  const [tempTime, setTempTime] = useState('')

  // Check window size
  useEffect(() => {
    const checkSize = () => {
      setIsDesktop(window.innerWidth >= 768)
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  // Load team name
  useEffect(() => {
    const loadTeamName = async () => {
      if (useSupabase && selectedOrganizationId && selectedTeam) {
        try {
          const teamsData = await getTeams(selectedOrganizationId)
          const team = teamsData.find((t: any) => t.id === selectedTeam)
          setTeamName(team?.name || null)
        } catch (error) {
          console.error('Error loading team name:', error)
        }
      }
    }
    loadTeamName()
  }, [useSupabase, selectedOrganizationId, selectedTeam])

  // Load gameVideoId when in video mode and game is selected
  useEffect(() => {
    const loadGameVideoId = async () => {
      if (loggingMode === 'video' && selectedGame && selectedTeam && selectedSeason) {
        console.log('=== LogLayout: Loading gameVideoId ===')
        console.log('loggingMode:', loggingMode)
        console.log('selectedGame:', selectedGame)
        console.log('selectedTeam:', selectedTeam)
        console.log('selectedSeason:', selectedSeason)
        console.log('current gameVideoId:', gameVideoId)
        
        if (!gameVideoId && useSupabase && selectedOrganizationId) {
          try {
            console.log('Fetching games from database...')
            const gamesData = await getGames(selectedTeam, selectedSeason, selectedOrganizationId)
            console.log('Games data:', gamesData)
            const game = gamesData.find((g: any) => g.id === selectedGame)
            console.log('Found game:', game)
            if (game && game.youtube_video_id) {
              console.log('Setting gameVideoId to:', game.youtube_video_id)
              setGameVideoId(game.youtube_video_id)
            } else {
              console.log('No video ID found for selected game')
            }
          } catch (error) {
            console.error('Error loading game video ID:', error)
          }
        } else if (gameVideoId) {
          console.log('gameVideoId already set:', gameVideoId)
        }
      }
    }
    loadGameVideoId()
  }, [loggingMode, selectedGame, selectedTeam, selectedSeason, gameVideoId, useSupabase, selectedOrganizationId, setGameVideoId])

  // Show split view when in video mode on desktop
  // Video on left, logger views on right
  const showSplitView = isDesktop && loggingMode === 'video'

  // Master clock handlers
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

  // Debug logging
  useEffect(() => {
    console.log('=== LogLayout Debug ===')
    console.log('isDesktop:', isDesktop)
    console.log('loggingMode:', loggingMode)
    console.log('gameVideoId:', gameVideoId)
    console.log('showSplitView:', showSplitView)
    console.log('windowWidth:', typeof window !== 'undefined' ? window.innerWidth : 0)
    console.log('gameDate:', gameDate)
    console.log('opponent:', opponent)
    console.log('selectedTeam:', selectedTeam)
    console.log('teamName:', teamName)
    console.log('localStorage loggingMode:', typeof window !== 'undefined' ? localStorage.getItem('loggingMode') : 'N/A')
    console.log('======================')
  }, [isDesktop, loggingMode, gameVideoId, showSplitView])

  if (showSplitView) {
    return (
      <div className="h-full flex flex-col overflow-hidden w-full" style={{ overflowX: 'hidden', overflowY: 'hidden', height: '100%', maxHeight: '100%' }}>
        <ResizableSplitView
          leftPanel={
            <div className="h-full flex flex-col overflow-hidden bg-gradient-to-b from-background to-surface">
              {/* Master Clock - Always above video, compact size */}
              <div className="flex-shrink-0 p-2">
                <div className="bg-gradient-to-br from-surface to-surfaceLight border-2 border-primary rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    {/* My Team Score */}
                    <div className="text-center flex-shrink-0" style={{ width: '100px', minWidth: '100px' }}>
                      <div className="text-xs text-textSecondary mb-1 truncate" title={teamName || 'My Team'}>
                        {teamName && teamName.length > 12 ? teamName.substring(0, 9) + '...' : (teamName || 'My Team')}
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {myTeamScore}
                      </div>
                    </div>

                    {/* Clock */}
                    <div className="flex-1 text-center">
                      {/* Period */}
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <button
                          onClick={() => handlePeriodChange(-1)}
                          className="bg-surface border border-border rounded px-2 py-1 text-xs text-text hover:bg-surfaceLight transition-colors"
                        >
                          −
                        </button>
                        <div className="text-center">
                          <div className="text-xs text-textSecondary">Period</div>
                          <div className="text-lg font-bold text-text">{clock.period}</div>
                        </div>
                        <button
                          onClick={() => handlePeriodChange(1)}
                          className="bg-surface border border-border rounded px-2 py-1 text-xs text-text hover:bg-surfaceLight transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Time Display */}
                      <div
                        onClick={handleClockClick}
                        className="cursor-pointer mb-2 hover:scale-105 transition-transform"
                      >
                        <div className="text-3xl font-bold text-text">
                          {String(clock.minutes).padStart(2, '0')}:{String(clock.seconds).padStart(2, '0')}
                        </div>
                      </div>

                      {/* Play/Pause Button */}
                      <button
                        onClick={clock.isRunning ? stopClock : startClock}
                        className="bg-primary text-text rounded-lg px-4 py-1.5 hover:bg-primaryDark transition-colors flex items-center gap-2 mx-auto"
                      >
                        {clock.isRunning ? (
                          <>
                            <Pause size={16} />
                            <span className="text-sm font-semibold">Pause</span>
                          </>
                        ) : (
                          <>
                            <Play size={16} />
                            <span className="text-sm font-semibold">Start</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Opponent Score */}
                    <div className="text-center flex-shrink-0" style={{ width: '100px', minWidth: '100px' }}>
                      <div className="text-xs text-textSecondary mb-1 truncate" title={opponent || 'Opponent'}>
                        {opponent && opponent.length > 12 ? opponent.substring(0, 9) + '...' : (opponent || 'Opponent')}
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {opponentScore}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Video Player - Takes remaining space, ensures video fits */}
              <div className="flex-1 overflow-hidden p-2 flex flex-col min-h-0">
                <div className="h-full w-full min-h-0 flex items-center justify-center">
                  <GameVideoPlayer
                    videoId={gameVideoId || ''}
                    isMinimized={false}
                    onToggleMinimize={() => setIsVideoMinimized(!isVideoMinimized)}
                    gameDate={gameDate || undefined}
                    teamName={teamName || undefined}
                    opponent={opponent || undefined}
                    showGameClock={false} // Clock is shown above, not in player
                  />
                </div>
              </div>
            </div>
          }
          rightPanelHeader={<LogViewNavigator />}
          rightPanel={
            <div className="h-full overflow-hidden flex flex-col">
              {children}
            </div>
          }
          defaultLeftWidth={60}
          minLeftWidth={40}
          maxLeftWidth={80}
          minRightWidth={20}
        />
        <TakeOverRequestHandler />
        {/* Calculator Modal for Clock */}
        {showCalculator && (
          <Calculator
            value={tempTime}
            onChange={setTempTime}
            onClose={handleCalculatorDone}
            title="Set Game Time"
          />
        )}
      </div>
    )
  }

  // Mobile or non-video mode: stacked layout
  return (
    <div className="h-full flex flex-col overflow-hidden w-full" style={{ overflowX: 'hidden', overflowY: 'hidden', height: '100%', maxHeight: '100%' }}>
      <LogViewNavigator />
      <div className="flex-1 overflow-hidden flex flex-col w-full" style={{ overflowX: 'hidden', overflowY: 'hidden', maxHeight: '100%' }}>
        {children}
      </div>
      <TakeOverRequestHandler />
    </div>
  )
}

