'use client'

import React, { useState, useEffect } from 'react'
import { AddIcon, SaveIcon, CloseIcon, HockeyPlayer } from '@/components/icons/HockeyIcons'
import DeleteConfirmModal from './DeleteConfirmModal'
import ItemActionModal from './ItemActionModal'
import { getPlayers, getPersonsWithRosters, createPlayer, updatePlayer, deletePlayer, getTeams, getSeasons } from '@/lib/supabase/queries'
import { supabase } from '@/lib/supabase'

interface RosterMembership {
  rosterId: string
  jerseyNumber: number | string
  teamId: string
  seasonId: string
  teamName?: string
  seasonName?: string
}

interface PersonWithRosters {
  id: string
  name: string
  dateOfBirth?: string
  height?: string
  weight?: string
  parentGuardianName?: string
  parentGuardianEmail?: string
  parentGuardianPhone?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  medicalConditions?: string
  allergies?: string
  notes?: string
  rosterMemberships: RosterMembership[]
}

interface PlayerManagementProps {
  players: Array<{
    id: string
    rosterId: string
    name: string
    jerseyNumber: number | string
    teamId: string
    seasonId: string
    teamName?: string
    seasonName?: string
  }>
  onAdd: (player: Omit<PersonWithRosters, 'id'>) => void
  onEdit: (id: string, player: Omit<PersonWithRosters, 'id'>) => void
  onDelete: (id: string) => void
  teams?: Array<{ id: string; name: string }>
  seasons?: Array<{ id: string; name: string }>
  useSupabase?: boolean
  organizationId?: string
}

