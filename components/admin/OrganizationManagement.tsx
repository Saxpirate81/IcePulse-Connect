'use client'

import React, { useState, useEffect } from 'react'
import { AddIcon, SaveIcon, CloseIcon, HockeyArena } from '@/components/icons/HockeyIcons'
import ItemActionModal from './ItemActionModal'
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization, getOrganizationCounts } from '@/lib/supabase/queries'

interface Organization {
  id: string
  name: string
  teams: number
  players: number
  status: 'active' | 'inactive'
}

interface OrganizationManagementProps {
  organizations: Organization[]
  onAdd: (org: Omit<Organization, 'id' | 'teams' | 'players'>) => void
  onEdit: (id: string, org: Omit<Organization, 'id' | 'teams' | 'players'>) => void
  onDelete: (id: string) => void
  useSupabase?: boolean
}

export default function OrganizationManagement({ organizations, onAdd, onEdit, onDelete, useSupabase = false }: OrganizationManagementProps) {
  const [localOrganizations, setLocalOrganizations] = useState<Organization[]>(organizations)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    status: 'active' as Organization['status'] 
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (useSupabase) {
      loadOrganizations()
    } else {
      setLocalOrganizations(organizations)
    }
  }, [useSupabase, organizations])

  // Reload when component mounts if using Supabase
  useEffect(() => {
    if (useSupabase) {
      loadOrganizations()
    }
  }, [useSupabase])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const data = await getOrganizations()
      
      // Calculate counts for each organization
      const orgsWithCounts = await Promise.all(
        data.map(async (o: any) => {
          const counts = await getOrganizationCounts(o.id)
          return {
            id: o.id,
            name: o.name,
            teams: counts.teams,
            players: counts.players,
            status: (o.status || 'active') as Organization['status']
          }
        })
      )
      
      // If more than one organization exists, only show the first one
      // and log a warning
      if (orgsWithCounts.length > 1) {
        console.warn(`Multiple organizations found (${orgsWithCounts.length}). Only showing the first one. Please delete extra organizations.`)
        setLocalOrganizations([orgsWithCounts[0]])
      } else {
        setLocalOrganizations(orgsWithCounts)
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (formData.name) {
      // Prevent creating more than one organization
      if (localOrganizations.length > 0) {
        alert('Only one organization is allowed. Please edit the existing organization instead.')
        return
      }
      
      try {
        setLoading(true)
        if (useSupabase) {
          // Check if any organizations exist in database
          const existingOrgs = await getOrganizations()
          if (existingOrgs.length > 0) {
            alert('Only one organization is allowed. Please edit the existing organization instead.')
            setLoading(false)
            return
          }
          
          const newOrg = await createOrganization({
            name: formData.name,
            status: formData.status
          })
          setLocalOrganizations([{
            id: newOrg.id,
            name: newOrg.name,
            teams: 0,
            players: 0,
            status: (newOrg.status || 'active') as Organization['status']
          }])
        } else {
          onAdd({
            name: formData.name,
            status: formData.status
          })
        }
        setFormData({ 
          name: '', 
          status: 'active' 
        })
        setShowAddModal(false)
      } catch (error) {
        console.error('Error adding organization:', error)
        alert('Failed to add organization. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const loadOrganizationDetails = async (orgId: string) => {
    try {
      const { getOrganization } = await import('@/lib/supabase/queries')
      const org = await getOrganization(orgId)
      setFormData({
        name: org.name || '',
        status: (org.status || 'active') as Organization['status']
      })
    } catch (error) {
      console.error('Error loading organization details:', error)
      // Fallback to basic data
      const org = localOrganizations.find(o => o.id === orgId)
      if (org) {
        setFormData({ 
          name: org.name, 
          status: org.status 
        })
      }
    }
  }

  const handleUpdate = () => {
    if (selectedOrg) {
      setEditingOrg(selectedOrg)
      // Load organization details from database if using Supabase
      if (useSupabase) {
        loadOrganizationDetails(selectedOrg.id)
      } else {
        setFormData({ 
          name: selectedOrg.name, 
          status: selectedOrg.status 
        })
      }
      setShowAddModal(true)
    }
  }

  const handleEdit = async () => {
    if (editingOrg && formData.name) {
      try {
        setLoading(true)
        if (useSupabase) {
          await updateOrganization(editingOrg.id, {
            name: formData.name,
            status: formData.status
          })
          setLocalOrganizations(localOrganizations.map(o => o.id === editingOrg.id ? {
            ...o,
            name: formData.name,
            status: formData.status
          } : o))
        } else {
          onEdit(editingOrg.id, {
            name: formData.name,
            status: formData.status
          })
        }
        setEditingOrg(null)
        setFormData({ 
          name: '', 
          status: 'active' 
        })
        setShowAddModal(false)
      } catch (error) {
        console.error('Error updating organization:', error)
        alert('Failed to update organization. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleItemClick = (org: Organization) => {
    setSelectedOrg(org)
    setShowActionModal(true)
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HockeyArena size={24} className="text-primary" />
          <h2 className="text-2xl font-bold text-text">Organization</h2>
        </div>
        <div className="flex items-center gap-2">
          {useSupabase && (
            <button
              onClick={() => loadOrganizations()}
              className="flex items-center gap-2 bg-surface border border-border text-textSecondary px-3 py-2 rounded-lg text-sm font-semibold hover:bg-surfaceLight transition-colors"
              disabled={loading}
              title="Refresh organizations from database"
            >
              🔄 Refresh
            </button>
          )}
        {localOrganizations.length === 0 && (
          <button
            onClick={() => {
              setEditingOrg(null)
              setFormData({ 
                name: '', 
                status: 'active' 
              })
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 bg-primary text-text px-4 py-2 rounded-lg font-semibold hover:bg-primaryDark transition-colors"
            disabled={loading}
            title="Only one organization is allowed"
          >
            <AddIcon size={18} />
            Create Organization
          </button>
        )}
        </div>
      </div>

      {/* Organization Display - Only one organization */}
      <div className="space-y-2">
        {loading && localOrganizations.length === 0 ? (
          <div className="text-center py-8 text-textSecondary">
            <p>Loading organization...</p>
          </div>
        ) : localOrganizations.length === 0 ? (
          <div className="text-center py-8 text-textSecondary">
            <HockeyArena size={48} className="mx-auto mb-2 opacity-50" />
            <p>No organization set up yet</p>
            <p className="text-xs mt-2">Click &quot;Create Organization&quot; to get started</p>
          </div>
        ) : (
          // Only show the first organization (there should only be one)
          localOrganizations.length > 0 && (
            <div
              key={localOrganizations[0].id}
              onClick={() => handleItemClick(localOrganizations[0])}
              className="bg-background border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-text">{localOrganizations[0].name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    localOrganizations[0].status === 'active' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                  }`}>
                    {localOrganizations[0].status}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-textSecondary">
                  <span>{localOrganizations[0].teams} teams</span>
                  <span>{localOrganizations[0].players} players</span>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Item Action Modal - Only Update for Organization (no Archive/Delete) */}
      <ItemActionModal
        isOpen={showActionModal}
        itemName={selectedOrg?.name || ''}
        onUpdate={handleUpdate}
        onArchive={() => {}} // Not used for organizations
        onDelete={() => {}} // Not used for organizations
        onClose={() => {
          setShowActionModal(false)
          setSelectedOrg(null)
        }}
        showArchive={false} // Organizations can't be archived
        showDelete={false} // Organizations can't be deleted
      />

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text">
                {editingOrg ? 'Edit Organization' : 'Create Organization'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingOrg(null)
                  setFormData({ 
                name: '', 
                status: 'active' 
              })
                }}
                className="text-textSecondary hover:text-text"
              >
                <CloseIcon size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">Organization Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter organization name"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Organization['status'] })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={editingOrg ? handleEdit : handleAdd}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-text px-4 py-3 rounded-xl font-semibold hover:bg-primaryDark transition-colors"
                  disabled={loading}
                >
                  <SaveIcon size={18} />
                  {editingOrg ? 'Update' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingOrg(null)
                    setFormData({ 
                name: '', 
                status: 'active' 
              })
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
    </div>
  )
}

