'use client'

import React, { useState, useEffect } from 'react'
import { AddIcon, SaveIcon, CloseIcon, GameSchedule } from '@/components/icons/HockeyIcons'
import DeleteConfirmModal from './DeleteConfirmModal'
import ItemActionModal from './ItemActionModal'
import { getSeasons, createSeason, updateSeason, archiveSeason, deleteSeason, getTeamCountForSeason } from '@/lib/supabase/queries'

interface Season {
  id: string
  name: string
  startDate: string
  endDate: string
  teams: number
  status?: 'active' | 'archived'
}

interface SeasonManagementProps {
  seasons: Season[]
  onAdd: (season: Omit<Season, 'id' | 'teams'>) => void
  onEdit: (id: string, season: Omit<Season, 'id' | 'teams'>) => void
  onDelete: (id: string) => void
  onArchive?: (id: string) => void
  useSupabase?: boolean
  organizationId?: string
}

export default function SeasonManagement({ seasons, onAdd, onEdit, onDelete, onArchive, useSupabase = false, organizationId }: SeasonManagementProps) {
  const [localSeasons, setLocalSeasons] = useState<Season[]>(seasons)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; season: Season | null }>({ isOpen: false, season: null })
  const [archiveConfirm, setArchiveConfirm] = useState<{ isOpen: boolean; season: Season | null }>({ isOpen: false, season: null })
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (useSupabase) {
      loadSeasons()
    } else {
      setLocalSeasons(seasons)
    }
  }, [useSupabase, seasons, organizationId])

  const loadSeasons = async () => {
    try {
      setLoading(true)
      const data = await getSeasons(organizationId)
      
      // Calculate team counts for each season
      const seasonsWithCounts = await Promise.all(
        data.map(async (s: any) => {
          const teamsCount = await getTeamCountForSeason(s.id)
          return {
            id: s.id,
            name: s.name,
            startDate: s.start_date || s.startDate,
            endDate: s.end_date || s.endDate,
            teams: teamsCount,
            status: s.status || 'active'
          }
        })
      )
      
      setLocalSeasons(seasonsWithCounts)
    } catch (error) {
      console.error('Error loading seasons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (formData.name && formData.startDate && formData.endDate) {
      try {
        setLoading(true)
        if (useSupabase) {
          const newSeason = await createSeason({
            name: formData.name,
            start_date: formData.startDate,
            end_date: formData.endDate,
            organization_id: organizationId || undefined,
            status: 'active'
          })
          setLocalSeasons([...localSeasons, {
            id: newSeason.id,
            name: newSeason.name,
            startDate: newSeason.start_date || newSeason.startDate,
            endDate: newSeason.end_date || newSeason.endDate,
            teams: 0,
            status: 'active'
          }])
        } else {
          onAdd({
            name: formData.name,
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: 'active'
          })
        }
        setFormData({ name: '', startDate: '', endDate: '' })
        setShowAddModal(false)
      } catch (error) {
        console.error('Error adding season:', error)
        alert('Failed to add season. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleEdit = async () => {
    if (editingSeason && formData.name && formData.startDate && formData.endDate) {
      try {
        setLoading(true)
        if (useSupabase) {
          await updateSeason(editingSeason.id, {
            name: formData.name,
            start_date: formData.startDate,
            end_date: formData.endDate,
            status: editingSeason.status || 'active'
          })
          setLocalSeasons(localSeasons.map(s => s.id === editingSeason.id ? {
            ...s,
            name: formData.name,
            startDate: formData.startDate,
            endDate: formData.endDate
          } : s))
        } else {
          onEdit(editingSeason.id, {
            name: formData.name,
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: editingSeason.status || 'active'
          })
        }
        setEditingSeason(null)
        setFormData({ name: '', startDate: '', endDate: '' })
        setShowAddModal(false)
      } catch (error) {
        console.error('Error updating season:', error)
        alert('Failed to update season. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleItemClick = (season: Season) => {
    setSelectedSeason(season)
    setShowActionModal(true)
  }

  const handleUpdate = () => {
    if (selectedSeason) {
      setEditingSeason(selectedSeason)
      setFormData({ name: selectedSeason.name, startDate: selectedSeason.startDate, endDate: selectedSeason.endDate })
      setShowAddModal(true)
    }
  }

  const handleArchive = () => {
    if (selectedSeason) {
      setArchiveConfirm({ isOpen: true, season: selectedSeason })
    }
  }

  const handleDelete = () => {
    if (selectedSeason) {
      setDeleteConfirm({ isOpen: true, season: selectedSeason })
    }
  }

  const confirmDelete = async () => {
    if (deleteConfirm.season) {
      try {
        setLoading(true)
        if (useSupabase) {
          await deleteSeason(deleteConfirm.season.id)
          setLocalSeasons(localSeasons.filter(s => s.id !== deleteConfirm.season!.id))
        } else {
          onDelete(deleteConfirm.season.id)
        }
        setDeleteConfirm({ isOpen: false, season: null })
        setShowActionModal(false)
        setSelectedSeason(null)
      } catch (error) {
        console.error('Error deleting season:', error)
        alert('Failed to delete season. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const confirmArchive = async () => {
    if (archiveConfirm.season && onArchive) {
      try {
        setLoading(true)
        if (useSupabase) {
          await archiveSeason(archiveConfirm.season.id)
          setLocalSeasons(localSeasons.map(s => s.id === archiveConfirm.season!.id ? { ...s, status: 'archived' } : s))
        } else {
          onArchive(archiveConfirm.season.id)
        }
        setArchiveConfirm({ isOpen: false, season: null })
        setShowActionModal(false)
        setSelectedSeason(null)
      } catch (error) {
        console.error('Error archiving season:', error)
        alert('Failed to archive season. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GameSchedule size={24} className="text-primary" />
          <h2 className="text-2xl font-bold text-text">Seasons</h2>
        </div>
        <button
          onClick={() => {
            setEditingSeason(null)
            setFormData({ name: '', startDate: '', endDate: '' })
            setShowAddModal(true)
          }}
          className="flex items-center gap-2 bg-primary text-text px-4 py-2 rounded-lg font-semibold hover:bg-primaryDark transition-colors"
          disabled={loading}
        >
          <AddIcon size={18} />
          Add Season
        </button>
      </div>

      {/* Seasons List - Scrollable */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {loading && localSeasons.length === 0 ? (
          <div className="text-center py-8 text-textSecondary">
            <p>Loading seasons...</p>
          </div>
        ) : localSeasons.length === 0 ? (
          <div className="text-center py-8 text-textSecondary">
            <GameSchedule size={48} className="mx-auto mb-2 opacity-50" />
            <p>No seasons yet</p>
          </div>
        ) : (
          localSeasons.map((season) => (
            <div
              key={season.id}
              onClick={() => handleItemClick(season)}
              className="bg-background border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-text">{season.name}</h3>
                  {season.status === 'archived' && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-warning/20 text-warning">
                      Archived
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-sm text-textSecondary">
                  <span>{new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}</span>
                  <span>{season.teams} teams</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Item Action Modal */}
      <ItemActionModal
        isOpen={showActionModal}
        itemName={selectedSeason?.name || ''}
        onUpdate={handleUpdate}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onClose={() => {
          setShowActionModal(false)
          setSelectedSeason(null)
        }}
        showArchive={!!onArchive}
      />

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text">
                {editingSeason ? 'Edit Season' : 'Add Season'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingSeason(null)
                  setFormData({ name: '', startDate: '', endDate: '' })
                }}
                className="text-textSecondary hover:text-text"
              >
                <CloseIcon size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">Season Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., 2024-2025"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={editingSeason ? handleEdit : handleAdd}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-text px-4 py-3 rounded-xl font-semibold hover:bg-primaryDark transition-colors"
                  disabled={loading}
                >
                  <SaveIcon size={18} />
                  {editingSeason ? 'Update' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingSeason(null)
                    setFormData({ name: '', startDate: '', endDate: '' })
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
        title="Delete Season"
        message={`Are you sure you want to delete "${deleteConfirm.season?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, season: null })}
      />

      {/* Archive Confirmation Modal */}
      {onArchive && (
        <DeleteConfirmModal
          isOpen={archiveConfirm.isOpen}
          title="Archive Season"
          message={`Are you sure you want to archive "${archiveConfirm.season?.name}"?`}
          onConfirm={confirmArchive}
          onCancel={() => setArchiveConfirm({ isOpen: false, season: null })}
          isArchive={true}
        />
      )}
    </div>
  )
}