export default function PlayerManagement({ 
  players, 
  onAdd, 
  onEdit, 
  onDelete, 
  teams = [], 
  seasons = [],
  useSupabase = false,
  organizationId
}: PlayerManagementProps) {
  const [persons, setPersons] = useState<PersonWithRosters[]>([])
  const [allPersons, setAllPersons] = useState<PersonWithRosters[]>([]) // Store all persons for filtering
  const [editingPerson, setEditingPerson] = useState<PersonWithRosters | null>(null)
  const [showAddEditModal, setShowAddEditModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<PersonWithRosters | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; person: PersonWithRosters | null }>({ isOpen: false, person: null })
  const [formData, setFormData] = useState({ 
    name: '',
    dateOfBirth: '',
    height: '',
    weight: '',
    parentGuardianName: '',
    parentGuardianEmail: '',
    parentGuardianPhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalConditions: '',
    allergies: '',
    notes: '',
    rosterMemberships: [{ jerseyNumber: '', teamId: '', seasonId: '' }] as Array<{ rosterId?: string; jerseyNumber: string; teamId: string; seasonId: string }>
  })
  const [loading, setLoading] = useState(false)
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<string>('')
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('')
  const [availableTeams, setAvailableTeams] = useState<Array<{ id: string; name: string }>>([])
  const [availableSeasons, setAvailableSeasons] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (useSupabase) {
      loadPersons()
      loadTeamsAndSeasons()
    } else {
      // Transform flat players array to persons with rosters
      const personsMap = new Map<string, PersonWithRosters>()
      players.forEach((player) => {
        if (!personsMap.has(player.id)) {
          personsMap.set(player.id, {
            id: player.id,
            name: player.name,
            rosterMemberships: []
          })
        }
        personsMap.get(player.id)!.rosterMemberships.push({
          rosterId: player.rosterId,
          jerseyNumber: player.jerseyNumber,
          teamId: player.teamId,
          seasonId: player.seasonId,
          teamName: player.teamName,
          seasonName: player.seasonName
        })
      })
      const personsList = Array.from(personsMap.values())
      setAllPersons(personsList)
      setPersons(personsList)
    }
  }, [useSupabase, players, organizationId])

  // Load teams and seasons for filters
  const loadTeamsAndSeasons = async () => {
    if (!useSupabase || !organizationId) return
    try {
      const [teamsData, seasonsData] = await Promise.all([
        getTeams(organizationId),
        getSeasons(organizationId)
      ])
      setAvailableTeams(teamsData.map((t: any) => ({ id: t.id, name: t.name })))
      setAvailableSeasons(seasonsData.map((s: any) => ({ id: s.id, name: s.name })))
    } catch (error) {
      console.error('Error loading teams and seasons:', error)
    }
  }

  // Filter persons based on selected season and team
  useEffect(() => {
    let filtered = allPersons

    if (selectedSeasonFilter) {
      filtered = filtered.filter(person =>
        person.rosterMemberships.some(rm => rm.seasonId === selectedSeasonFilter)
      )
    }

    if (selectedTeamFilter) {
      filtered = filtered.filter(person =>
        person.rosterMemberships.some(rm => rm.teamId === selectedTeamFilter)
      )
    }

    setPersons(filtered)
  }, [selectedSeasonFilter, selectedTeamFilter, allPersons])

  const loadPersons = async () => {
    try {
      setLoading(true)
      const data = await getPersonsWithRosters(organizationId)
      setAllPersons(data)
      // Filtering will be handled by the useEffect
    } catch (error) {
      console.error('Error loading persons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (formData.name && formData.rosterMemberships.length > 0) {
      // Validate all roster memberships
      const invalidMemberships = formData.rosterMemberships.filter(
        rm => !rm.jerseyNumber || !rm.teamId || !rm.seasonId
      )
      if (invalidMemberships.length > 0) {
        alert('Please fill in all required fields for each team/season combination.')
        return
      }

      try {
        setLoading(true)
        if (useSupabase) {
          if (!supabase) {
            throw new Error('Supabase client not available')
          }
          // Create person first
          let personId: string
          const { data: existingPerson } = await supabase
            .from('persons')
            .select('id')
            .eq('name', formData.name)
            .single()

          const personData: any = {
            name: formData.name,
            date_of_birth: formData.dateOfBirth || null,
            height: formData.height || null,
            weight: formData.weight || null,
            parent_guardian_name: formData.parentGuardianName || null,
            parent_guardian_email: formData.parentGuardianEmail || null,
            parent_guardian_phone: formData.parentGuardianPhone || null,
            emergency_contact_name: formData.emergencyContactName || null,
            emergency_contact_phone: formData.emergencyContactPhone || null,
            medical_conditions: formData.medicalConditions || null,
            allergies: formData.allergies || null,
            notes: formData.notes || null,
          }

          if (existingPerson) {
            personId = existingPerson.id
            await supabase.from('persons').update(personData).eq('id', personId)
          } else {
            const { data: newPerson, error: personError } = await supabase
              .from('persons')
              .insert([personData])
              .select()
              .single()
            
            if (personError) throw personError
            personId = newPerson.id
          }

          // Create roster memberships
          for (const rm of formData.rosterMemberships) {
            await createPlayer({
              name: formData.name,
              jersey_number: parseInt(rm.jerseyNumber) || rm.jerseyNumber,
              team_id: rm.teamId,
              season_id: rm.seasonId,
              dateOfBirth: formData.dateOfBirth || undefined,
              height: formData.height || undefined,
              weight: formData.weight || undefined,
              parentGuardianName: formData.parentGuardianName || undefined,
              parentGuardianEmail: formData.parentGuardianEmail || undefined,
              parentGuardianPhone: formData.parentGuardianPhone || undefined,
              emergencyContactName: formData.emergencyContactName || undefined,
              emergencyContactPhone: formData.emergencyContactPhone || undefined,
              medicalConditions: formData.medicalConditions || undefined,
              allergies: formData.allergies || undefined,
              notes: formData.notes || undefined,
            })
          }

          await loadPersons() // Reload to get updated data
        } else {
          onAdd({
            name: formData.name,
            dateOfBirth: formData.dateOfBirth,
            height: formData.height,
            weight: formData.weight,
            parentGuardianName: formData.parentGuardianName,
            parentGuardianEmail: formData.parentGuardianEmail,
            parentGuardianPhone: formData.parentGuardianPhone,
            emergencyContactName: formData.emergencyContactName,
            emergencyContactPhone: formData.emergencyContactPhone,
            medicalConditions: formData.medicalConditions,
            allergies: formData.allergies,
            notes: formData.notes,
            rosterMemberships: formData.rosterMemberships.map(rm => ({
              rosterId: '',
              jerseyNumber: parseInt(rm.jerseyNumber) || rm.jerseyNumber,
              teamId: rm.teamId,
              seasonId: rm.seasonId,
              teamName: teams.find(t => t.id === rm.teamId)?.name,
              seasonName: seasons.find(s => s.id === rm.seasonId)?.name
            }))
          })
        }
        setFormData({ 
          name: '', 
          dateOfBirth: '',
          height: '',
          weight: '',
          parentGuardianName: '',
          parentGuardianEmail: '',
          parentGuardianPhone: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          medicalConditions: '',
          allergies: '',
          notes: '',
          rosterMemberships: [{ jerseyNumber: '', teamId: '', seasonId: '' }] 
        })
        setShowAddEditModal(false)
      } catch (error) {
        console.error('Error adding player:', error)
        alert('Failed to add player. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleEdit = async () => {
    if (editingPerson && formData.name) {
      try {
        setLoading(true)
        if (useSupabase) {
          // Update person data
          const personUpdateData: any = {
            name: formData.name,
            date_of_birth: formData.dateOfBirth || null,
            height: formData.height || null,
            weight: formData.weight || null,
            parent_guardian_name: formData.parentGuardianName || null,
            parent_guardian_email: formData.parentGuardianEmail || null,
            parent_guardian_phone: formData.parentGuardianPhone || null,
            emergency_contact_name: formData.emergencyContactName || null,
            emergency_contact_phone: formData.emergencyContactPhone || null,
            medical_conditions: formData.medicalConditions || null,
            allergies: formData.allergies || null,
            notes: formData.notes || null,
          }

          if (!supabase) {
            throw new Error('Supabase client not available')
          }
          await supabase
            .from('persons')
            .update(personUpdateData)
            .eq('id', editingPerson.id)

          // Update or create roster memberships
          const existingRosterIds = editingPerson.rosterMemberships.map(rm => rm.rosterId)
          const formRosterIds = formData.rosterMemberships.map(rm => rm.rosterId).filter(id => id)
          
          // Update existing roster memberships
          for (let i = 0; i < Math.min(editingPerson.rosterMemberships.length, formData.rosterMemberships.length); i++) {
            const existingRoster = editingPerson.rosterMemberships[i]
            const updatedRoster = formData.rosterMemberships[i]
            await updatePlayer(existingRoster.rosterId, {
              jersey_number: parseInt(updatedRoster.jerseyNumber) || updatedRoster.jerseyNumber,
              team_id: updatedRoster.teamId,
              season_id: updatedRoster.seasonId,
            })
          }
          
          // Create new roster memberships if there are more in form than existing
          if (formData.rosterMemberships.length > editingPerson.rosterMemberships.length) {
            for (let i = editingPerson.rosterMemberships.length; i < formData.rosterMemberships.length; i++) {
              const newRoster = formData.rosterMemberships[i]
              await createPlayer({
                name: formData.name,
                jersey_number: parseInt(newRoster.jerseyNumber) || newRoster.jerseyNumber,
                team_id: newRoster.teamId,
                season_id: newRoster.seasonId,
                dateOfBirth: formData.dateOfBirth || undefined,
                height: formData.height || undefined,
                weight: formData.weight || undefined,
                parentGuardianName: formData.parentGuardianName || undefined,
                parentGuardianEmail: formData.parentGuardianEmail || undefined,
                parentGuardianPhone: formData.parentGuardianPhone || undefined,
                emergencyContactName: formData.emergencyContactName || undefined,
                emergencyContactPhone: formData.emergencyContactPhone || undefined,
                medicalConditions: formData.medicalConditions || undefined,
                allergies: formData.allergies || undefined,
                notes: formData.notes || undefined,
              })
            }
          }
          
          // Delete removed roster memberships
          const rostersToDelete = editingPerson.rosterMemberships.filter(
            rm => !formData.rosterMemberships.some(frm => frm.rosterId === rm.rosterId || (!frm.rosterId && frm.teamId === rm.teamId && frm.seasonId === rm.seasonId))
          )
          for (const rosterToDelete of rostersToDelete) {
            await deletePlayer(rosterToDelete.rosterId)
          }
          
          await loadPersons()
        } else {
          onEdit(editingPerson.id, {
            name: formData.name,
            dateOfBirth: formData.dateOfBirth,
            height: formData.height,
            weight: formData.weight,
            parentGuardianName: formData.parentGuardianName,
            parentGuardianEmail: formData.parentGuardianEmail,
            parentGuardianPhone: formData.parentGuardianPhone,
            emergencyContactName: formData.emergencyContactName,
            emergencyContactPhone: formData.emergencyContactPhone,
            medicalConditions: formData.medicalConditions,
            allergies: formData.allergies,
            notes: formData.notes,
            rosterMemberships: editingPerson.rosterMemberships
          })
        }
        setEditingPerson(null)
        setFormData({ 
          name: '', 
          dateOfBirth: '',
          height: '',
          weight: '',
          parentGuardianName: '',
          parentGuardianEmail: '',
          parentGuardianPhone: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          medicalConditions: '',
          allergies: '',
          notes: '',
          rosterMemberships: [{ jerseyNumber: '', teamId: '', seasonId: '' }] 
        })
        setShowAddEditModal(false)
      } catch (error) {
        console.error('Error updating player:', error)
        alert('Failed to update player. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const openAddEditModal = (person: PersonWithRosters | null) => {
    setEditingPerson(person)
    if (person) {
      setFormData({ 
        name: person.name,
        dateOfBirth: person.dateOfBirth || '',
        height: person.height || '',
        weight: person.weight || '',
        parentGuardianName: person.parentGuardianName || '',
        parentGuardianEmail: person.parentGuardianEmail || '',
        parentGuardianPhone: person.parentGuardianPhone || '',
        emergencyContactName: person.emergencyContactName || '',
        emergencyContactPhone: person.emergencyContactPhone || '',
        medicalConditions: person.medicalConditions || '',
        allergies: person.allergies || '',
        notes: person.notes || '',
        rosterMemberships: person.rosterMemberships.map(rm => ({
          rosterId: rm.rosterId,
          jerseyNumber: String(rm.jerseyNumber),
          teamId: rm.teamId,
          seasonId: rm.seasonId
        }))
      })
    } else {
      setFormData({ 
        name: '', 
        dateOfBirth: '',
        height: '',
        weight: '',
        parentGuardianName: '',
        parentGuardianEmail: '',
        parentGuardianPhone: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        medicalConditions: '',
        allergies: '',
        notes: '',
        rosterMemberships: [{ jerseyNumber: '', teamId: '', seasonId: '' }] 
      })
    }
    setShowAddEditModal(true)
  }

  const handleItemClick = (person: PersonWithRosters) => {
    setSelectedPerson(person)
    setShowActionModal(true)
  }

  const handleDeleteClick = () => {
    if (selectedPerson) {
      setDeleteConfirm({ isOpen: true, person: selectedPerson })
    }
  }

  const confirmDelete = async () => {
    if (deleteConfirm.person) {
      try {
        setLoading(true)
        if (useSupabase) {
          // Delete all roster memberships for this person
          for (const rm of deleteConfirm.person.rosterMemberships) {
            await deletePlayer(rm.rosterId)
          }
          // Optionally delete the person record too
          // await supabase.from('persons').delete().eq('id', deleteConfirm.person.id)
          await loadPersons()
        } else {
          onDelete(deleteConfirm.person.id)
        }
        setDeleteConfirm({ isOpen: false, person: null })
        setShowActionModal(false)
        setSelectedPerson(null)
      } catch (error) {
        console.error('Error deleting player:', error)
        alert('Failed to delete player. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const addRosterMembership = () => {
    setFormData({
      ...formData,
      rosterMemberships: [...formData.rosterMemberships, { jerseyNumber: '', teamId: '', seasonId: '' }]
    })
  }

  const removeRosterMembership = (index: number) => {
    if (formData.rosterMemberships.length > 1) {
      setFormData({
        ...formData,
        rosterMemberships: formData.rosterMemberships.filter((_, i) => i !== index)
      })
    }
  }

  const updateRosterMembership = (index: number, field: 'jerseyNumber' | 'teamId' | 'seasonId', value: string) => {
    const updated = [...formData.rosterMemberships]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, rosterMemberships: updated })
  }

  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return ''
    // Convert YYYY-MM-DD to MM/DD/YYYY for display
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`
  }

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return ''
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString
    // Convert MM/DD/YYYY to YYYY-MM-DD
    const parts = dateString.split('/')
    if (parts.length === 3) {
      return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
    }
    return dateString
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col h-full">
      {/* Sticky Header */}
      <div className="flex-shrink-0 sticky top-0 bg-surface z-10 pb-4 border-b border-border mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HockeyPlayer size={24} className="text-primary" />
            <h2 className="text-2xl font-bold text-text">Players</h2>
          </div>
          <button
            onClick={() => openAddEditModal(null)}
            className="flex items-center gap-2 bg-primary text-text px-4 py-2 rounded-lg font-semibold hover:bg-primaryDark transition-colors"
            disabled={loading}
          >
            <AddIcon size={18} />
            Add Player
          </button>
        </div>

        {/* Filter Dropdowns */}
        {((useSupabase && organizationId) || teams.length > 0 || seasons.length > 0) && (
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-textSecondary mb-2">
                Filter by Season
              </label>
              <select
                value={selectedSeasonFilter}
                onChange={(e) => setSelectedSeasonFilter(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Seasons</option>
                {(useSupabase ? availableSeasons : seasons).map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-textSecondary mb-2">
                Filter by Team
              </label>
              <select
                value={selectedTeamFilter}
                onChange={(e) => setSelectedTeamFilter(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Teams</option>
                {(useSupabase ? availableTeams : teams).map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Players List - Scrollable */}
      <div className="flex-1 space-y-2 overflow-y-auto min-h-0">
        {loading && persons.length === 0 ? (
          <div className="text-center py-8 text-textSecondary">
            <p>Loading players...</p>
          </div>
        ) : persons.length === 0 ? (
          <div className="text-center py-8 text-textSecondary">
            <HockeyPlayer size={48} className="mx-auto mb-2 opacity-50" />
            <p>No players yet</p>
          </div>
        ) : (
          persons.map((person) => (
            <div
              key={person.id}
              onClick={() => handleItemClick(person)}
              className="bg-background border border-border rounded-xl p-4 hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-text">{person.name}</h3>
                  {person.rosterMemberships.length > 0 && (
                    <span className="text-sm text-textSecondary">
                      #{person.rosterMemberships[0].jerseyNumber}
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm text-textSecondary">
                  {person.rosterMemberships.map((rm) => (
                    <div key={rm.rosterId} className="flex items-center gap-2">
                      <span>#{rm.jerseyNumber}</span>
                      <span>•</span>
                      <span>{rm.teamName || 'Unknown Team'}</span>
                      <span>•</span>
                      <span>{rm.seasonName || 'Unknown Season'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text">
                {editingPerson ? 'Edit Player' : 'Add Player'}
              </h3>
              <button
                onClick={() => {
                  setShowAddEditModal(false)
                  setEditingPerson(null)
                  setFormData({ 
                    name: '', 
                    dateOfBirth: '',
                    height: '',
                    weight: '',
                    parentGuardianName: '',
                    parentGuardianEmail: '',
                    parentGuardianPhone: '',
                    emergencyContactName: '',
                    emergencyContactPhone: '',
                    medicalConditions: '',
                    allergies: '',
                    notes: '',
                    rosterMemberships: [{ jerseyNumber: '', teamId: '', seasonId: '' }] 
                  })
                }}
                className="text-textSecondary hover:text-text"
              >
                <CloseIcon size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-textSecondary mb-2">Player Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter player name"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-textSecondary mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={formatDateForInput(formData.dateOfBirth)}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-textSecondary mb-2">Height</label>
                  <input
                    type="text"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    placeholder="e.g., 5'8&quot;"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-textSecondary mb-2">Weight</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="e.g., 150 lbs"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                  />
                </div>
              </div>


              {/* Roster Memberships */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-textSecondary">Team/Season Assignments *</h4>
                  {!editingPerson && (
                    <button
                      type="button"
                      onClick={addRosterMembership}
                      className="text-sm text-primary hover:text-primaryDark"
                    >
                      + Add Another
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {formData.rosterMemberships.map((rm, index) => (
                    <div key={index} className="bg-background border border-border rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-textSecondary">Assignment {index + 1}</span>
                        {formData.rosterMemberships.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRosterMembership(index)}
                            className="text-sm text-error hover:text-errorDark"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-textSecondary mb-1">Jersey # *</label>
                          <input
                            type="number"
                            value={rm.jerseyNumber}
                            onChange={(e) => updateRosterMembership(index, 'jerseyNumber', e.target.value)}
                            placeholder="#"
                            min="0"
                            max="99"
                            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm"
                          />
                        </div>
                        {seasons.length > 0 && (
                          <div>
                            <label className="block text-xs text-textSecondary mb-1">Season *</label>
                            <select
                              value={rm.seasonId || ''}
                              onChange={(e) => {
                                updateRosterMembership(index, 'seasonId', e.target.value)
                              }}
                              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm"
                            >
                              <option value="">Select Season</option>
                              {seasons
                                .filter(season => {
                                  // Filter out seasons already used in other assignments with the same team (prevent duplicates)
                                  // Only filter if both team and season are selected in another assignment
                                  if (!rm.teamId) {
                                    // If no team selected yet, allow all seasons
                                    return true
                                  }
                                  const isUsed = formData.rosterMemberships.some((otherRm, otherIndex) => 
                                    otherIndex !== index && 
                                    otherRm.seasonId === season.id && 
                                    otherRm.teamId === rm.teamId &&
                                    otherRm.teamId // Make sure the other assignment also has a team
                                  )
                                  return !isUsed
                                })
                                .map((season) => (
                                  <option key={season.id} value={season.id}>{season.name}</option>
                                ))}
                            </select>
                            {rm.seasonId && (
                              <div className="mt-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg">
                                <div className="text-xs font-semibold text-textSecondary mb-1">Selected Season:</div>
                                <div className="text-sm font-semibold text-text">
                                  {seasons.find(s => s.id === rm.seasonId)?.name || 
                                   (editingPerson?.rosterMemberships[index]?.seasonName) || 
                                   'Unknown Season'}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {teams.length > 0 && (
                          <div>
                            <label className="block text-xs text-textSecondary mb-1">Team *</label>
                            <select
                              value={rm.teamId || ''}
                              onChange={(e) => {
                                updateRosterMembership(index, 'teamId', e.target.value)
                              }}
                              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm"
                            >
                              <option value="">Select Team</option>
                              {teams
                                .filter(team => {
                                  // Filter out teams already used in other assignments with the same season (prevent duplicates)
                                  // Only filter if both team and season are selected in another assignment
                                  if (!rm.seasonId) {
                                    // If no season selected yet, allow all teams
                                    return true
                                  }
                                  const isUsed = formData.rosterMemberships.some((otherRm, otherIndex) => 
                                    otherIndex !== index && 
                                    otherRm.teamId === team.id && 
                                    otherRm.seasonId === rm.seasonId &&
                                    otherRm.seasonId // Make sure the other assignment also has a season
                                  )
                                  return !isUsed
                                })
                                .map((team) => (
                                  <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                            {rm.teamId && (
                              <div className="mt-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg">
                                <div className="text-xs font-semibold text-textSecondary mb-1">Selected Team:</div>
                                <div className="text-sm font-semibold text-text">
                                  {teams.find(t => t.id === rm.teamId)?.name || 
                                   (editingPerson?.rosterMemberships[index]?.teamName) || 
                                   'Unknown Team'}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={editingPerson ? handleEdit : handleAdd}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-text px-4 py-3 rounded-xl font-semibold hover:bg-primaryDark transition-colors"
                  disabled={loading}
                >
                  <SaveIcon size={18} />
                  {editingPerson ? 'Update' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setShowAddEditModal(false)
                    setEditingPerson(null)
                    setFormData({ 
                      name: '', 
                      dateOfBirth: '',
                      height: '',
                      weight: '',
                      parentGuardianName: '',
                      parentGuardianEmail: '',
                      parentGuardianPhone: '',
                      emergencyContactName: '',
                      emergencyContactPhone: '',
                      medicalConditions: '',
                      allergies: '',
                      notes: '',
                      rosterMemberships: [{ jerseyNumber: '', teamId: '', seasonId: '' }] 
                    })
                  }}
                  className="flex-1 bg-surface border border-border text-textSecondary px-4 py-3 rounded-xl font-semibold hover:bg-surfaceLight transition-colors"
                >
                  <CloseIcon size={18} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Action Modal */}
      <ItemActionModal
        isOpen={showActionModal}
        itemName={selectedPerson ? selectedPerson.name : 'Player'}
        onUpdate={() => openAddEditModal(selectedPerson)}
        onArchive={() => {}} // Players don't have archive
        onDelete={handleDeleteClick}
        onClose={() => {
          setShowActionModal(false)
          setSelectedPerson(null)
        }}
        showArchive={false}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Player"
        message={`Are you sure you want to delete "${deleteConfirm.person?.name}" and all their team/season assignments? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, person: null })}
      />
    </div>
  )
}
