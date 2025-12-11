'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Player } from './PlayerContainer'
import Calculator from './Calculator'

interface FaceoffSelectorProps {
  onSave: (team: 'myTeam' | 'opponent', player: Player | null, opponentJersey: string | null) => void
  onClose: () => void
  players: Player[]
  teamName: string
  opponentName: string
  faceoffType: string
}

export default function FaceoffSelector({ 
  onSave, 
  onClose, 
  players, 
  teamName, 
  opponentName,
  faceoffType 
}: FaceoffSelectorProps) {
  const [selectedTeam, setSelectedTeam] = useState<'myTeam' | 'opponent' | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [opponentJersey, setOpponentJersey] = useState<string>('')
  const [showJerseyCalculator, setShowJerseyCalculator] = useState(false)

  const handleSave = () => {
    if (!selectedTeam) return
    
    if (selectedTeam === 'myTeam') {
      onSave('myTeam', selectedPlayer, null)
    } else {
      onSave('opponent', null, opponentJersey || null)
    }
    onClose()
  }

  const handleTeamSelect = (team: 'myTeam' | 'opponent') => {
    setSelectedTeam(team)
    setSelectedPlayer(null)
    setOpponentJersey('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-surface border border-border rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-text">Log Faceoff</h2>
            <p className="text-xs text-textSecondary mt-1 capitalize">{faceoffType.replace('-', ' ')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-textSecondary hover:text-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Team Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-textSecondary mb-3">
            Who Won the Faceoff?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleTeamSelect('myTeam')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedTeam === 'myTeam'
                  ? 'border-primary bg-primary/20'
                  : 'border-border bg-surface hover:bg-surfaceLight'
              }`}
            >
              <div className="text-sm font-semibold text-text">{teamName}</div>
            </button>
            <button
              onClick={() => handleTeamSelect('opponent')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedTeam === 'opponent'
                  ? 'border-primary bg-primary/20'
                  : 'border-border bg-surface hover:bg-surfaceLight'
              }`}
            >
              <div className="text-sm font-semibold text-text">{opponentName}</div>
            </button>
          </div>
        </div>

        {/* My Team Player Selection */}
        {selectedTeam === 'myTeam' && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-textSecondary mb-3">
              Player {selectedPlayer && <span className="text-primary">✓</span>}
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
              Opponent Jersey Number
            </label>
            {!opponentJersey && (
              <div className="mb-3 p-3 bg-warning/20 border border-warning rounded-lg">
                <p className="text-sm text-textSecondary">Unknown Player (default)</p>
              </div>
            )}
            <div className="space-y-2">
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
            disabled={!selectedTeam}
            className="flex-1 bg-primary text-text rounded-lg px-4 py-3 font-semibold hover:bg-primaryDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Faceoff
          </button>
        </div>
      </div>

      {/* Jersey Calculator Modal */}
      {showJerseyCalculator && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-surface border border-border rounded-xl p-6 max-w-sm w-full">
            <Calculator
              value={opponentJersey}
              onChange={setOpponentJersey}
              onClose={() => setShowJerseyCalculator(false)}
              title="Enter Jersey Number"
            />
          </div>
        </div>
      )}
    </div>
  )
}

