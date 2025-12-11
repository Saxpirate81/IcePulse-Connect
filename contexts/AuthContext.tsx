'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type UserRole = 'organizational' | 'coach' | 'player' | 'parent'

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  organizationId: string | null
  authUserId: string | null
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean // True if role is 'organizational'
  isSuperAdmin: boolean // True if user is the designated super admin (for testing/admin features)
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session from Supabase on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Import supabase client dynamically
        const { supabase } = await import('@/lib/supabase')
        
        if (!supabase) {
          // Fallback to localStorage if Supabase not configured
          const savedUser = localStorage.getItem('currentUser')
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser)
              setUser(parsedUser)
            } catch (error) {
              console.error('Error parsing saved user:', error)
            }
          }
          setIsLoading(false)
          return
        }

        // Check for existing Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error getting session:', sessionError)
          // Fallback to localStorage
          const savedUser = localStorage.getItem('currentUser')
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser)
              setUser(parsedUser)
            } catch (error) {
              console.error('Error parsing saved user:', error)
            }
          }
          setIsLoading(false)
          return
        }

        if (session?.user) {
          // Session exists, fetch user data from users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .single()

          if (userError || !userData) {
            // User doesn't exist in users table, but session is valid
            // This shouldn't happen, but handle gracefully
            console.warn('Session exists but user not found in users table')
            // Clear invalid session
            await supabase.auth.signOut()
            localStorage.removeItem('currentUser')
            setUser(null)
            setIsLoading(false)
            return
          }

          // Map database role to UserRole type
          const roleMap: Record<string, UserRole> = {
            'organizational': 'organizational',
            'coach': 'coach',
            'player': 'player',
            'parent': 'parent'
          }

          const restoredUser: User = {
            id: userData.id,
            email: userData.email,
            name: userData.name || userData.email.split('@')[0],
            role: roleMap[userData.role] || 'organizational',
            organizationId: userData.organization_id || null,
            authUserId: session.user.id,
          }

          setUser(restoredUser)
          // Also save to localStorage as backup
          localStorage.setItem('currentUser', JSON.stringify(restoredUser))
        } else {
          // No session, check localStorage as fallback
          const savedUser = localStorage.getItem('currentUser')
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser)
              setUser(parsedUser)
            } catch (error) {
              console.error('Error parsing saved user:', error)
              localStorage.removeItem('currentUser')
            }
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error)
        // Fallback to localStorage
        const savedUser = localStorage.getItem('currentUser')
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser)
            setUser(parsedUser)
          } catch (parseError) {
            console.error('Error parsing saved user:', parseError)
            localStorage.removeItem('currentUser')
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()

    // Listen for auth state changes (e.g., token refresh, logout from another tab)
    let subscription: { unsubscribe: () => void } | null = null
    let isMounted = true
    
    const setupAuthListener = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        if (supabase && isMounted) {
          const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return
            
            if (event === 'SIGNED_OUT' || !session) {
              setUser(null)
              localStorage.removeItem('currentUser')
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              if (session?.user) {
                // Fetch user data from users table
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('*')
                  .eq('auth_user_id', session.user.id)
                  .single()

                if (!userError && userData && isMounted) {
                  const roleMap: Record<string, UserRole> = {
                    'organizational': 'organizational',
                    'coach': 'coach',
                    'player': 'player',
                    'parent': 'parent'
                  }

                  const updatedUser: User = {
                    id: userData.id,
                    email: userData.email,
                    name: userData.name || userData.email.split('@')[0],
                    role: roleMap[userData.role] || 'organizational',
                    organizationId: userData.organization_id || null,
                    authUserId: session.user.id,
                  }

                  setUser(updatedUser)
                  localStorage.setItem('currentUser', JSON.stringify(updatedUser))
                }
              }
            }
          })
          if (isMounted) {
            subscription = authSubscription
          } else {
            authSubscription.unsubscribe()
          }
        }
      } catch (error) {
        console.error('Error setting up auth listener:', error)
      }
    }

    setupAuthListener()

    return () => {
      isMounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user))
    } else {
      localStorage.removeItem('currentUser')
    }
  }, [user])

  const login = async (email: string, password: string) => {
    try {
      // Import supabase client dynamically
      const { supabase } = await import('@/lib/supabase')
      
      if (!supabase) {
        throw new Error('Supabase not configured')
      }

      // Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw new Error(authError.message || 'Invalid email or password')
      }

      if (!authData.user) {
        throw new Error('Authentication failed')
      }

      // Fetch user data from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .single()

      if (userError || !userData) {
        // If user doesn't exist in users table, create a basic user object
        // This shouldn't happen in production, but handle gracefully
        setUser({
          id: authData.user.id,
          email: authData.user.email || email,
          name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
          role: 'organizational', // Default role
          organizationId: null,
          authUserId: authData.user.id,
        })
        return
      }

      // Map database role to UserRole type
      const roleMap: Record<string, UserRole> = {
        'organizational': 'organizational',
        'coach': 'coach',
        'player': 'player',
        'parent': 'parent'
      }

      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        role: roleMap[userData.role] || 'organizational',
        organizationId: userData.organization_id || null,
        authUserId: authData.user.id,
      })
    } catch (error: any) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      // Import supabase client dynamically
      const { supabase } = await import('@/lib/supabase')
      
      if (supabase) {
        // Sign out from Supabase (this will clear the session)
        await supabase.auth.signOut()
      }
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      // Always clear local state regardless of Supabase logout result
      setUser(null)
      localStorage.removeItem('currentUser')
      
      // Clear all selected log items when logging out
      if (typeof window !== 'undefined') {
        // Clear from localStorage if stored there
        localStorage.removeItem('selectedLogItems')
        // Also clear from sessionStorage
        sessionStorage.removeItem('selectedLogItems')
        // Clear from gameState as well
        const gameState = localStorage.getItem('gameState')
        if (gameState) {
          try {
            const state = JSON.parse(gameState)
            state.selectedLogItems = []
            localStorage.setItem('gameState', JSON.stringify(state))
          } catch (e) {
            console.error('Error clearing selectedLogItems from gameState:', e)
          }
        }
      }
    }
  }

  const isAdmin = user?.role === 'organizational'
  const isAuthenticated = user !== null
  
  // Super admin check: Only specific email addresses can access admin testing features
  // Add your super admin email here - this should be kept secure
  const SUPER_ADMIN_EMAILS = [
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@icepulse.com',
    'williamdoss@icepulse.com', // Add your email here
  ].filter(Boolean) // Remove any undefined/null values
  const isSuperAdmin = user?.email ? SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase()) : false

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isSuperAdmin,
        isLoading,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

