'use client'

import React, { useState } from 'react'
import { SaveIcon, CloseIcon, HockeyArena } from '@/components/icons/HockeyIcons'
import { createOrganization } from '@/lib/supabase/queries'
import { useAdminSettings } from '@/contexts/AdminSettingsContext'

interface OrganizationSetupModalProps {
  isOpen: boolean
  onComplete: () => void
}

export default function OrganizationSetupModal({ isOpen, onComplete }: OrganizationSetupModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setSelectedOrganizationId } = useAdminSettings()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Organization name is required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const newOrg = await createOrganization({
        name: name.trim(),
        status: 'active'
      })
      
      // Set the newly created organization as selected
      setSelectedOrganizationId(newOrg.id)
      
      // Call onComplete to proceed
      onComplete()
    } catch (error: any) {
      console.error('Error creating organization:', error)
      setError(error.message || 'Failed to create organization. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <HockeyArena size={32} className="text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-text">Welcome to IcePulse Connect</h2>
            <p className="text-sm text-textSecondary mt-1">Let's set up your organization</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-textSecondary mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              placeholder="Enter your organization name"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              disabled={loading}
              required
            />
            {error && (
              <p className="text-sm text-error mt-2">{error}</p>
            )}
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-xs text-textSecondary">
              <strong>Note:</strong> You can only have one organization. You can add additional details (address, contact info, etc.) later in the Admin settings.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-text px-4 py-3 rounded-xl font-semibold hover:bg-primaryDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SaveIcon size={18} />
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

