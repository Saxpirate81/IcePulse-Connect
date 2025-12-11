'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface GameClock {
  minutes: number
  seconds: number
  period: number
  isRunning: boolean
  isLocked: boolean
}

interface GameContextType {
  clock: GameClock
  setClock: (clock: GameClock) => void
  startClock: () => void
  stopClock: () => void
  updateClock: (minutes: number, seconds: number) => void
  setPeriod: (period: number) => void
  toggleClockLock: () => void
  selectedSeason: string | null
  setSelectedSeason: (season: string | null) => void
  selectedTeam: string | null
  setSelectedTeam: (team: string | null) => void
  selectedGame: string | null
  setSelectedGame: (game: string | null) => void
  gameDate: string | null
  setGameDate: (date: string | null) => void
  opponent: string | null
  setOpponent: (opponent: string | null) => void
  gameVideoId: string | null
  setGameVideoId: (videoId: string | null) => void
  loggingMode: 'live' | 'video' | null
  setLoggingMode: (mode: 'live' | 'video' | null) => void
  myTeamScore: number
  setMyTeamScore: (score: number) => void
  opponentScore: number
  setOpponentScore: (score: number) => void
  selectedLogItems: string[]
  setSelectedLogItems: (items: string[]) => void
  activeLogView: string | null
  setActiveLogView: (view: string | null) => void
  currentUser: { id: string; name: string; initials: string } | null
  setCurrentUser: (user: { id: string; name: string; initials: string } | null) => void
  logViewAssignments: Record<string, { userId: string; userName: string; initials: string }> // viewId -> assignment
  setLogViewAssignment: (viewId: string, userId: string | null, userName?: string) => void
  takeOverRequests: Record<string, { fromUserId: string; fromUserName: string; fromUserInitials: string }> // viewId -> request
  setTakeOverRequest: (viewId: string, request: { fromUserId: string; fromUserName: string; fromUserInitials: string } | null) => void
  approveTakeOver: (viewId: string) => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [clock, setClockState] = useState<GameClock>({
    minutes: 20,
    seconds: 0,
    period: 1,
    isRunning: false,
    isLocked: true, // Default locked
  })

  const [selectedSeason, setSelectedSeason] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [gameDate, setGameDate] = useState<string | null>(null)
  const [opponent, setOpponent] = useState<string | null>(null)
  const [gameVideoId, setGameVideoId] = useState<string | null>(null)
  
