'use client'

import React, { useState, useEffect } from 'react'
import { AddIcon, SaveIcon, CloseIcon, HockeyPlayer, MailIcon } from '@/components/icons/HockeyIcons'
import DeleteConfirmModal from './DeleteConfirmModal'
import PlayerSelectionModal from './PlayerSelectionModal'
import ItemActionModal from './ItemActionModal'
import { getUsers, createUser, updateUser, archiveUser, deleteUser, getPlayers } from '@/lib/supabase/queries'

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

interface User {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Coach' | 'Player' | 'Parent'
  team?: string
  status: 'active' | 'inactive' | 'archived'
  subscriptionTier?: string
  selectedRosterIds?: string[]
}

interface UserManagementProps {
  users: User[]
  onAdd: (user: Omit<User, 'id'>) => void
  onEdit: (id: string, user: Omit<User, 'id'>) => void
  onDelete: (id: string) => void
  onArchive?: (id: string) => void
  teams?: string[]
  players?: Player[]
  seasons?: { id: string; name: string }[]
  useSupabase?: boolean
  organizationId?: string
}

// Subscription tiers
const PLAYER_PARENT_TIERS = ['Basic', 'Premium', 'Pro']
const ORGANIZATION_TIERS = ['Starter', 'Professional', 'Enterprise']

