'use client'

import React, { useState, useEffect } from 'react'
import { AddIcon, SaveIcon, CloseIcon, HockeyPlayers, StanleyCup } from '@/components/icons/HockeyIcons'
import DeleteConfirmModal from './DeleteConfirmModal'
import ItemActionModal from './ItemActionModal'
import { getTeams, createTeam, updateTeam, archiveTeam, deleteTeam, getPlayerCountForTeam, getGameCountForTeam, getSeasons } from '@/lib/supabase/queries'
import { useAdminSettings } from '@/contexts/AdminSettingsContext'

interface Team {
  id: string
  name: string
  players: number
  games: number
  season?: string
  status?: 'active' | 'archived'
}

interface TeamManagementProps {
  teams: Team[]
  onAdd: (team: Omit<Team, 'id'>) => void
  onEdit: (id: string, team: Omit<Team, 'id'>) => void
  onDelete: (id: string) => void
  onArchive?: (id: string) => void
  seasons?: string[]
  useSupabase?: boolean
  organizationId?: string
}

export default function TeamManagement({ teams, onAdd, onEdit, onDelete, onArchive, seasons = [], useSupabase = false, organizationId }: TeamManagementProps) {
  const { setLoading } = useAdminSettings()
  const [localTeams, setLocalTeams] = useState<Team[]>(teams)
  const [allTeams, setAllTeams] = useState<Team[]>(teams) // Store all teams for filtering
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; team: Team | null }>({ isOpen: false, team: null })
  const [archiveConfirm, setArchiveConfirm] = useState<{ isOpen: boolean; team: Team | null }>({ isOpen: false, team: null })
  const [formData, setFormData] = useState({ name: '', season: '' })
  const [localLoading, setLocalLoading] = useState(false)
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<string>('')
  const [availableSeasons, setAvailableSeasons] = useState<Array<{ id: string; name: string }>>([])

  // Load teams from Supabase if enabled
  useEffect(() => {
    if (useSupabase) {
      loadTeams()
      loadSeasons()
    } else {
      const teamsList = teams
      setAllTeams(teamsList)
      setLocalTeams(teamsList)
    }
  }, [useSupabase, teams, organizationId])

  // Load seasons for filter
  const loadSeasons = async () => {
    if (!useSupabase || !organizationId) return Promise.resolve()
    try {
      const seasonsData = await getSeasons(organizationId)
      setAvailableSeasons(seasonsData.map((s: any) => ({ id: s.id, name: s.name })))
    } catch (error) {
      console.error('Error loading seasons:', error)
    }
  }

  const loadTeams = async () => {
    try {
      setLocalLoading(true)
      const data = await getTeams(organizationId)
      
      // Calculate counts for each team
      const teamsWithCounts = await Promise.all(
        data.map(async (t: any) => {
          const [playersCount, gamesCount] = await Promise.all([
            getPlayerCountForTeam(t.id),
            getGameCountForTeam(t.id)
          ])
          return {
            id: t.id,
            name: t.name,
            players: playersCount,
            games: gamesCount,
            season: t.season_id ? seasons.find(s => s === t.season_id) : undefined,
            status: t.status || 'active'
          }
        })
      )
      
      setAllTeams(teamsWithCounts)
      setLocalTeams(teamsWithCounts)
    } catch (error) {
      console.error('Error loading teams:', error)
    } finally {
      setLocalLoading(false)
    }
  }

  // Filter teams based on selected season
  // Note: Teams are organization-scoped, not season-scoped, so this filter shows all teams
  // In the future, this could filter by teams that have games in the selected season
  useEffect(() => {
    // For now, show all teams regardless of filter since teams don't have direct season relationship
    setLocalTeams(allTeams)
  }, [selectedSeasonFilter, allTeams])

  const handleAdd = async () => {
    if (formData.name) {
      // Close modal immediately for better UX
      const teamName = formData.name
      const teamSeason = formData.season
      setFormData({ name: '', season: '' })
      setShowAddModal(false)
      
      // Optimistically update UI
      const tempId = `temp-${Date.now()}`
      const optimisticTeam: Team = {
        id: tempId,
        name: teamName,
        players: 0,
        games: 0,
        season: teamSeason || undefined,
        status: 'active'
      }
      setLocalTeams([...localTeams, optimisticTeam])
      
      // Perform async operation in background
      try {
        setLocalLoading(true)
        setLoading(true)
        if (useSupabase) {
          const newTeam = await createTeam({
            name: teamName,
            organization_id: organizationId || undefined,
            status: 'active'
          })
          // Replace optimistic update with real data
          setLocalTeams(prev => prev.map(t => t.id === tempId ? {
            id: newTeam.id,
            name: newTeam.name,
            players: 0,
            games: 0,
            season: teamSeason || undefined,
            status: 'active'
          } : t))
        } else {
          onAdd({
            name: teamName,
            players: 0,
            games: 0,
            season: teamSeason || undefined,
            status: 'active'
          })
        }
      } catch (error) {
        console.error('Error adding team:', error)
        // Revert optimistic update on error
        setLocalTeams(prev => prev.filter(t => t.id !== tempId))
        alert('Failed to add team. Please try again.')
      } finally {
        setLocalLoading(false)
        setLoading(false)
      }
    }
  }

  const handleEdit = async () => {
    if (editingTeam && formData.name) {
      // Close modal immediately for better UX
      const teamName = formData.name
      const teamSeason = formData.season
      const originalTeam = { ...editingTeam }
      setEditingTeam(null)
      setFormData({ name: '', season: '' })
      setShowAddModal(false)
      
      // Optimistically update UI
      setLocalTeams(prev => prev.map(t => t.id === originalTeam.id ? {
        ...t,
        name: teamName,
        season: teamSeason || undefined
      } : t))
      
      // Perform async operation in background
      try {
        setLocalLoading(true)
        setLoading(true)
        if (useSupabase) {
          const seasonId = seasons.find(s => s === teamSeason) || teamSeason
          await updateTeam(originalTeam.id, {
            name: teamName,
            organization_id: organizationId || undefined,
            status: originalTeam.status || 'active'
          })
        } else {
          onEdit(originalTeam.id, {
            name: teamName,
            players: originalTeam.players,
            games: originalTeam.games,
            season: teamSeason || undefined,
            status: originalTeam.status || 'active'
          })
        }
      } catch (error) {
        console.error('Error updating team:', error)
        // Revert optimistic update on error
        setLocalTeams(prev => prev.map(t => t.id === originalTeam.id ? originalTeam : t))
        alert('Failed to update team. Please try again.')
      } finally {
        setLocalLoading(false)
        setLoading(false)
      }
    }
  }

  const handleItemClick = (team: Team) => {
    setSelectedTeam(team)
    setShowActionModal(true)
  }

  const handleUpdate = () => {
    if (selectedTeam) {
      setEditingTeam(selectedTeam)
      setFormData({ name: selectedTeam.name, season: selectedTeam.season || '' })
      setShowAddModal(true)
    }
  }

  const handleArchive = () => {
    if (selectedTeam) {
      setArchiveConfirm({ isOpen: true, team: selectedTeam })
    }
  }

  const handleDelete = () => {
    if (selectedTeam) {
      setDeleteConfirm({ isOpen: true, team: selectedTeam })
    }
  }

  const confirmDelete = async () => {
    if (deleteConfirm.team) {
      // Close modals immediately for better UX
      const teamToDelete = deleteConfirm.team
      setDeleteConfirm({ isOpen: false, team: null })
      setShowActionModal(false)
      setSelectedTeam(null)
      
      // Optimistically remove from UI
      setLocalTeams(prev => prev.filter(t => t.id !== teamToDelete.id))
      
      // Perform async operation in background
      try {
        setLocalLoading(true)
        setLoading(true)
        if (useSupabase) {
          await deleteTeam(teamToDelete.id)
        } else {
          onDelete(teamToDelete.id)
        }
      } catch (error) {
        console.error('Error deleting team:', error)
        // Revert optimistic update on error
        setLocalTeams(prev => [...prev, teamToDelete].sort((a, b) => a.name.localeCompare(b.name)))
        alert('Failed to delete team. Please try again.')
      } finally {
        setLocalLoading(false)
        setLoading(false)
      }
    }
  }

  const confirmArchive = async () => {
    if (archiveConfirm.team && onArchive) {
      try {
        setLocalLoading(true)
        setLoading(true)
        if (useSupabase) {
          await archiveTeam(archiveConfirm.team.id)
          setLocalTeams(localTeams.map(t => t.id === archiveConfirm.team!.id ? { ...t, status: 'archived' } : t))
        } else {
          onArchive(archiveConfirm.team.id)
        }
        setArchiveConfirm({ isOpen: false, team: null })
        setShowActionModal(false)
        setSelectedTeam(null)
      } catch (error) {
        console.error('Error archiving team:', error)
        alert('Failed to archive team. Please try again.')
      } finally {
        setLocalLoading(false)
        setLoading(false)
      }
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col h-full">
      {/* Sticky Header */}
      <div className="flex-shrink-0 sticky top-0 bg-surface z-10 pb-4 border-b border-border mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StanleyCup size={24} className="text-primary" />
            <h2 className="text-2xl font-bold text-text">Teams</h2>
          </div>
          <button
            onClick={() => {
              setEditingTeam(null)
              setFormData({ name: '', season: '' })
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 bg-primary text-text px-4 py-2 rounded-lg font-semibold hover:bg-primaryDark transition-colors"
            disabled={localLoading}
          >
            <AddIcon size={18} />
            Add Team
          </button>
        </div>

        {/* Filter Dropdown */}
        {((useSupabase && organizationId) || seasons.length > 0) && (
          <div>
            <label className="block text-sm font-semibold text-textSecondary mb-2">
              Filter by Season
            </label>
            <select
              value={selectedSeasonFilter}
              onChange={(e) => setSelectedSeasonFilter(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Seasons</option>
              {(() => {
                const seasonList = useSupabase ? availableSeasons : 
                  (seasons.length > 0 && typeof seasons[0] === 'string' ? [] : (seasons as unknown as Array<{ id: string; name: string }>))
                return seasonList.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))
              })()}
            </select>
          </div>
        )}
      </div>

      {/* Teams List - Scrollable */}
      <div className="flex-1 space-y-2 overflow-y-auto min-h-0">
        {localLoading && localTeams.length === 0 ? (
          <div className="text-center py-8 text-textSecondary">
            <p>Loading teams...</p>
          </div>
        ) : localTeams.length === 0 ? (
          <div className="text-center py-8 text-textSecondary">
            <HockeyPlayers size={48} className="mx-auto mb-2 opacity-50" />
            <p>No teams yet</p>
          </div>
        ) : (
          localTeams.map((team) => (
            <div
              key={team.id}
              onClick={() => handleItemClick(team)}
              className="bg-background border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-text">{team.name}</h3>
                  {team.status === 'archived' && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-warning/20 text-warning">
                      Archived
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-sm text-textSecondary">
                  {team.season && <span>{team.season}</span>}
                  <span>{team.players} players</span>
                  <span>{team.games} games</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Item Action Modal */}
      <ItemActionModal
        isOpen={showActionModal}
        itemName={selectedTeam?.name || ''}
        onUpdate={handleUpdate}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onClose={() => {
          setShowActionModal(false)
          setSelectedTeam(null)
        }}
        showArchive={!!onArchive}
      />

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text">
                {editingTeam ? 'Edit Team' : 'Add Team'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingTeam(null)
                  setFormData({ name: '', season: '' })
                }}
                className="text-textSecondary hover:text-text"
              >
                <CloseIcon size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">Team Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter team name"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                />
              </div>

              {seasons.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-textSecondary mb-2">Season</label>
                  <select
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                  >
                    <option value="">Select Season</option>
                    {seasons.map((season) => (
                      <option key={season} value={season}>{season}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={editingTeam ? handleEdit : handleAdd}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-text px-4 py-3 rounded-xl font-semibold hover:bg-primaryDark transition-colors"
                  disabled={localLoading}
                >
                  <SaveIcon size={18} />
                  {editingTeam ? 'Update' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingTeam(null)
                    setFormData({ name: '', season: '' })
                  }}
                  className="flex-1 bg-surface border border-border text-textSecondary px-4 py-3 rounded-xl font-semibold hover:bg-surfaceLight transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Team"
        message={`Are you sure you want to delete "${deleteConfirm.team?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, team: null })}
      />

      {/* Archive Confirmation Modal */}
      {onArchive && (
        <DeleteConfirmModal
          isOpen={archiveConfirm.isOpen}
          title="Archive Team"
          message={`Are you sure you want to archive "${archiveConfirm.team?.name}"?`}
          onConfirm={confirmArchive}
          onCancel={() => setArchiveConfirm({ isOpen: false, team: null })}
          isArchive={true}
        />
      )}
    </div>
  )
}

