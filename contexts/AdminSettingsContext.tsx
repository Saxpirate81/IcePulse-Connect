'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type PrivilegeLevel = 'organizational' | 'coach' | 'player' | 'parent'

interface AdminSettingsContextType {
  useSupabase: boolean
  setUseSupabase: (value: boolean) => void
  selectedOrganizationId: string | null
  setSelectedOrganizationId: (id: string | null) => void
  privilegeLevel: PrivilegeLevel
  setPrivilegeLevel: (level: PrivilegeLevel) => void
  isLoading: boolean
  setLoading: (loading: boolean) => void
}

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined)

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  const [useSupabase, setUseSupabase] = useState(true) // Default to true
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null)
  const [privilegeLevel, setPrivilegeLevel] = useState<PrivilegeLevel>('organizational')
  const [isLoading, setLoading] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedUseSupabase = localStorage.getItem('useSupabase')
    if (savedUseSupabase !== null) {
      setUseSupabase(savedUseSupabase === 'true')
    }

    const savedOrgId = localStorage.getItem('selectedOrganizationId')
    if (savedOrgId) {
      setSelectedOrganizationId(savedOrgId)
    }

    const savedPrivilege = localStorage.getItem('privilegeLevel') as PrivilegeLevel | null
    if (savedPrivilege) {
      setPrivilegeLevel(savedPrivilege)
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('useSupabase', String(useSupabase))
  }, [useSupabase])

  useEffect(() => {
    if (selectedOrganizationId) {
      localStorage.setItem('selectedOrganizationId', selectedOrganizationId)
    } else {
      localStorage.removeItem('selectedOrganizationId')
    }
  }, [selectedOrganizationId])

  useEffect(() => {
    localStorage.setItem('privilegeLevel', privilegeLevel)
  }, [privilegeLevel])

  return (
    <AdminSettingsContext.Provider
      value={{
        useSupabase,
        setUseSupabase,
        selectedOrganizationId,
        setSelectedOrganizationId,
        privilegeLevel,
        setPrivilegeLevel,
        isLoading,
        setLoading,
      }}
    >
      {children}
    </AdminSettingsContext.Provider>
  )
}

export function useAdminSettings() {
  const context = useContext(AdminSettingsContext)
  if (context === undefined) {
    throw new Error('useAdminSettings must be used within an AdminSettingsProvider')
  }
  return context
}