  // Initialize loggingMode from localStorage
  const [loggingMode, setLoggingModeState] = useState<'live' | 'video' | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('loggingMode')
      console.log('Initializing loggingMode from localStorage:', saved)
      return (saved === 'live' || saved === 'video') ? saved : null
    }
    return null
  })
  
  // Wrapper to persist loggingMode
  const setLoggingMode = (mode: 'live' | 'video' | null) => {
    console.log('setLoggingMode called with:', mode)
    setLoggingModeState(mode)
    if (typeof window !== 'undefined') {
      if (mode) {
        localStorage.setItem('loggingMode', mode)
        console.log('Saved loggingMode to localStorage:', mode)
      } else {
        localStorage.removeItem('loggingMode')
        console.log('Removed loggingMode from localStorage')
      }
    }
  }
  const [myTeamScore, setMyTeamScore] = useState<number>(0)
  const [opponentScore, setOpponentScore] = useState<number>(0)
  const [selectedLogItems, setSelectedLogItems] = useState<string[]>([])
  const [activeLogView, setActiveLogView] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; initials: string } | null>(null)
  const [logViewAssignments, setLogViewAssignments] = useState<Record<string, { userId: string; userName: string; initials: string }>>({})
  const [takeOverRequests, setTakeOverRequests] = useState<Record<string, { fromUserId: string; fromUserName: string; fromUserInitials: string }>>({})

  // Clear selected log items when app closes or becomes hidden (mobile app close)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const clearSelectedLogItems = () => {
      setSelectedLogItems([])
      localStorage.removeItem('selectedLogItems')
      sessionStorage.removeItem('selectedLogItems')
      // Also clear from gameState
      const gameState = localStorage.getItem('gameState')
      if (gameState) {
        try {
          const state = JSON.parse(gameState)
          state.selectedLogItems = []
          localStorage.setItem('gameState', JSON.stringify(state))
        } catch (e) {
          // Ignore errors
        }
      }
    }

    const handleBeforeUnload = () => {
      // Clear selected log items when page is being unloaded
      clearSelectedLogItems()
    }

    const handleVisibilityChange = () => {
      // When app becomes hidden (user closes/switches away on mobile)
      if (document.hidden) {
        // Small delay to ensure this is a real close, not just a tab switch
        setTimeout(() => {
          // Only clear if still hidden after delay (user actually closed/switched away)
          if (document.hidden) {
            clearSelectedLogItems()
          }
        }, 1000) // 1 second delay to distinguish from tab switches
      }
    }

    // Listen for page unload (browser close, refresh, navigation away)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Listen for visibility changes (mobile app close, tab switch)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [setSelectedLogItems]) // Include setSelectedLogItems in deps
  
  // Helper to get initials from name
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  
  // Initialize current user (mock for now - will be replaced with real auth)
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        if (!user.initials) {
          user.initials = getInitials(user.name)
        }
        setCurrentUser(user)
      } catch (e) {
        console.error('Error loading user:', e)
      }
    } else {
      // Default user for now
      const defaultUser = { id: 'user-1', name: 'Admin User', initials: getInitials('Admin User') }
      setCurrentUser(defaultUser)
      localStorage.setItem('currentUser', JSON.stringify(defaultUser))
    }
  }, [])
  
  // Load log view assignments (per game)
  useEffect(() => {
    if (selectedGame) {
      const key = `logViewAssignments_${selectedGame}`
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          setLogViewAssignments(JSON.parse(saved))
        } catch (e) {
          console.error('Error loading log view assignments:', e)
        }
      } else {
        setLogViewAssignments({})
      }
    }
  }, [selectedGame])
  
  // Save log view assignments (per game)
  useEffect(() => {
    if (selectedGame) {
      const key = `logViewAssignments_${selectedGame}`
      localStorage.setItem(key, JSON.stringify(logViewAssignments))
    }
  }, [logViewAssignments, selectedGame])
  
  // Load take over requests (per game)
  useEffect(() => {
    if (selectedGame) {
      const key = `takeOverRequests_${selectedGame}`
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          setTakeOverRequests(JSON.parse(saved))
        } catch (e) {
          console.error('Error loading take over requests:', e)
        }
      } else {
        setTakeOverRequests({})
      }
    }
  }, [selectedGame])
  
  // Save take over requests (per game)
  useEffect(() => {
    if (selectedGame) {
      const key = `takeOverRequests_${selectedGame}`
      localStorage.setItem(key, JSON.stringify(takeOverRequests))
    }
  }, [takeOverRequests, selectedGame])
  
  const setLogViewAssignment = (viewId: string, userId: string | null, userName?: string) => {
    setLogViewAssignments((prev) => {
      const updated = { ...prev }
      if (userId && currentUser) {
        updated[viewId] = {
          userId,
          userName: userName || currentUser.name,
          initials: userName ? getInitials(userName) : currentUser.initials
        }
      } else {
        delete updated[viewId]
      }
      return updated
    })
  }
  
  const setTakeOverRequest = (viewId: string, request: { fromUserId: string; fromUserName: string; fromUserInitials: string } | null) => {
    setTakeOverRequests((prev) => {
      const updated = { ...prev }
      if (request) {
        updated[viewId] = request
      } else {
        delete updated[viewId]
      }
      return updated
    })
  }
  
  const approveTakeOver = (viewId: string) => {
    const request = takeOverRequests[viewId]
    if (request && currentUser) {
      // Transfer assignment to requesting user
      setLogViewAssignment(viewId, request.fromUserId, request.fromUserName)
      // Remove the request
      setTakeOverRequest(viewId, null)
    }
  }

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gameState')
    const savedLoggingMode = localStorage.getItem('loggingMode')
    
    console.log('=== GameContext: Loading state from localStorage ===')
    console.log('savedLoggingMode:', savedLoggingMode)
    console.log('gameState exists:', !!saved)
    
    // First, restore loggingMode from its dedicated key (higher priority)
    // Use setLoggingMode wrapper to ensure it's properly persisted
    if (savedLoggingMode === 'live' || savedLoggingMode === 'video') {
      // Use the state setter directly here since we're in initialization
      // The wrapper will handle persistence on subsequent changes
      setLoggingModeState(savedLoggingMode)
      console.log('Restored loggingMode from localStorage:', savedLoggingMode)
    } else {
      console.log('No valid loggingMode found in localStorage')
    }
    
    if (saved) {
      try {
      const state = JSON.parse(saved)
      console.log('gameState.loggingMode:', state.loggingMode)
      if (state.season) setSelectedSeason(state.season)
      if (state.team) setSelectedTeam(state.team)
      if (state.game) setSelectedGame(state.game)
      if (state.gameDate) setGameDate(state.gameDate)
      if (state.opponent) setOpponent(state.opponent)
      if (state.gameVideoId) setGameVideoId(state.gameVideoId)
      // Only restore loggingMode from gameState if it exists and we don't already have one from dedicated key
      if (state.loggingMode && !savedLoggingMode) {
        setLoggingModeState(state.loggingMode)
        // Also save to dedicated key for consistency
        if (typeof window !== 'undefined') {
          localStorage.setItem('loggingMode', state.loggingMode)
        }
        console.log('Restored loggingMode from gameState:', state.loggingMode)
      }
      if (state.myTeamScore !== undefined) setMyTeamScore(state.myTeamScore)
      if (state.opponentScore !== undefined) setOpponentScore(state.opponentScore)
      if (state.selectedLogItems) setSelectedLogItems(state.selectedLogItems)
      if (state.activeLogView) setActiveLogView(state.activeLogView)
      } catch (e) {
        console.error('Error loading game state:', e)
      }
    }
    console.log('=== End GameContext state loading ===')
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const state = {
      season: selectedSeason,
      team: selectedTeam,
      game: selectedGame,
      gameDate,
      opponent,
      gameVideoId,
      loggingMode,
      myTeamScore,
      opponentScore,
      selectedLogItems,
      activeLogView,
    }
    localStorage.setItem('gameState', JSON.stringify(state))
  }, [selectedSeason, selectedTeam, selectedGame, gameDate, opponent, gameVideoId, loggingMode, myTeamScore, opponentScore, selectedLogItems, activeLogView])

  // Clock countdown effect
  useEffect(() => {
    if (!clock.isRunning) return

    const interval = setInterval(() => {
      setClockState((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else {
          // Clock reached 0:00 - auto-increment period
          return { 
            ...prev, 
            isRunning: false,
            period: Math.min(5, prev.period + 1),
            minutes: 20,
            seconds: 0
          }
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [clock.isRunning])

  const setClock = (newClock: GameClock) => {
    setClockState(newClock)
  }

  const startClock = () => {
    setClockState((prev) => ({ ...prev, isRunning: true }))
  }

  const stopClock = () => {
    setClockState((prev) => ({ ...prev, isRunning: false }))
  }

  const updateClock = (minutes: number, seconds: number) => {
    setClockState((prev) => ({ ...prev, minutes, seconds }))
  }

  const setPeriod = (period: number) => {
    setClockState((prev) => ({ ...prev, period }))
  }

  const toggleClockLock = () => {
    setClockState((prev) => ({ ...prev, isLocked: !prev.isLocked }))
  }

  return (
    <GameContext.Provider
      value={{
        clock,
        setClock,
        startClock,
        stopClock,
        updateClock,
        setPeriod,
        toggleClockLock,
        selectedSeason,
        setSelectedSeason,
        selectedTeam,
        setSelectedTeam,
    selectedGame,
    setSelectedGame,
    gameDate,
    setGameDate,
    opponent,
    setOpponent,
    gameVideoId,
    setGameVideoId,
        loggingMode,
        setLoggingMode,
        myTeamScore,
        setMyTeamScore,
        opponentScore,
        setOpponentScore,
        selectedLogItems,
        setSelectedLogItems,
        activeLogView,
        setActiveLogView,
        currentUser,
        setCurrentUser,
        logViewAssignments,
        setLogViewAssignment,
        takeOverRequests,
        setTakeOverRequest,
        approveTakeOver,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

