'use client'

import React, { useState, useEffect } from 'react'
import { CloseIcon, SearchIcon, CheckIcon } from '@/components/icons/HockeyIcons'

interface Player {
  id: string
  rosterId: string
  name: string
  jerseyNumber: number | string
  teamId: string
  seasonId: string
  teamName?: string
  seasonName?: string
}

interface PlayerSelectionModalProps {
  isOpen: boolean
  selectedRosterIds: string[]
  players: Player[]
  seasons: { id: string; name: string }[]
  teams: { id: string; name: string }[]
  onConfirm: (rosterIds: string[]) => void
  onCancel: () => void
}

export default function PlayerSelectionModal({
  isOpen,
  selectedRosterIds,
  players,
  seasons,
  teams,
  onConfirm,
  onCancel
}: PlayerSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSeasons, setSelectedSeasons] = useState<Set<string>>(new Set(['all']))
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set(['all']))
  const [selectedRosterIdsLocal, setSelectedRosterIdsLocal] = useState<string[]>(selectedRosterIds)
  const [showSeasonFilter, setShowSeasonFilter] = useState(false)
  const [showTeamFilter, setShowTeamFilter] = useState(false)

  useEffect(() => {
    setSelectedRosterIdsLocal(selectedRosterIds)
  }, [selectedRosterIds, isOpen])

  if (!isOpen) return null

  const toggleSeason = (seasonId: string) => {
    const newSet = new Set(selectedSeasons)
    if (seasonId === 'all') {
      if (newSet.has('all')) {
        newSet.clear()
      } else {
        newSet.clear()
        newSet.add('all')
      }
    } else {
      newSet.delete('all')
      if (newSet.has(seasonId)) {
        newSet.delete(seasonId)
        if (newSet.size === 0) newSet.add('all')
      } else {
        newSet.add(seasonId)
      }
    }
    setSelectedSeasons(newSet)
  }

  const toggleTeam = (teamId: string) => {
    const newSet = new Set(selectedTeams)
    if (teamId === 'all') {
      if (newSet.has('all')) {
        newSet.clear()
      } else {
        newSet.clear()
        newSet.add('all')
      }
    } else {
      newSet.delete('all')
      if (newSet.has(teamId)) {
        newSet.delete(teamId)
        if (newSet.size === 0) newSet.add('all')
      } else {
        newSet.add(teamId)
      }
    }
    setSelectedTeams(newSet)
  }

  const togglePlayer = (rosterId: string) => {
    setSelectedRosterIdsLocal(prev => 
      prev.includes(rosterId)
        ? prev.filter(id => id !== rosterId)
        : [...prev, rosterId]
    )
  }

  const filteredPlayers = players.filter(player => {
    // Search filter
    if (searchTerm.length >= 2) {
      const search = searchTerm.toLowerCase()
      if (!player.name.toLowerCase().includes(search) && 
          !String(player.jerseyNumber).includes(search)) {
        return false
      }
    }

    // Season filter
    if (!selectedSeasons.has('all') && selectedSeasons.size > 0) {
      if (!selectedSeasons.has(player.seasonId)) return false
    }

    // Team filter
    if (!selectedTeams.has('all') && selectedTeams.size > 0) {
      if (!selectedTeams.has(player.teamId)) return false
    }

    return true
  }).sort((a, b) => {
    const nameA = (a.name || '').toString()
    const nameB = (b.name || '').toString()
    if (nameA !== nameB) return nameA.localeCompare(nameB)
    
    const seasonA = (a.seasonName || '').toString()
    const seasonB = (b.seasonName || '').toString()
    if (seasonA !== seasonB) return seasonA.localeCompare(seasonB)
    
    const teamA = (a.teamName || '').toString()
    const teamB = (b.teamName || '').toString()
    return teamA.localeCompare(teamB)
  })

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-2xl font-bold text-text">Select Players</h3>
          <button
            onClick={onCancel}
            className="text-textSecondary hover:text-text"
          >
            <CloseIcon size={24} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center gap-2">
            <SearchIcon size={18} className="text-textSecondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or jersey number..."
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-text"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => {
                  setShowTeamFilter(false)
                  setShowSeasonFilter(!showSeasonFilter)
                }}
                className="bg-background border border-border rounded-xl px-4 py-2 text-text text-sm hover:bg-surfaceLight"
              >
                Season: {selectedSeasons.has('all') || selectedSeasons.size === 0 
                  ? 'All' 
                  : selectedSeasons.size === 1 
                    ? seasons.find(s => s.id === Array.from(selectedSeasons)[0])?.name || 'All'
                    : `${selectedSeasons.size} selected`}
              </button>
              {showSeasonFilter && (
                <div className="absolute top-full left-0 mt-2 bg-surface border border-border rounded-xl p-2 min-w-[200px] max-h-60 overflow-y-auto z-10">
                  <div
                    onClick={() => toggleSeason('all')}
                    className="p-2 hover:bg-background rounded cursor-pointer flex items-center gap-2"
                  >
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      selectedSeasons.has('all') ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {selectedSeasons.has('all') && <CheckIcon size={12} className="text-text" />}
                    </div>
                    <span className="text-sm text-text">All</span>
                  </div>
                  {seasons.map(season => (
                    <div
                      key={season.id}
                      onClick={() => toggleSeason(season.id)}
                      className="p-2 hover:bg-background rounded cursor-pointer flex items-center gap-2"
                    >
                      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                        selectedSeasons.has(season.id) ? 'bg-primary border-primary' : 'border-border'
                      }`}>
                        {selectedSeasons.has(season.id) && <CheckIcon size={12} className="text-text" />}
                      </div>
                      <span className="text-sm text-text">{season.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowSeasonFilter(false)
                  setShowTeamFilter(!showTeamFilter)
                }}
                className="bg-background border border-border rounded-xl px-4 py-2 text-text text-sm hover:bg-surfaceLight"
              >
                Team: {selectedTeams.has('all') || selectedTeams.size === 0 
                  ? 'All' 
                  : selectedTeams.size === 1 
                    ? teams.find(t => t.id === Array.from(selectedTeams)[0])?.name || 'All'
                    : `${selectedTeams.size} selected`}
              </button>
              {showTeamFilter && (
                <div className="absolute top-full left-0 mt-2 bg-surface border border-border rounded-xl p-2 min-w-[200px] max-h-60 overflow-y-auto z-10">
                  <div
                    onClick={() => toggleTeam('all')}
                    className="p-2 hover:bg-background rounded cursor-pointer flex items-center gap-2"
                  >
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      selectedTeams.has('all') ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {selectedTeams.has('all') && <CheckIcon size={12} className="text-text" />}
                    </div>
                    <span className="text-sm text-text">All</span>
                  </div>
                  {teams.map(team => (
                    <div
                      key={team.id}
                      onClick={() => toggleTeam(team.id)}
                      className="p-2 hover:bg-background rounded cursor-pointer flex items-center gap-2"
                    >
                      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                        selectedTeams.has(team.id) ? 'bg-primary border-primary' : 'border-border'
                      }`}>
                        {selectedTeams.has(team.id) && <CheckIcon size={12} className="text-text" />}
                      </div>
                      <span className="text-sm text-text">{team.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ml-auto text-sm text-textSecondary">
              {selectedRosterIdsLocal.length} selected
            </div>
          </div>
        </div>

        {/* Player List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-textSecondary">
              <p>No players match the current filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPlayers.map(player => {
                const isSelected = selectedRosterIdsLocal.includes(player.rosterId)
                return (
                  <div
                    key={player.rosterId}
                    onClick={() => togglePlayer(player.rosterId)}
                    className={`bg-background border rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-primary/50 transition-colors ${
                      isSelected ? 'border-primary bg-primary/10' : 'border-border'
                    }`}
                  >
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {isSelected && <CheckIcon size={14} className="text-text" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-text">{player.name}</div>
                      <div className="text-sm text-textSecondary">
                        #{player.jerseyNumber} • {player.teamName || 'Unknown Team'} • {player.seasonName || 'Unknown Season'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border flex gap-3">
          <button
            onClick={() => setSelectedRosterIdsLocal([])}
            className="px-4 py-2 bg-surface border border-border rounded-xl text-textSecondary hover:bg-surfaceLight transition-colors"
          >
            Clear All
          </button>
          <div className="flex-1" />
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-surface border border-border rounded-xl text-textSecondary hover:bg-surfaceLight transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedRosterIdsLocal)}
            className="px-4 py-2 bg-primary text-text rounded-xl font-semibold hover:bg-primaryDark transition-colors"
          >
            Confirm ({selectedRosterIdsLocal.length})
          </button>
        </div>
      </div>
    </div>
  )
}

