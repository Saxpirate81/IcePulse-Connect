'use client'

import React from 'react'
import { useGame } from '@/contexts/GameContext'

export default function GameInfoHeader() {
  const { gameDate, opponent, selectedTeam } = useGame()

  if (!gameDate && !opponent && !selectedTeam) return null

  return (
    <div className="bg-surface/50 border border-border rounded-lg px-4 py-2 mb-4 flex items-center justify-between text-sm">
      <div className="flex items-center gap-4">
        {gameDate && (
          <div className="text-textSecondary">
            <span className="font-semibold text-text">Date:</span> {gameDate}
          </div>
        )}
        {opponent && (
          <div className="text-textSecondary">
            <span className="font-semibold text-text">vs</span> {opponent}
          </div>
        )}
      </div>
      {selectedTeam && (
        <div className="text-textSecondary">
          <span className="font-semibold text-text">{selectedTeam}</span>
        </div>
      )}
    </div>
  )
}

