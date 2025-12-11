'use client'

import React, { useState, useEffect } from 'react'
import { useAdminSettings } from '@/contexts/AdminSettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import { getOrganizations } from '@/lib/supabase/queries'

type PrivilegeLevel = 'organizational' | 'coach' | 'player' | 'parent'

export default function AdminPageHeader() {
  const { 
    useSupabase, 
    setUseSupabase, 
    selectedOrganizationId, 
    setSelectedOrganizationId,
    privilegeLevel,
    setPrivilegeLevel
  } = useAdminSettings()
  const { isSuperAdmin, user } = useAuth()
  
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)

  // Load organizations from Supabase
  useEffect(() => {
    if (useSupabase) {
      loadOrganizations()
    }
  }, [useSupabase])

  const loadOrganizations = async () => {
    try {
      setLoadingOrgs(true)
      const orgs = await getOrganizations()
      setOrganizations(orgs.map((o: any) => ({
        id: o.id,
        name: o.name
      })))
      // Auto-select first organization if none selected
      if (orgs.length > 0 && !selectedOrganizationId) {
        setSelectedOrganizationId(orgs[0].id)
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
      setOrganizations([])
    } finally {
      setLoadingOrgs(false)
    }
  }

  return (
    <div className="bg-surface border-b border-border px-4 md:px-6 py-3 sticky top-0 z-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left side - Welcome message with user name */}
        <div className="flex-1">
          {user && (
            <p className="text-xs text-textSecondary">
              Welcome, <span className="text-text font-medium">{user.name}</span>
            </p>
          )}
        </div>
        
        {/* Right side - Admin controls (only visible to super admin) and Logout (visible to all) */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Admin controls - only show to super admin */}
          {isSuperAdmin && (
            <>
              {/* Supabase Toggle */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-textSecondary whitespace-nowrap">Supabase:</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSupabase}
                    onChange={(e) => setUseSupabase(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-textSecondary after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Organization Selector */}
              {useSupabase && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-textSecondary whitespace-nowrap">Organization (Test)</label>
                  <select
                    value={selectedOrganizationId || ''}
                    onChange={(e) => setSelectedOrganizationId(e.target.value || null)}
                    className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-text min-w-[150px]"
                    disabled={loadingOrgs}
                  >
                    {loadingOrgs ? (
                      <option value="">Loading...</option>
                    ) : (
                      <>
                        <option value="">Select Organization</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* Privilege Level Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-textSecondary whitespace-nowrap">Privilege Level (Test)</label>
                <select
                  value={privilegeLevel}
                  onChange={(e) => setPrivilegeLevel(e.target.value as PrivilegeLevel)}
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-text"
                >
                  <option value="organizational">Organizational</option>
                  <option value="coach">Coach</option>
                  <option value="player">Player</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

