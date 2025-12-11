'use client'

import React, { useState, useEffect } from 'react'
import { AddIcon, SaveIcon, CloseIcon, GameSchedule } from '@/components/icons/HockeyIcons'
import DeleteConfirmModal from './DeleteConfirmModal'
import ItemActionModal from './ItemActionModal'
import { getGames, createGame, updateGame, archiveGame, deleteGame, getTeams, getSeasons } from '@/lib/supabase/queries'

interface Game {
  id: string
  team: string
  teamId?: string // For filtering
  opponent: string
  date: string
  startTime?: string // 12hr format: "2:30 PM"
  season: string
  seasonId?: string // For filtering
  location?: string
  periodLength?: number
  youtubeVideoId?: string
  status?: 'active' | 'archived'
}

interface GameManagementProps {
  games: Game[]
  onAdd: (game: Omit<Game, 'id'>) => void
  onEdit: (id: string, game: Omit<Game, 'id'>) => void
  onDelete: (id: string) => void
  onArchive?: (id: string) => void
  teams?: Array<{ id: string; name: string }> | string[]
  seasons?: Array<{ id: string; name: string }> | string[]
  useSupabase?: boolean
  organizationId?: string
}

export default function GameManagement({ games, onAdd, onEdit, onDelete, onArchive, teams = [], seasons = [], useSupabase = false, organizationId }: GameManagementProps) {
  const [localGames, setLocalGames] = useState<Game[]>(games)
  const [allGames, setAllGames] = useState<Game[]>(games) // Store all games for filtering
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; game: Game | null }>({ isOpen: false, game: null })
  const [archiveConfirm, setArchiveConfirm] = useState<{ isOpen: boolean; game: Game | null }>({ isOpen: false, game: null })
  const [formData, setFormData] = useState({
    team: '',
    opponent: '',
    date: '',
    startTime: '',
    season: '',
    location: '',
    periodLength: '20',
    youtubeVideoId: ''
  })
  const [loading, setLoading] = useState(false)
  const [availableTeams, setAvailableTeams] = useState<Array<{ id: string; name: string }>>([])
  const [availableSeasons, setAvailableSeasons] = useState<Array<{ id: string; name: string }>>([])
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<string>('')
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('')

  useEffect(() => {
    if (useSupabase) {
      // Load teams and seasons first, then games (so we can map names)
      loadTeamsAndSeasons().then(() => {
        loadGames()
      })
    } else {
      setLocalGames(games)
      // Handle legacy string arrays
      if (teams.length > 0 && typeof teams[0] === 'string') {
        setAvailableTeams((teams as string[]).map((t, i) => ({ id: String(i), name: t })))
      } else if (teams.length > 0) {
        setAvailableTeams(teams as Array<{ id: string; name: string }>)
      }
      if (seasons.length > 0 && typeof seasons[0] === 'string') {
        setAvailableSeasons((seasons as string[]).map((s, i) => ({ id: String(i), name: s })))
      } else if (seasons.length > 0) {
        setAvailableSeasons(seasons as Array<{ id: string; name: string }>)
      }
    }
  }, [useSupabase, games, organizationId, teams, seasons])

  const loadTeamsAndSeasons = async () => {
    if (!useSupabase || !organizationId) return Promise.resolve()
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

  const loadGames = async () => {
    try {
      setLoading(true)
      const data = await getGames(undefined, undefined, organizationId)
      
      // Get team names mapping (fallback if join doesn't work)
      const teamNamesMap = new Map<string, string>()
      availableTeams.forEach(t => teamNamesMap.set(t.id, t.name))
      
      // Get season names mapping (fallback if join doesn't work)
      const seasonNamesMap = new Map<string, string>()
      availableSeasons.forEach(s => seasonNamesMap.set(s.id, s.name))
      
      // Transform Supabase data to match Game interface
      setLocalGames(data.map((g: any) => {
        // Get team name from joined data or fallback to mapping
        const teamName = g.team?.name || teamNamesMap.get(g.team_id) || ''
        
        // Get season name from joined data or fallback to mapping
        const seasonName = g.season?.name || seasonNamesMap.get(g.season_id) || ''
        
        // Format start time to 12-hour format if it exists
        let formattedStartTime = ''
        if (g.start_time) {
          formattedStartTime = convertTo12Hour(g.start_time)
        }
        
        // Format date
        let formattedDate = ''
        if (g.game_date) {
          try {
            const date = new Date(g.game_date)
            formattedDate = date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'numeric', 
              day: 'numeric' 
            })
          } catch (e) {
            formattedDate = g.game_date
          }
        }
        
        return {
          id: g.id,
          team: teamName,
          teamId: g.team_id || '',
          opponent: g.opponent_name || '',
          date: formattedDate || g.game_date || '',
          startTime: formattedStartTime,
          season: seasonName,
          seasonId: g.season_id || '',
          location: g.location || '',
          status: g.status || 'scheduled'
        }
      }))
      
      setAllGames(data.map((g: any) => {
        const teamName = g.team?.name || teamNamesMap.get(g.team_id) || ''
        const seasonName = g.season?.name || seasonNamesMap.get(g.season_id) || ''
        let formattedStartTime = ''
        if (g.start_time) {
          formattedStartTime = convertTo12Hour(g.start_time)
        }
        let formattedDate = ''
        if (g.game_date) {
          try {
            const date = new Date(g.game_date)
            formattedDate = date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'numeric', 
              day: 'numeric' 
            })
          } catch (e) {
            formattedDate = g.game_date
          }
        }
        return {
          id: g.id,
          team: teamName,
          teamId: g.team_id || '',
          opponent: g.opponent_name || '',
          date: formattedDate || g.game_date || '',
          startTime: formattedStartTime,
          season: seasonName,
          seasonId: g.season_id || '',
          location: g.location || '',
          youtubeVideoId: g.youtube_video_id || undefined,
          status: g.status || 'scheduled'
        }
      }))
      
      // Filtering will be handled by useEffect
    } catch (error) {
      console.error('Error loading games:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter games based on selected season and team
  useEffect(() => {
    let filtered = allGames

    if (selectedSeasonFilter) {
      filtered = filtered.filter(game => {
        if (game.seasonId) {
          return game.seasonId === selectedSeasonFilter
        }
        // Fallback: match by season name
        const seasonList = useSupabase ? availableSeasons : 
          (typeof seasons[0] === 'string' ? [] : seasons as Array<{ id: string; name: string }>)
        const season = seasonList.find(s => s.id === selectedSeasonFilter)
        return season ? game.season === season.name : false
      })
    }

    if (selectedTeamFilter) {
      filtered = filtered.filter(game => {
        if (game.teamId) {
          return game.teamId === selectedTeamFilter
        }
        // Fallback: match by team name
        const teamList = useSupabase ? availableTeams : 
          (typeof teams[0] === 'string' ? [] : teams as Array<{ id: string; name: string }>)
        const team = teamList.find(t => t.id === selectedTeamFilter)
        return team ? game.team === team.name : false
      })
    }

    setLocalGames(filtered)
  }, [selectedSeasonFilter, selectedTeamFilter, allGames, useSupabase, availableSeasons, availableTeams, seasons, teams])

  // Extract YouTube video ID from URL or return as-is if already an ID
  const extractYouTubeVideoId = (input: string): string => {
    if (!input) return ''
    
    // If it's already just an ID (no special characters), return it
    if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
      return input.trim()
    }
    
    // Try to extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/,
    ]
    
    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    // If no pattern matches, return the input as-is (might be a custom ID format)
    return input.trim()
  }

  // Convert 24hr to 12hr format
  const convertTo12Hour = (time24: string): string => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes || '00'} ${ampm}`
  }

  // Convert 12hr to 24hr format for storage
  const convertTo24Hour = (time12: string): string => {
    if (!time12) return ''
    const [time, ampm] = time12.split(' ')
    const [hours, minutes] = time.split(':')
    let hour = parseInt(hours)
    if (ampm === 'PM' && hour !== 12) hour += 12
    if (ampm === 'AM' && hour === 12) hour = 0
    return `${String(hour).padStart(2, '0')}:${minutes || '00'}`
  }

  const handleAdd = async () => {
    console.log('handleAdd called', { formData, useSupabase, availableTeams, availableSeasons })
    if (!formData.team || !formData.opponent || !formData.date) {
      alert('Please fill in all required fields: Team, Opponent, and Date')
      return
    }
    try {
      setLoading(true)
      if (useSupabase) {
        console.log('Creating game with:', {
          team_id: formData.team,
          season_id: formData.season || undefined,
          opponent_name: formData.opponent,
          game_date: formData.date,
          start_time: formData.startTime ? convertTo24Hour(formData.startTime) : undefined,
          location: formData.location || undefined,
          status: 'scheduled'
        })
        // Convert date to yyyy-MM-dd format if needed
        let formattedDate = formData.date
        if (formattedDate && formattedDate.includes('/')) {
          const dateParts = formattedDate.split('/')
          if (dateParts.length === 3) {
            const month = dateParts[0].padStart(2, '0')
            const day = dateParts[1].padStart(2, '0')
            const year = dateParts[2]
            formattedDate = `${year}-${month}-${day}`
          }
        }
        
        // Extract YouTube video ID from URL if provided
        const youtubeVideoId = formData.youtubeVideoId 
          ? extractYouTubeVideoId(formData.youtubeVideoId) 
          : undefined
        
        const newGame = await createGame({
          team_id: formData.team,
          season_id: formData.season || undefined,
          opponent_name: formData.opponent,
          game_date: formattedDate,
          start_time: formData.startTime ? convertTo24Hour(formData.startTime) : undefined,
          location: formData.location || undefined,
          youtube_video_id: youtubeVideoId,
          status: 'scheduled'
        })
        console.log('Game created successfully:', newGame)
          setLocalGames([...localGames, {
            id: newGame.id,
            team: formData.team,
            opponent: formData.opponent,
            date: formData.date,
            startTime: formData.startTime || undefined,
            season: formData.season,
            periodLength: parseInt(formData.periodLength) || undefined,
            youtubeVideoId: formData.youtubeVideoId || undefined,
            status: 'active'
          }])
        } else {
          onAdd({
            team: formData.team,
            opponent: formData.opponent,
            date: formData.date,
            startTime: formData.startTime || undefined,
            season: formData.season,
            periodLength: parseInt(formData.periodLength) || undefined,
            youtubeVideoId: formData.youtubeVideoId || undefined,
            status: 'active'
          })
        }
        await loadGames() // Reload games after adding
        setFormData({ team: '', opponent: '', date: '', startTime: '', season: '', location: '', periodLength: '20', youtubeVideoId: '' })
        setShowAddModal(false)
      } catch (error) {
        console.error('Error adding game:', error)
        alert(`Failed to add game: ${error instanceof Error ? error.message : 'Please try again.'}`)
      } finally {
        setLoading(false)
      }
  }

  const handleEdit = async () => {
    if (editingGame && formData.team && formData.opponent && formData.date) {
      try {
        setLoading(true)
        if (useSupabase) {
          // Convert date to yyyy-MM-dd format if needed
          let formattedDate = formData.date
          if (formattedDate && formattedDate.includes('/')) {
            const dateParts = formattedDate.split('/')
            if (dateParts.length === 3) {
              const month = dateParts[0].padStart(2, '0')
              const day = dateParts[1].padStart(2, '0')
              const year = dateParts[2]
              formattedDate = `${year}-${month}-${day}`
            }
          }
          
          // Extract YouTube video ID from URL if provided
          const youtubeVideoId = formData.youtubeVideoId 
            ? extractYouTubeVideoId(formData.youtubeVideoId) 
            : undefined
          
          await updateGame(editingGame.id, {
            team_id: formData.team,
            season_id: formData.season || undefined,
            opponent_name: formData.opponent,
            game_date: formattedDate,
            start_time: formData.startTime ? convertTo24Hour(formData.startTime) : undefined,
            location: formData.location || undefined,
            youtube_video_id: youtubeVideoId,
            status: editingGame.status || 'scheduled'
          })
          // Reload games to get fresh data with proper team/season names
          await loadGames()
        } else {
          onEdit(editingGame.id, {
            team: formData.team,
            opponent: formData.opponent,
            date: formData.date,
            startTime: formData.startTime || undefined,
            season: formData.season,
            periodLength: parseInt(formData.periodLength) || undefined,
            youtubeVideoId: formData.youtubeVideoId || undefined,
            status: editingGame.status || 'active'
          })
        }
        setEditingGame(null)
        setFormData({ team: '', opponent: '', date: '', startTime: '', season: '', location: '', periodLength: '20', youtubeVideoId: '' })
        setShowAddModal(false)
      } catch (error) {
        console.error('Error updating game:', error)
        alert('Failed to update game. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleItemClick = (game: Game) => {
    setSelectedGame(game)
    setShowActionModal(true)
  }

  const handleUpdate = () => {
    if (selectedGame) {
      setEditingGame(selectedGame)
      
      // Convert date to yyyy-MM-dd format if needed
      let formattedDate = selectedGame.date
      if (formattedDate && formattedDate.includes('/')) {
        // Convert from MM/DD/YYYY or M/D/YYYY to yyyy-MM-dd
        const dateParts = formattedDate.split('/')
        if (dateParts.length === 3) {
          const month = dateParts[0].padStart(2, '0')
          const day = dateParts[1].padStart(2, '0')
          const year = dateParts[2]
          formattedDate = `${year}-${month}-${day}`
        }
      }
      
      // Find season ID - prefer seasonId if available, otherwise try to find by name
      let seasonId = ''
      if (selectedGame.seasonId) {
        // Use the seasonId directly if available
        seasonId = selectedGame.seasonId
      } else if (selectedGame.season) {
        // Fallback: try to find by name
        const season = availableSeasons.find(s => s.name === selectedGame.season)
        if (season) {
          seasonId = season.id
        } else {
          // If season name doesn't match, try to find by ID (in case it's already an ID)
          const seasonById = availableSeasons.find(s => s.id === selectedGame.season)
          if (seasonById) {
            seasonId = seasonById.id
          }
        }
      }
      
      // Find team ID from team name
      let teamId = ''
      if (selectedGame.team) {
        const team = availableTeams.find(t => t.name === selectedGame.team)
        if (team) {
          teamId = team.id
        } else {
          // If team name doesn't match, try to find by ID (in case it's already an ID)
          const teamById = availableTeams.find(t => t.id === selectedGame.team)
          if (teamById) {
            teamId = teamById.id
          }
        }
      }
      
      setFormData({
        team: teamId || selectedGame.team,
        opponent: selectedGame.opponent,
        date: formattedDate,
        startTime: selectedGame.startTime || '',
        season: seasonId || selectedGame.season,
        location: selectedGame.location || '',
        periodLength: String(selectedGame.periodLength || 20),
        youtubeVideoId: selectedGame.youtubeVideoId || ''
      })
      setShowAddModal(true)
    }
  }

  const handleArchive = () => {
    if (selectedGame) {
      setArchiveConfirm({ isOpen: true, game: selectedGame })
    }
  }

  const handleDelete = () => {
    if (selectedGame) {
      setDeleteConfirm({ isOpen: true, game: selectedGame })
    }
  }

  const confirmDelete = async () => {
    if (deleteConfirm.game) {
      try {
        setLoading(true)
        if (useSupabase) {
          await deleteGame(deleteConfirm.game.id)
          setLocalGames(localGames.filter(g => g.id !== deleteConfirm.game!.id))
        } else {
          onDelete(deleteConfirm.game.id)
        }
        setDeleteConfirm({ isOpen: false, game: null })
        setShowActionModal(false)
        setSelectedGame(null)
      } catch (error) {
        console.error('Error deleting game:', error)
        alert('Failed to delete game. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const confirmArchive = async () => {
    if (archiveConfirm.game && onArchive) {
      try {
        setLoading(true)
        if (useSupabase) {
          await archiveGame(archiveConfirm.game.id)
          setLocalGames(localGames.map(g => g.id === archiveConfirm.game!.id ? { ...g, status: 'archived' } : g))
        } else {
          onArchive(archiveConfirm.game.id)
        }
        setArchiveConfirm({ isOpen: false, game: null })
        setShowActionModal(false)
        setSelectedGame(null)
      } catch (error) {
        console.error('Error archiving game:', error)
        alert('Failed to archive game. Please try again.')
      } finally {
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
            <GameSchedule size={24} className="text-primary" />
            <h2 className="text-2xl font-bold text-text">Games</h2>
          </div>
          <button
            onClick={() => {
              setEditingGame(null)
              setFormData({ team: '', opponent: '', date: '', startTime: '', season: '', location: '', periodLength: '20', youtubeVideoId: '' })
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 bg-primary text-text px-4 py-2 rounded-lg font-semibold hover:bg-primaryDark transition-colors"
            disabled={loading}
          >
            <AddIcon size={18} />
            Add Game
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
                {(() => {
                  const seasonList = useSupabase ? availableSeasons : 
                    (seasons.length > 0 && typeof seasons[0] === 'string' ? [] : seasons as Array<{ id: string; name: string }>)
                  return seasonList.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                    </option>
                  ))
                })()}
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
                {(() => {
                  const teamList = useSupabase ? availableTeams : 
                    (teams.length > 0 && typeof teams[0] === 'string' ? [] : teams as Array<{ id: string; name: string }>)
                  return teamList.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))
                })()}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Games List - Scrollable */}
      <div className="flex-1 space-y-2 overflow-y-auto min-h-0">
        {loading && localGames.length === 0 ? (
          <div className="text-center py-8 text-textSecondary">
            <p>Loading games...</p>
          </div>
        ) : localGames.length === 0 ? (
          <div className="text-center py-8 text-textSecondary">
            <GameSchedule size={48} className="mx-auto mb-2 opacity-50" />
            <p>No games yet</p>
          </div>
        ) : (
          localGames.map((game) => (
            <div
              key={game.id}
              onClick={() => handleItemClick(game)}
              className="bg-background border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-text">{game.team} vs {game.opponent}</h3>
                  {game.status === 'archived' && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-warning/20 text-warning">
                      Archived
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-sm text-textSecondary flex-wrap">
                  {game.date && <span>{game.date}</span>}
                  {game.startTime && <span>{game.startTime}</span>}
                  {game.season && <span>{game.season}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Item Action Modal */}
      <ItemActionModal
        isOpen={showActionModal}
        itemName={selectedGame ? `${selectedGame.team} vs ${selectedGame.opponent}` : ''}
        onUpdate={handleUpdate}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onClose={() => {
          setShowActionModal(false)
          setSelectedGame(null)
        }}
        showArchive={!!onArchive}
      />

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text">
                {editingGame ? 'Edit Game' : 'Add Game'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingGame(null)
                  setFormData({ team: '', opponent: '', date: '', startTime: '', season: '', location: '', periodLength: '20', youtubeVideoId: '' })
                }}
                className="text-textSecondary hover:text-text"
              >
                <CloseIcon size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {availableTeams.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-textSecondary mb-2">Team *</label>
                  <select
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                    required
                  >
                    <option value="">Select Team</option>
                    {availableTeams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">Opponent</label>
                <input
                  type="text"
                  value={formData.opponent}
                  onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                  placeholder="Enter opponent name"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">Game Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">Start Time (12hr format)</label>
                <input
                  type="text"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  placeholder="e.g., 2:30 PM"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                />
                <p className="text-xs text-textSecondary mt-1">Format: H:MM AM/PM (e.g., 2:30 PM, 10:00 AM)</p>
              </div>

              {availableSeasons.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-textSecondary mb-2">Season</label>
                  <select
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                  >
                    <option value="">Select Season</option>
                    {availableSeasons.map((season) => (
                      <option key={season.id} value={season.id}>{season.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">Location (optional)</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter game location"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">Period Length (minutes)</label>
                <input
                  type="number"
                  value={formData.periodLength}
                  onChange={(e) => setFormData({ ...formData, periodLength: e.target.value })}
                  placeholder="20"
                  min="1"
                  max="30"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-textSecondary mb-2">YouTube Video Link (optional)</label>
                <input
                  type="text"
                  value={formData.youtubeVideoId}
                  onChange={(e) => setFormData({ ...formData, youtubeVideoId: e.target.value })}
                  placeholder="Enter YouTube video URL or ID (e.g., https://youtu.be/iGLcZIfkgiI or iGLcZIfkgiI)"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text"
                />
                <p className="text-xs text-textSecondary mt-1">You can paste the full YouTube URL or just the video ID</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={editingGame ? handleEdit : handleAdd}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-text px-4 py-3 rounded-xl font-semibold hover:bg-primaryDark transition-colors"
                  disabled={loading}
                >
                  <SaveIcon size={18} />
                  {editingGame ? 'Update' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingGame(null)
                    setFormData({ team: '', opponent: '', date: '', startTime: '', season: '', location: '', periodLength: '20', youtubeVideoId: '' })
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
        title="Delete Game"
        message={`Are you sure you want to delete this game?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, game: null })}
      />

      {/* Archive Confirmation Modal */}
      {onArchive && (
        <DeleteConfirmModal
          isOpen={archiveConfirm.isOpen}
          title="Archive Game"
          message={`Are you sure you want to archive this game?`}
          onConfirm={confirmArchive}
          onCancel={() => setArchiveConfirm({ isOpen: false, game: null })}
          isArchive={true}
        />
      )}
    </div>
  )
}

