'use client'

import React, { useState, useEffect } from 'react'

export interface Player {
  id: string
  jerseyNumber: number
  firstName: string
  lastName: string
  position?: 'Forward' | 'Defense' | 'Goalie'
  isAvailable?: boolean
}

interface PlayerContainerProps {
  players: Player[]
  onPlayerClick?: (player: Player) => void
  onPlayerLongPress?: (player: Player) => void
  showPositions?: boolean
  allowPositionAssignment?: boolean
  onPositionAssigned?: (playerId: string, position: 'Forward' | 'Defense' | 'Goalie' | null, isAvailable?: boolean) => void
}

export default function PlayerContainer({
  players,
  onPlayerClick,
  onPlayerLongPress,
  showPositions = false,
  allowPositionAssignment = false,
  onPositionAssigned,
}: PlayerContainerProps) {
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [tempSelectedPosition, setTempSelectedPosition] = useState<'Forward' | 'Defense' | 'Goalie' | 'Not Available' | null>(null)
  const [tempIsAvailable, setTempIsAvailable] = useState<boolean>(true)

  const handleMouseDown = (player: Player) => {
    if (!allowPositionAssignment) return
    
    const timer = setTimeout(() => {
      setSelectedPlayer(player)
      // Initialize temp selection with current player state
      if (player.isAvailable === false) {
        setTempSelectedPosition('Not Available')
        setTempIsAvailable(false)
      } else if (player.position) {
        setTempSelectedPosition(player.position)
        setTempIsAvailable(true)
      } else {
        setTempSelectedPosition(null)
        setTempIsAvailable(true)
      }
      setShowPositionModal(true)
    }, 500) // 500ms hold
    
    setLongPressTimer(timer)
  }

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const handlePositionClick = (position: 'Forward' | 'Defense' | 'Goalie' | 'Not Available') => {
    // Automatically save and close when position is selected
    if (selectedPlayer && onPositionAssigned) {
      if (position === 'Not Available') {
        onPositionAssigned(selectedPlayer.id, null, false)
      } else {
        onPositionAssigned(selectedPlayer.id, position, true)
      }
    }
    setShowPositionModal(false)
    setSelectedPlayer(null)
    setTempSelectedPosition(null)
    setTempIsAvailable(true)
  }

  const handleClear = () => {
    setTempSelectedPosition(null)
    setTempIsAvailable(true)
  }

  const handleSave = () => {
    if (selectedPlayer && onPositionAssigned) {
      if (tempSelectedPosition === 'Not Available') {
        onPositionAssigned(selectedPlayer.id, null, false)
      } else if (tempSelectedPosition) {
        onPositionAssigned(selectedPlayer.id, tempSelectedPosition, true)
      } else {
        // No selection - clear position but keep available
        onPositionAssigned(selectedPlayer.id, null, true)
      }
    }
    setShowPositionModal(false)
    setSelectedPlayer(null)
    setTempSelectedPosition(null)
    setTempIsAvailable(true)
  }

  const handleCancel = () => {
    setShowPositionModal(false)
    setSelectedPlayer(null)
    setTempSelectedPosition(null)
    setTempIsAvailable(true)
  }

  const getPositionColor = (position?: 'Forward' | 'Defense' | 'Goalie', isAvailable?: boolean) => {
    if (isAvailable === false) {
      return 'bg-gray-600/20 border-gray-500'
    }
    if (!position) return 'bg-surfaceLight/70 border-border/50'
    switch (position) {
      case 'Forward':
        return 'bg-blue-500/30 border-blue-500 brightness-110'
      case 'Defense':
        return 'bg-green-500/30 border-green-500 brightness-110'
      case 'Goalie':
        return 'bg-yellow-500/30 border-yellow-500 brightness-110'
      default:
        return 'bg-surfaceLight/70 border-border/50'
    }
  }

  return (
    <>
      <div 
        className="grid gap-3" 
        style={{ 
          gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))',
          minWidth: 'min-content'
        }}
      >
        {players.map((player) => (
          <div
            key={player.id}
            onClick={() => onPlayerClick?.(player)}
            onMouseDown={() => handleMouseDown(player)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={() => handleMouseDown(player)}
            onTouchEnd={handleMouseUp}
            className={`
              ${getPositionColor(player.position, player.isAvailable)}
              border-2 rounded-xl p-3 cursor-pointer transition-all relative
              hover:scale-105 active:scale-95 hover:brightness-110
              ${showPositions && player.position ? 'ring-2 ring-offset-2 ring-offset-background' : ''}
            `}
            style={{ 
              minWidth: '85px', 
              maxWidth: '120px',
              width: '100%'
            }}
          >
            {player.isAvailable === false && (
              <div className="absolute inset-0 bg-gray-800/50 rounded-xl pointer-events-none z-10" />
            )}
            <div className="text-center relative z-0">
              <div className={`text-xl font-bold brightness-125 ${player.isAvailable === false ? 'text-gray-200' : 'text-cyan-300'}`}>
                {player.jerseyNumber}
              </div>
              <div className={`text-xs brightness-110 ${player.isAvailable === false ? 'text-gray-200' : 'text-textSecondary'}`}>
                {player.firstName[0]}. {player.lastName}
              </div>
              {showPositions && player.position && player.isAvailable !== false && (
                <div className="text-[10px] text-textMuted mt-1">{player.position}</div>
              )}
              {player.isAvailable === false && (
                <div className="text-[10px] text-red-400 font-bold mt-1 brightness-150">Not Available</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Position Assignment Modal */}
      {showPositionModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-text mb-4">
              Assign Position for #{selectedPlayer.jerseyNumber}
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => handlePositionClick('Forward')}
                className={`w-full border-2 rounded-xl p-4 text-text font-semibold transition-colors ${
                  tempSelectedPosition === 'Forward'
                    ? 'bg-blue-500/40 border-blue-500 ring-2 ring-blue-500 ring-offset-2'
                    : 'bg-blue-500/20 border-blue-500 hover:bg-blue-500/30'
                }`}
              >
                Forward
              </button>
              <button
                onClick={() => handlePositionClick('Defense')}
                className={`w-full border-2 rounded-xl p-4 text-text font-semibold transition-colors ${
                  tempSelectedPosition === 'Defense'
                    ? 'bg-green-500/40 border-green-500 ring-2 ring-green-500 ring-offset-2'
                    : 'bg-green-500/20 border-green-500 hover:bg-green-500/30'
                }`}
              >
                Defense
              </button>
              <button
                onClick={() => handlePositionClick('Goalie')}
                className={`w-full border-2 rounded-xl p-4 text-text font-semibold transition-colors ${
                  tempSelectedPosition === 'Goalie'
                    ? 'bg-yellow-500/40 border-yellow-500 ring-2 ring-yellow-500 ring-offset-2'
                    : 'bg-yellow-500/20 border-yellow-500 hover:bg-yellow-500/30'
                }`}
              >
                Goalie
              </button>
              <button
                onClick={() => handlePositionClick('Not Available')}
                className={`w-full border-2 rounded-xl p-4 text-text font-semibold transition-colors ${
                  tempSelectedPosition === 'Not Available'
                    ? 'bg-gray-600/40 border-gray-500 ring-2 ring-gray-500 ring-offset-2'
                    : 'bg-gray-600/20 border-gray-500 hover:bg-gray-600/30'
                }`}
              >
                Not Available
              </button>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleClear}
                  className="flex-1 bg-error/20 border border-error rounded-xl p-3 text-error font-semibold hover:bg-error/30 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-primary border border-primary rounded-xl p-3 text-text font-semibold hover:bg-primaryDark transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-surface border border-border rounded-xl p-3 text-textSecondary font-semibold hover:bg-surfaceLight transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}



