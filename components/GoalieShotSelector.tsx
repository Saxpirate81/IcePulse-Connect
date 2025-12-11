'use client'

import React, { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { Player } from './PlayerContainer'
import JerseyNumberInput from './JerseyNumberInput'

interface GoalieShotSelectorProps {
  onSave: (shotLocation: { x: number; y: number } | null, isGoal: boolean, isBlocked: boolean, player: Player | null, opponentJersey: string | null, team: 'myTeam' | 'opponent', isShotOnNet?: boolean) => void
  onClose: () => void
  players: Player[]
  defaultPlayer?: Player | null
  teamName: string
  opponentName: string
  zone?: 'attacking' | 'defending' // Zone where the shot was clicked
  editingShot?: {
    isGoal: boolean
    isShotOnNet: boolean
    isBlocked: boolean
    team: 'myTeam' | 'opponent'
    player: Player | null
    opponentJersey: string | null
  } | null
}

export default function GoalieShotSelector({ onSave, onClose, players, defaultPlayer = null, teamName, opponentName, zone, editingShot }: GoalieShotSelectorProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ x: number; y: number } | null>(null)
  const [isGoal, setIsGoal] = useState(editingShot?.isGoal || false)
  const [isBlocked, setIsBlocked] = useState(editingShot?.isBlocked || false)
  const [isShotOnNet, setIsShotOnNet] = useState(editingShot?.isShotOnNet || false) // Track if shot is on net or missed
  // Auto-determine team based on zone: attacking = myTeam, defending = opponent (or use editingShot team if editing)
  const [selectedTeam] = useState<'myTeam' | 'opponent'>(() => {
    if (editingShot) return editingShot.team
    return zone === 'attacking' ? 'myTeam' : 'opponent'
  })
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(editingShot?.player || defaultPlayer)
  const [opponentJersey, setOpponentJersey] = useState<string>(editingShot?.opponentJersey?.toString() || '')
  const [showJerseyCalculator, setShowJerseyCalculator] = useState(false)
  const [isGoalieFlipped, setIsGoalieFlipped] = useState(false)
  const goalieImageRef = useRef<HTMLDivElement>(null)

  // Auto-set team when blocked shot is clicked based on zone - toggle on/off
  const handleBlockedShot = () => {
    if (isBlocked) {
      // Unclick - reset to default state
      setIsBlocked(false)
      setIsShotOnNet(false)
    } else {
      // Click - set blocked shot
      setIsBlocked(true)
      setIsGoal(false)
      setIsShotOnNet(false)
      setSelectedLocation(null)
    }
  }

  const handleGoal = () => {
    if (isGoal) {
      // Unclick - reset to default state
      setIsGoal(false)
      setIsShotOnNet(false)
      setSelectedLocation(null)
    } else {
      // Click - set goal
      setIsGoal(true)
      setIsBlocked(false)
      setIsShotOnNet(true)
      // If no location selected yet, set a default location in the goal
      if (!selectedLocation) {
        setSelectedLocation({ x: goalCenterX, y: goalTopY + goalHeight / 2 })
      }
      // When Goal button is clicked, user must then click on the goalie image to mark where the goal was
    }
  }

  // Goal dimensions (percentage of image)
  const goalWidth = 62 // Narrowed from 65% to 62% (moved in sides)
  const goalTopY = 52 // Moved down from 48% to 52% (moved box down more)
  const goalBottomY = 91 // Moved down from 87% to 91% (moved box down more)
  const goalHeight = goalBottomY - goalTopY // Height calculated from top and bottom (39%)
  const goalCenterX = 50 // Center horizontally
  
  // Shot on goal area: matches goal position exactly
  const shotOnGoalTopY = goalTopY // 39% (matches goal top)
  const shotOnGoalBottomY = goalBottomY // 78% (matches goal bottom)
  const shotOnGoalHeight = goalHeight // Same height as goal (39%)

  const handleGoalieImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Check if click is within shot on goal area: matches goal position exactly
    // Shot on goal = within goal width horizontally AND from shot on goal top to bottom vertically
    const isInShotOnGoalArea = 
      x >= goalCenterX - goalWidth / 2 &&
      x <= goalCenterX + goalWidth / 2 &&
      y >= shotOnGoalTopY &&
      y <= shotOnGoalBottomY

    if (isGoal) {
      // If Goal button is already selected, clicking on image marks where the goal went in
      setIsShotOnNet(true) // Goal is always on net
      setSelectedLocation({ x, y })
    } else {
      // Shot On Net (SOG) = within goal width from top to bottom, Missed Shot = outside
      // Note: This is SOG, not Goal. Goal requires clicking Goal button first.
      setIsShotOnNet(isInShotOnGoalArea)
      setIsGoal(false) // Reset goal flag - clicking on image is SOG, not Goal
      setSelectedLocation({ x, y })
    }
  }

  const handleSave = () => {
    if (!selectedTeam) return
    // For blocked shots, location can be null
    // For regular shots, need location
    if (!isBlocked && !selectedLocation) return
    // If goal button was clicked, isGoal is true
    // Otherwise, if shot is on net, it's SOG (isShotOnNet = true)
    const finalIsGoal = isGoal
    const finalIsShotOnNet = !isGoal && !isBlocked && isShotOnNet
    onSave(selectedLocation, finalIsGoal, isBlocked, selectedTeam === 'myTeam' ? selectedPlayer : null, selectedTeam === 'opponent' ? opponentJersey : null, selectedTeam, finalIsShotOnNet)
    onClose()
  }


  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="bg-surface border border-border rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text">Select Shot Location</h2>
          <button
            onClick={onClose}
            className="text-textSecondary hover:text-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Blocked Shot and Goal Buttons - Above goalie image */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <button
            onClick={handleBlockedShot}
            className={`p-3 rounded-lg border-2 transition-colors ${
              isBlocked
                ? 'border-primary bg-primary/20 text-text'
                : 'border-border bg-surface hover:bg-surfaceLight text-textSecondary'
            }`}
          >
            <span className="font-semibold">Blocked Shot</span>
          </button>
          <button
            onClick={handleGoal}
            className={`p-3 rounded-lg border-2 transition-colors ${
              isGoal
                ? 'border-primary bg-primary/20 text-text'
                : 'border-border bg-surface hover:bg-surfaceLight text-textSecondary'
            }`}
          >
            <span className="font-semibold">Goal</span>
          </button>
        </div>

        {/* Show team info - auto-determined from zone */}
        <div className="mb-4 p-3 bg-primary/10 border border-primary rounded-lg">
          <div className="text-sm font-semibold text-text">
            {selectedTeam === 'myTeam' ? teamName : opponentName}
            {isBlocked && ' - Blocked Shot'}
          </div>
          <div className="text-xs text-textSecondary mt-1">
            {selectedTeam === 'myTeam' ? 'Attacking Zone' : 'Defending Zone'}
          </div>
        </div>

        {/* Goalie Image with Goal Overlay - Only show if not blocked shot */}
        {!isBlocked && (
          <div className="mb-4 p-0">
            {/* Reverse Goalie Button */}
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setIsGoalieFlipped(!isGoalieFlipped)}
                className="px-3 py-1.5 bg-surface border border-border rounded-lg text-textSecondary hover:bg-surfaceLight transition-colors text-sm font-semibold"
              >
                {isGoalieFlipped ? '← Reverse' : 'Reverse →'}
              </button>
            </div>
            <div
              ref={goalieImageRef}
              className="relative w-full rounded-lg border-2 border-primary cursor-crosshair overflow-hidden"
              style={{ 
                height: '400px',
                padding: 0,
                margin: 0,
                background: `linear-gradient(to bottom, transparent 0%, transparent ${goalTopY - 3}%, rgb(219 234 254) ${goalTopY - 3}%, rgb(191 219 254) 100%)`
              }}
              onClick={handleGoalieImageClick}
            >
            {/* Goalie Image */}
            <div
              className="absolute"
              style={{
                left: `${goalCenterX - goalWidth / 2}%`,
                top: `${goalTopY}%`,
                width: `${goalWidth}%`,
                height: `${goalHeight}%`,
                transform: isGoalieFlipped ? 'scaleX(-1) scale(1.65, 1.65)' : 'scale(1.65, 1.65)',
                transformOrigin: 'center',
              }}
            >
              <img
                src="https://docs.google.com/drawings/d/e/2PACX-1vSoegwbyAAww3i4PyzeN2SopkP_M6mQpWEdddBcVAvAL7tto5Uq-wV5Hq9ZtjxDyJDLiSkWM2zU0IkC/pub?w=1152&h=768"
                alt="Goalie"
                className="w-full h-full object-contain"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                onError={(e) => {
                  // Fallback to SVG if image not found
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'block'
                }}
              />
              {/* Fallback SVG if image not found */}
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                style={{ display: 'none', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
              >
                {/* Goalie Body */}
                <ellipse cx="50" cy="45" rx="18" ry="25" fill="#000" />
                {/* Goalie Head/Helmet */}
                <ellipse cx="50" cy="20" rx="12" ry="12" fill="#000" />
                {/* Face Cage */}
                <rect x="42" y="18" width="16" height="8" fill="none" stroke="#fff" strokeWidth="0.5" />
                <line x1="46" y1="18" x2="46" y2="26" stroke="#fff" strokeWidth="0.5" />
                <line x1="50" y1="18" x2="50" y2="26" stroke="#fff" strokeWidth="0.5" />
                <line x1="54" y1="18" x2="54" y2="26" stroke="#fff" strokeWidth="0.5" />
                {/* Left Arm/Glove */}
                <ellipse cx="35" cy="40" rx="8" ry="12" fill="#000" />
                <ellipse cx="32" cy="45" rx="6" ry="8" fill="#000" />
                {/* Right Arm/Blocker */}
                <ellipse cx="65" cy="40" rx="8" ry="12" fill="#000" />
                <rect x="60" y="42" width="10" height="8" rx="1" fill="#000" />
                {/* Stick */}
                <line x1="68" y1="45" x2="75" y2="80" stroke="#000" strokeWidth="2" />
                <line x1="75" y1="80" x2="82" y2="85" stroke="#000" strokeWidth="1.5" />
                {/* Leg Pads */}
                <ellipse cx="42" cy="70" rx="6" ry="18" fill="#000" />
                <ellipse cx="58" cy="70" rx="6" ry="18" fill="#000" />
              </svg>
            </div>
            
            {/* Goal Outline */}
            <div
              className="absolute border-2 border-primary bg-primary/10"
              style={{
                left: `${goalCenterX - goalWidth / 2}%`,
                top: `${goalTopY}%`,
                width: `${goalWidth}%`,
                height: `${goalHeight}%`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-xs text-primary font-semibold">
                GOAL
              </div>
            </div>
            
            {/* Shot On Goal Area Indicator - single solid blue box matching red goal bars */}
            <div
              className="absolute border-2 border-blue-500"
              style={{
                left: `${goalCenterX - goalWidth / 2}%`,
                top: `${shotOnGoalTopY}%`,
                width: `${goalWidth}%`,
                height: `${shotOnGoalHeight}%`,
              }}
            />

            {/* Selected Location Marker */}
            {selectedLocation && (
              <div
                className="absolute"
                style={{
                  left: `${selectedLocation.x}%`,
                  top: `${selectedLocation.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {isGoal ? (
                  <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-green-600"></div>
                ) : isShotOnNet ? (
                  <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-blue-600"></div>
                ) : (
                  <div className="text-red-500 text-2xl font-bold">×</div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="absolute bottom-2 left-2 right-2 text-xs text-textSecondary bg-black/50 rounded px-2 py-1">
              {selectedLocation 
                ? (isGoal 
                    ? 'Goal! Click Save to record.' 
                    : (isShotOnNet 
                        ? 'Shot On Net. Click Goal button if it went in, or Save to record shot on net.' 
                        : 'Missed Shot. Click Save to record.'))
                : 'Click on the goalie image to mark shot location'}
            </div>
            </div>
          </div>
        )}

        {/* Player Selection - My Team */}
        {selectedTeam === 'myTeam' && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-textSecondary mb-3">
              {isBlocked ? 'Blocked By' : 'Shot By'} {selectedPlayer && <span className="text-primary">✓</span>}
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {/* Unknown Player Option */}
              <button
                onClick={() => setSelectedPlayer(null)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  selectedPlayer === null
                    ? 'border-primary bg-primary/20'
                    : 'border-border bg-surface hover:bg-surfaceLight'
                }`}
              >
                <div className="text-xs font-semibold text-text">Unknown</div>
              </button>

              {/* Player Options */}
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedPlayer?.id === player.id
                      ? 'border-primary bg-primary/20'
                      : 'border-border bg-surface hover:bg-surfaceLight'
                  }`}
                >
                  <div className="text-xs font-semibold text-text">
                    #{player.jerseyNumber}
                  </div>
                  <div className="text-xs text-textSecondary truncate">
                    {player.firstName[0]}. {player.lastName}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Opponent Jersey Number Input */}
        {selectedTeam === 'opponent' && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-textSecondary mb-2">
              {isBlocked ? 'Blocked By' : 'Shot By'} Opponent Jersey Number
            </label>
            {!opponentJersey && (
              <div className="mb-3 p-3 bg-warning/20 border border-warning rounded-lg">
                <p className="text-sm text-textSecondary">Unknown Player (default)</p>
              </div>
            )}
            <button
              onClick={() => setShowJerseyCalculator(true)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text hover:bg-surfaceLight transition-colors text-left"
            >
              {opponentJersey ? (
                <span className="text-lg font-bold text-primary">#{opponentJersey}</span>
              ) : (
                <span className="text-textSecondary">Tap to enter jersey number</span>
              )}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-textSecondary font-semibold hover:bg-surfaceLight transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedTeam || (!isBlocked && !selectedLocation)}
            className="flex-1 bg-primary text-text rounded-lg px-4 py-3 font-semibold hover:bg-primaryDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Shot
          </button>
        </div>
        </div>

        {/* Jersey Number Input Modal */}
        {showJerseyCalculator && (
          <JerseyNumberInput
            value={opponentJersey}
            onChange={setOpponentJersey}
            onClose={() => setShowJerseyCalculator(false)}
            title="Enter Jersey Number"
          />
        )}
      </div>
    </>
  )
}

