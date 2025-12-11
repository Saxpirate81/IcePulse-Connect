'use client'

import React, { useState } from 'react'
import { useGame } from '@/contexts/GameContext'
import Calculator from './Calculator'
import { Play, Pause, Lock, Unlock } from 'lucide-react'

interface GameClockDisplayProps {
  size?: 'small' | 'large'
  showControls?: boolean
  showScores?: boolean
  showLockButton?: boolean
  teamName?: string
}

export default function GameClockDisplay({ 
  size = 'small', 
  showControls = true,
  showScores = true,
  showLockButton = true,
  teamName,
}: GameClockDisplayProps) {
  const { clock, startClock, stopClock, updateClock, setPeriod, toggleClockLock, myTeamScore, opponentScore, selectedTeam, opponent } = useGame()
  
  // Use provided teamName or fallback to selectedTeam (which might be an ID)
  const displayTeamName = teamName || selectedTeam || 'My Team'
  const [showCalculator, setShowCalculator] = useState(false)
  const [tempTime, setTempTime] = useState('')

  const handleClockClick = () => {
    if (!clock.isLocked) {
      setTempTime(`${String(clock.minutes).padStart(2, '0')}${String(clock.seconds).padStart(2, '0')}`)
      setShowCalculator(true)
    }
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

  const isLarge = size === 'large'
  const timeSize = isLarge ? 'text-7xl md:text-8xl' : 'text-4xl md:text-5xl'
  const periodSize = isLarge ? 'text-3xl' : 'text-lg'

  const abbreviateTeamName = (name: string | null, maxLength: number = 12) => {
    if (!name) return ''
    if (name.length <= maxLength) return name
    return name.substring(0, maxLength - 3) + '...'
  }

  // Abbreviate both team names to ensure equal spacing
  const maxTeamNameLength = isLarge ? 14 : 12
  const abbreviatedMyTeam = abbreviateTeamName(displayTeamName, maxTeamNameLength)
  const abbreviatedOpponent = abbreviateTeamName(opponent, maxTeamNameLength) || 'Opponent'

  return (
    <>
      <div className={`bg-gradient-to-br from-surface to-surfaceLight border-2 border-primary rounded-xl ${isLarge ? 'p-8' : 'p-4'} relative`}>
        {/* Lock/Unlock Button - Top Right */}
        {showControls && showLockButton && (
          <div className="absolute top-2 right-2">
            <button
              onClick={toggleClockLock}
              className={`flex items-center gap-1.5 ${isLarge ? 'px-3 py-1.5' : 'px-3 py-1.5'} rounded-lg border transition-colors ${
                clock.isLocked
                  ? 'bg-error/20 border-error text-error hover:bg-error/30'
                  : 'bg-success/20 border-success text-success hover:bg-success/30'
              }`}
            >
              {clock.isLocked ? (
                <>
                  <Lock size={isLarge ? 16 : 14} />
                  <span className="text-xs font-semibold">Unlock Clock</span>
                </>
              ) : (
                <>
                  <Unlock size={isLarge ? 16 : 14} />
                  <span className="text-xs font-semibold">Lock Clock</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* My Team Score - Fixed width for equal spacing */}
          {showScores && (
            <div className="text-center flex-shrink-0" style={{ width: isLarge ? '140px' : '100px', minWidth: isLarge ? '140px' : '100px' }}>
              <div className={`${isLarge ? 'text-sm' : 'text-xs'} text-textSecondary mb-1 truncate`} title={displayTeamName}>
                {abbreviatedMyTeam}
              </div>
              <div className={`${isLarge ? 'text-4xl' : 'text-2xl'} font-bold text-primary`}>
                {myTeamScore}
              </div>
            </div>
          )}

          {/* Clock - Centered with equal spacing on both sides */}
          <div className="flex-1 flex items-center justify-center gap-3">
            <div className="flex-1 text-center">
              {/* Period Display */}
              <div className={`flex items-center justify-center ${isLarge ? 'gap-4 mb-6' : 'gap-2 mb-3'}`}>
                {!clock.isLocked && (
                  <button
                    onClick={() => handlePeriodChange(-1)}
                    className={`bg-surface border border-border rounded-lg ${isLarge ? 'px-4 py-2' : 'px-2 py-1'} text-text hover:bg-surfaceLight transition-colors`}
                  >
                    −
                  </button>
                )}
                <div className="text-center">
                  <div className={`${isLarge ? 'text-sm' : 'text-xs'} text-textSecondary mb-1`}>Period</div>
                  <div className={`${periodSize} font-bold text-text`}>{clock.period}</div>
                </div>
                {!clock.isLocked && (
                  <button
                    onClick={() => handlePeriodChange(1)}
                    className={`bg-surface border border-border rounded-lg ${isLarge ? 'px-4 py-2' : 'px-2 py-1'} text-text hover:bg-surfaceLight transition-colors`}
                  >
                    +
                  </button>
                )}
              </div>

              {/* Time Display with Start/Stop button inline */}
              <div className="flex items-center justify-center gap-3">
                <div
                  onClick={!clock.isLocked ? handleClockClick : undefined}
                  className={`${!clock.isLocked ? 'cursor-pointer hover:scale-105' : ''} transition-transform flex flex-col items-center`}
                >
                  <div className={`${timeSize} font-mono font-bold text-white leading-none`}>
                    {String(clock.minutes).padStart(2, '0')}:{String(clock.seconds).padStart(2, '0')}
                  </div>
                  {!clock.isLocked && (
                    <div className={`${isLarge ? 'text-sm' : 'text-xs'} text-textSecondary mt-1`}>Tap to edit</div>
                  )}
                </div>

                {/* Start/Stop Button - Aligned with clock numbers when unlocked */}
                {showControls && !clock.isLocked && (
                  <button
                    onClick={clock.isRunning ? stopClock : startClock}
                    className={`flex items-center justify-center ${isLarge ? 'px-4 py-3' : 'px-3 py-2'} rounded-xl font-semibold transition-colors self-start ${
                      clock.isRunning
                        ? 'bg-error border border-error text-text hover:bg-error/90'
                        : 'bg-success border border-success text-text hover:bg-success/90'
                    }`}
                    style={{ marginTop: isLarge ? '0.5rem' : '0.25rem' }}
                  >
                    {clock.isRunning ? (
                      <Pause size={isLarge ? 20 : 18} />
                    ) : (
                      <Play size={isLarge ? 20 : 18} />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Opponent Score - Fixed width for equal spacing */}
          {showScores && (
            <div className="text-center flex-shrink-0" style={{ width: isLarge ? '140px' : '100px', minWidth: isLarge ? '140px' : '100px' }}>
              <div className={`${isLarge ? 'text-sm' : 'text-xs'} text-textSecondary mb-1 truncate`} title={opponent || 'Opponent'}>
                {abbreviatedOpponent}
              </div>
              <div className={`${isLarge ? 'text-4xl' : 'text-2xl'} font-bold text-primary`}>
                {opponentScore}
              </div>
            </div>
          )}
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
    </>
  )
}

