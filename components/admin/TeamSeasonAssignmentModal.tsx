'use client'

import React, { useState, useEffect } from 'react'
import { CloseIcon, CheckIcon } from '@/components/icons/HockeyIcons'

interface TeamSeasonAssignment {
  teamId: string
  seasonId: string
  teamName: string
  seasonName: string
}

interface TeamSeasonAssignmentModalProps {
  isOpen: boolean
  userRole: 'Player' | 'Parent' | 'Coach'
  selectedAssignments: TeamSeasonAssignment[]
  teams: Array<{ id: string; name: string }>
  seasons: Array<{ id: string; name: string }>
  players?: Array<{ id: string; rosterId: string; name: string; jerseyNumber: number | string; teamId: string; seasonId: string; teamName?: string; seasonName?: string }> // For Player/Parent roles
  onConfirm: (assignments: TeamSeasonAssignment[]) => void
  onCancel: () => void
}

export default function TeamSeasonAssignmentModal({
  isOpen,
  userRole,
  selectedAssignments,
  teams,
  seasons,
  players = [],
  onConfirm,
  onCancel
}: TeamSeasonAssignmentModalProps) {
  const [localAssignments, setLocalAssignments] = useState<TeamSeasonAssignment[]>(selectedAssignments)
  const [newAssignment, setNewAssignment] = useState<{ teamId: string; seasonId: string }>({ teamId: '', seasonId: '' })
  const [selectedPlayerRosterIds, setSelectedPlayerRosterIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen) {
      setLocalAssignments(selectedAssignments)
      // For Player/Parent roles, extract roster IDs from selected assignments
      if (userRole === 'Player' || userRole === 'Parent') {
        const rosterIds = new Set<string>()
        selectedAssignments.forEach(assignment => {
          // Find matching player roster
          const player = players.find(p => p.teamId === assignment.teamId && p.seasonId === assignment.seasonId)
          if (player) {
            rosterIds.add(player.rosterId)
          }
        })
        setSelectedPlayerRosterIds(rosterIds)
      }
    }
  }, [isOpen, selectedAssignments, userRole, players])

  if (!isOpen) return null

  const addAssignment = () => {
    if (newAssignment.teamId && newAssignment.seasonId) {
      const team = teams.find(t => t.id === newAssignment.teamId)
      const season = seasons.find(s => s.id === newAssignment.seasonId)
      
      if (team && season) {
        // Check if this combination already exists
        const exists = localAssignments.some(
          a => a.teamId === newAssignment.teamId && a.seasonId === newAssignment.seasonId
        )
        
        if (!exists) {
          setLocalAssignments([
            ...localAssignments,
            {
              teamId: newAssignment.teamId,
              seasonId: newAssignment.seasonId,
              teamName: team.name,
              seasonName: season.name
            }
          ])
          setNewAssignment({ teamId: '', seasonId: '' })
        }
      }
    }
  }

  const removeAssignment = (index: number) => {
    setLocalAssignments(localAssignments.filter((_, i) => i !== index))
  }

  const handlePlayerToggle = (rosterId: string) => {
    const newSet = new Set(selectedPlayerRosterIds)
    if (newSet.has(rosterId)) {
      newSet.delete(rosterId)
      // Remove corresponding assignment
      const player = players.find(p => p.rosterId === rosterId)
      if (player) {
        setLocalAssignments(localAssignments.filter(
          a => !(a.teamId === player.teamId && a.seasonId === player.seasonId)
        ))
      }
    } else {
      newSet.add(rosterId)
      // Add corresponding assignment
      const player = players.find(p => p.rosterId === rosterId)
      if (player) {
        const team = teams.find(t => t.id === player.teamId)
        const season = seasons.find(s => s.id === player.seasonId)
        if (team && season) {
          const exists = localAssignments.some(
            a => a.teamId === player.teamId && a.seasonId === player.seasonId
          )
          if (!exists) {
            setLocalAssignments([
              ...localAssignments,
              {
                teamId: player.teamId,
                seasonId: player.seasonId,
                teamName: team.name,
                seasonName: season.name
              }
            ])
          }
        }
      }
    }
    setSelectedPlayerRosterIds(newSet)
  }

  const handleConfirm = () => {
    onConfirm(localAssignments)
  }

  // Filter available teams based on selected season (for dynamic filtering)
  const availableTeamsForSeason = newAssignment.seasonId
    ? teams // For now, show all teams (teams are organization-scoped, not season-scoped)
    : teams

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-text">
            Assign {userRole} to Teams & Seasons
          </h3>
          <button
            onClick={onCancel}
            className="text-textSecondary hover:text-text"
          >
            <CloseIcon size={24} />
          </button>
        </div>

        {userRole === 'Player' || userRole === 'Parent' ? (
          /* Player/Parent: Select from existing roster memberships */
          <div className="space-y-4">
            <p className="text-sm text-textSecondary mb-4">
              Select player roster memberships (team/season combinations) to assign to this {userRole.toLowerCase()}.
            </p>
            
            {players.length === 0 ? (
              <div className="text-center py-8 text-textSecondary">
                <p>No players with roster memberships found.</p>
                <p className="text-xs mt-2">Players must be added to teams and seasons first.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {players.map((player) => {
                  const isSelected = selectedPlayerRosterIds.has(player.rosterId)
                  return (
                    <div
                      key={player.rosterId}
                      onClick={() => handlePlayerToggle(player.rosterId)}
                      className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/20 border-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-text">
                            {player.name} #{player.jerseyNumber}
                          </div>
                          <div className="text-sm text-textSecondary">
                            {player.teamName || 'Unknown Team'} • {player.seasonName || 'Unknown Season'}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckIcon size={20} className="text-primary" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* Coach: Directly assign to teams and seasons */
          <div className="space-y-4">
            <p className="text-sm text-textSecondary mb-4">
              Add team and season combinations to assign this coach to.
            </p>

            {/* Add New Assignment */}
            <div className="bg-background border border-border rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-textSecondary mb-1">Season</label>
                  <select
                    value={newAssignment.seasonId}
                    onChange={(e) => {
                      setNewAssignment({ ...newAssignment, seasonId: e.target.value, teamId: '' })
                    }}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text"
                  >
                    <option value="">Select Season</option>
                    {seasons.map((season) => (
                      <option key={season.id} value={season.id}>
                        {season.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textSecondary mb-1">Team</label>
                  <select
                    value={newAssignment.teamId}
                    onChange={(e) => setNewAssignment({ ...newAssignment, teamId: e.target.value })}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text"
                    disabled={!newAssignment.seasonId}
                  >
                    <option value="">Select Team</option>
                    {availableTeamsForSeason.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={addAssignment}
                disabled={!newAssignment.teamId || !newAssignment.seasonId}
                className="w-full bg-primary/20 border border-primary text-primary px-4 py-2 rounded-lg font-semibold hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Assignment
              </button>
            </div>

            {/* Current Assignments */}
            {localAssignments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-textSecondary">Current Assignments:</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {localAssignments.map((assignment, index) => (
                    <div
                      key={`${assignment.teamId}-${assignment.seasonId}`}
                      className="flex items-center justify-between p-3 bg-background border border-border rounded-xl"
                    >
                      <div>
                        <div className="font-semibold text-text">
                          {assignment.teamName}
                        </div>
                        <div className="text-sm text-textSecondary">
                          {assignment.seasonName}
                        </div>
                      </div>
                      <button
                        onClick={() => removeAssignment(index)}
                        className="text-error hover:text-error/80 px-2 py-1 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4 mt-4 border-t border-border">
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-text px-4 py-3 rounded-xl font-semibold hover:bg-primaryDark transition-colors"
          >
            <CheckIcon size={18} />
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-surface border border-border text-textSecondary px-4 py-3 rounded-xl font-semibold hover:bg-surfaceLight transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