export default function UserManagement({ users, onAdd, onEdit, onDelete, onArchive, teams = [], players: initialPlayers = [], seasons = [], useSupabase = false, organizationId }: UserManagementProps) {
  const [localUsers, setLocalUsers] = useState<User[]>(users)
  const [localPlayers, setLocalPlayers] = useState<Player[]>(initialPlayers)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPlayerSelection, setShowPlayerSelection] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; user: User | null }>({ isOpen: false, user: null })
  const [archiveConfirm, setArchiveConfirm] = useState<{ isOpen: boolean; user: User | null }>({ isOpen: false, user: null })
  const [selectedRosterIds, setSelectedRosterIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Player' as User['role'],
    team: '',
    status: 'active' as User['status'],
    subscriptionTier: ''
  })
  const [loading, setLoading] = useState(false)
  const [sendInvitation, setSendInvitation] = useState(true) // Default to sending invitation

  useEffect(() => {
    if (useSupabase) {
      loadUsers()
      loadPlayers()
    } else {
      setLocalUsers(users)
      setLocalPlayers(initialPlayers)
    }
  }, [useSupabase, users, initialPlayers, organizationId])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await getUsers(organizationId)
      // Map database roles (lowercase) to display roles (capitalized)
      const roleDisplayMap: Record<string, User['role']> = {
        'organizational': 'Admin',
        'coach': 'Coach',
        'player': 'Player',
        'parent': 'Parent'
      }
      
      setLocalUsers(data.map((u: any) => ({
        id: u.id,
        name: u.name || u.email?.split('@')[0] || '',
        email: u.email || '',
        role: (roleDisplayMap[u.role] || 'Player') as User['role'],
        team: undefined, // Users don't have direct team_id - use user_player_associations
        status: (u.status || 'active') as User['status'],
        subscriptionTier: u.subscription_tier || undefined,
        selectedRosterIds: [] // TODO: Load from user_roster_memberships table
      })))
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPlayers = async () => {
    try {
      const data = await getPlayers()
      setLocalPlayers(data)
    } catch (error) {
      console.error('Error loading players:', error)
    }
  }

  const handleAdd = async () => {
    if (formData.name && formData.email) {
      // For Player/Parent roles, require roster selection
      if ((formData.role === 'Player' || formData.role === 'Parent') && selectedRosterIds.length === 0) {
        alert('Please select at least one player/season/team combination for Player or Parent roles.')
        return
      }

      try {
        setLoading(true)
        if (useSupabase) {
          const newUser = await createUser({
            email: formData.email,
            name: formData.name,
            role: formData.role,
            organization_id: organizationId || undefined,
            // team_id removed - users don't have direct team_id column
            subscription_tier: formData.subscriptionTier || undefined,
            status: formData.status
          })
          setLocalUsers([...localUsers, {
            id: newUser.id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            team: formData.team || undefined,
            status: formData.status,
            subscriptionTier: formData.subscriptionTier || undefined,
            selectedRosterIds: (formData.role === 'Player' || formData.role === 'Parent') ? selectedRosterIds : undefined
          }])
        } else {
          onAdd({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            team: formData.team || undefined,
            status: formData.status,
            subscriptionTier: formData.subscriptionTier || undefined,
            selectedRosterIds: (formData.role === 'Player' || formData.role === 'Parent') ? selectedRosterIds : undefined
          })
        }
        setFormData({ name: '', email: '', role: 'Player', team: '', status: 'active', subscriptionTier: '' })
        setSelectedRosterIds([])
        setShowAddModal(false)
      } catch (error) {
        console.error('Error adding user:', error)
        alert('Failed to add user. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleEdit = async () => {
    if (editingUser && formData.name && formData.email) {
      // For Player/Parent roles, require roster selection
      if ((formData.role === 'Player' || formData.role === 'Parent') && selectedRosterIds.length === 0) {
        alert('Please select at least one player/season/team combination for Player or Parent roles.')
        return
      }

      try {
        setLoading(true)
        if (useSupabase) {
          await updateUser(editingUser.id, {
            email: formData.email,
            name: formData.name,
            role: formData.role,
            // team_id removed - users don't have direct team_id column
            subscription_tier: formData.subscriptionTier || undefined,
            status: formData.status
          })
          setLocalUsers(localUsers.map(u => u.id === editingUser.id ? {
            ...u,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            team: formData.team || undefined,
            status: formData.status,
            subscriptionTier: formData.subscriptionTier || undefined,
            selectedRosterIds: (formData.role === 'Player' || formData.role === 'Parent') ? selectedRosterIds : undefined
          } : u))
        } else {
          onEdit(editingUser.id, {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            team: formData.team || undefined,
            status: formData.status,
            subscriptionTier: formData.subscriptionTier || undefined,
            selectedRosterIds: (formData.role === 'Player' || formData.role === 'Parent') ? selectedRosterIds : undefined
          })
        }
        setEditingUser(null)
        setFormData({ name: '', email: '', role: 'Player', team: '', status: 'active', subscriptionTier: '' })
        setSelectedRosterIds([])
        setShowAddModal(false)
      } catch (error) {
        console.error('Error updating user:', error)
        alert('Failed to update user. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleItemClick = (user: User) => {
    setSelectedUser(user)
    setShowActionModal(true)
  }

  const handleUpdate = () => {
    if (selectedUser) {
      setEditingUser(selectedUser)
      setFormData({
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        team: selectedUser.team || '',
        status: selectedUser.status,
        subscriptionTier: selectedUser.subscriptionTier || ''
      })
      setSelectedRosterIds(selectedUser.selectedRosterIds || [])
      setShowAddModal(true)
    }
  }

  const handleArchive = () => {
    if (selectedUser) {
      setArchiveConfirm({ isOpen: true, user: selectedUser })
    }
  }

  const handleDelete = () => {
    if (selectedUser) {
      setDeleteConfirm({ isOpen: true, user: selectedUser })
    }
  }

  const confirmDelete = async () => {
    if (deleteConfirm.user) {
      try {
        setLoading(true)
        if (useSupabase) {
          await deleteUser(deleteConfirm.user.id)
          setLocalUsers(localUsers.filter(u => u.id !== deleteConfirm.user!.id))
        } else {
          onDelete(deleteConfirm.user.id)
        }
        setDeleteConfirm({ isOpen: false, user: null })
        setShowActionModal(false)
        setSelectedUser(null)
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Failed to delete user. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const confirmArchive = async () => {
    if (archiveConfirm.user && onArchive) {
      try {
        setLoading(true)
        if (useSupabase) {
          await archiveUser(archiveConfirm.user.id)
          setLocalUsers(localUsers.map(u => u.id === archiveConfirm.user!.id ? { ...u, status: 'archived' } : u))
        } else {
          onArchive(archiveConfirm.user.id)
        }
        setArchiveConfirm({ isOpen: false, user: null })
        setShowActionModal(false)
        setSelectedUser(null)
      } catch (error) {
        console.error('Error archiving user:', error)
        alert('Failed to archive user. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const getSelectedPlayersDisplay = () => {
    if (selectedRosterIds.length === 0) return 'No players selected'
    const selectedPlayers = localPlayers.filter((p: Player) => selectedRosterIds.includes(p.rosterId))
    if (selectedPlayers.length === 0) return 'No players selected'
    return `${selectedRosterIds.length} selected: ${selectedPlayers.map((p: Player) => 
      `${p.name} (#${p.jerseyNumber}) - ${p.teamName || 'Unknown'} - ${p.seasonName || 'Unknown'}`
    ).join(', ')}`
  }

  const subscriptionTiers = formData.role === 'Player' || formData.role === 'Parent' 
    ? PLAYER_PARENT_TIERS 
    : ORGANIZATION_TIERS

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'Admin': return 'bg-error/20 text-error'
      case 'Coach': return 'bg-primary/20 text-primary'
      case 'Player': return 'bg-success/20 text-success'
      case 'Parent': return 'bg-warning/20 text-warning'
      default: return 'bg-surface border border-border text-textSecondary'
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HockeyPlayer size={24} className="text-primary" />
          <h2 className="text-2xl font-bold text-text">Users</h2>
        </div>
        <button
          onClick={() => {
            setEditingUser(null)
            setFormData({ name: '', email: '', role: 'Player', team: '', status: 'active', subscriptionTier: '' })
            setSelectedRosterIds([])
            setShowAddModal(true)
          }}
          className="flex items-center gap-2 bg-primary text-text px-4 py-2 rounded-lg font-semibold hover:bg-primaryDark transition-colors"
          disabled={loading}
        >
          <AddIcon size={18} />
          Add User
        </button>
      </div>

      {/* Users List - Scrollable */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {loading && localUsers.length === 0 ? (
          <div className="text-center py-8 text-textSecondary">
            <p>Loading users...</p>
          </div>
        ) : localUsers.length === 0 ? (
          <div className="text-center py-8 text-textSecondary">
            <HockeyPlayer size={48} className="mx-auto mb-2 opacity-50" />
            <p>No users yet</p>
          </div>
        ) : (
          localUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleItemClick(user)}
              className="bg-background border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <HockeyPlayer size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-text">{user.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      user.status === 'active' ? 'bg-success/20 text-success' : 
                      user.status === 'archived' ? 'bg-warning/20 text-warning' : 
                      'bg-error/20 text-error'
                    }`}>
                      {user.status}
                    </span>
                    {user.subscriptionTier && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/20 text-primary">
                        {user.subscriptionTier}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-sm text-textSecondary">
                    <span className="flex items-center gap-1">
                      <MailIcon size={14} />
                      {user.email}
                    </span>
                    {user.team && <span>{user.team}</span>}
                    {user.selectedRosterIds && user.selectedRosterIds.length > 0 && (
                      <span>{user.selectedRosterIds.length} player(s)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Item Action Modal */}
      <ItemActionModal
        isOpen={showActionModal}
        itemName={selectedUser?.name || ''}
        onUpdate={handleUpdate}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onClose={() => {
          setShowActionModal(false)
          setSelectedUser(null)
        }}
        showArchive={!!onArchive}
      />

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text">
                {editingUser ? 'Edit User' : 'Add User'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingUser(null)
                  setFormData({ name: '', email: '', role: 'Player', team: '', status: 'active', subscriptionTier: '' })
                  setSelectedRosterIds([])
                }}
                className="text-textSecondary hover:text-text"
              >
                <CloseIcon size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter user name"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value as User['role']
                    setFormData({ ...formData, role: newRole })
                    // Clear roster selection if role changes away from Player/Parent
                    if (newRole !== 'Player' && newRole !== 'Parent') {
                      setSelectedRosterIds([])
                    }
                  }}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                >
                  <option value="Player">Player</option>
                  <option value="Coach">Coach</option>
                  <option value="Parent">Parent</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Player Selection for Player/Parent roles */}
              {(formData.role === 'Player' || formData.role === 'Parent') && localPlayers.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-textSecondary mb-2">
                    Select Player(s) - Season - Team
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPlayerSelection(true)}
                    className="w-full bg-primary/20 border border-primary rounded-xl px-4 py-3 text-text hover:bg-primary/30 transition-colors text-left"
                  >
                    {selectedRosterIds.length > 0 ? getSelectedPlayersDisplay() : 'Click to select players'}
                  </button>
                  {selectedRosterIds.length > 0 && (
                    <p className="text-xs text-textSecondary mt-1">
                      {selectedRosterIds.length} player/season/team combination(s) selected
                    </p>
                  )}
                </div>
              )}

              {/* Subscription Tier */}
              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">Subscription Tier</label>
                <select
                  value={formData.subscriptionTier}
                  onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                >
                  <option value="">No Subscription</option>
                  {subscriptionTiers.map((tier) => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
              </div>

                          <div>
                            <label className="block text-sm font-semibold text-textSecondary mb-2">Status</label>
                            <select
                              value={formData.status}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value as User['status'] })}
                              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="archived">Archived</option>
                            </select>
                          </div>

                          {/* Send Invitation Email Checkbox (only for new users) */}
                          {!editingUser && (
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="sendInvitation"
                                checked={sendInvitation}
                                onChange={(e) => setSendInvitation(e.target.checked)}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                              />
                              <label htmlFor="sendInvitation" className="text-sm text-textSecondary">
                                Send invitation email to user
                              </label>
                            </div>
                          )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={editingUser ? handleEdit : handleAdd}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-text px-4 py-3 rounded-xl font-semibold hover:bg-primaryDark transition-colors"
                  disabled={loading}
                >
                  <SaveIcon size={18} />
                  {editingUser ? 'Update' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingUser(null)
                    setFormData({ name: '', email: '', role: 'Player', team: '', status: 'active', subscriptionTier: '' })
                    setSelectedRosterIds([])
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

      {/* Player Selection Modal */}
      <PlayerSelectionModal
        isOpen={showPlayerSelection}
        selectedRosterIds={selectedRosterIds}
        players={localPlayers}
        seasons={seasons}
        teams={teams.map(t => ({ id: t, name: t }))}
        onConfirm={(rosterIds) => {
          setSelectedRosterIds(rosterIds)
          setShowPlayerSelection(false)
        }}
        onCancel={() => setShowPlayerSelection(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteConfirm.user?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, user: null })}
      />

      {/* Archive Confirmation Modal */}
      {onArchive && (
        <DeleteConfirmModal
          isOpen={archiveConfirm.isOpen}
          title="Archive User"
          message={`Are you sure you want to archive "${archiveConfirm.user?.name}"?`}
          onConfirm={confirmArchive}
          onCancel={() => setArchiveConfirm({ isOpen: false, user: null })}
          isArchive={true}
        />
      )}
    </div>
  )
}

