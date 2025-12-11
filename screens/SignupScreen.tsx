'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { createOrganization } from '@/lib/supabase/queries'
import { useAdminSettings } from '@/contexts/AdminSettingsContext'

export default function SignupScreen() {
  const router = useRouter()
  const { login, setUser } = useAuth()
  const { setSelectedOrganizationId } = useAdminSettings()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }
    if (!formData.password) {
      setError('Password is required')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!formData.organizationName.trim()) {
      setError('Organization name is required')
      return
    }

    try {
      setLoading(true)

      // TODO: Create user in Supabase Auth
      // For now, we'll create the organization and set up the user
      // In production, you'd:
      // 1. Create user in Supabase Auth: await supabase.auth.signUp({ email, password })
      // 2. Create organization
      // 3. Create user record in users table linked to organization
      // 4. Log them in

      // Create organization first
      const newOrg = await createOrganization({
        name: formData.organizationName.trim(),
        status: 'active'
      })

      // Set the organization as selected
      setSelectedOrganizationId(newOrg.id)

      // Create user account (mock for now - will be replaced with real Supabase Auth)
      const newUser = {
        id: `user-${Date.now()}`,
        email: formData.email.trim(),
        name: formData.name.trim(),
        role: 'organizational' as const,
        organizationId: newOrg.id,
        authUserId: null,
      }

      // Set user and log them in
      setUser(newUser)
      
      // Navigate to admin dashboard
      router.push('/admin')
    } catch (error: any) {
      console.error('Signup error:', error)
      setError(error.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-gradient-to-b from-background to-surface overflow-hidden w-full" style={{ overflowX: 'hidden', height: '100vh', maxHeight: '100vh' }}>
      <div className="h-full overflow-y-auto w-full">
        <div className="w-full max-w-md mx-auto px-4 py-8">
          <div className="flex justify-center mb-8">
            <Logo size={150} />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-text mb-2">Create Account</h1>
            <p className="text-textSecondary">Sign up to get started</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">

          {/* Personal Information */}
          <div>
            <label className="block text-sm font-semibold text-textSecondary mb-2">Your Name *</label>
            <input
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                setError(null)
              }}
              className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-text placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-textSecondary mb-2">Email *</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                setError(null)
              }}
              className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-text placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-textSecondary mb-2">Password *</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value })
                setError(null)
              }}
              className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-text placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-textSecondary mb-2">Confirm Password *</label>
            <input
              type="password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value })
                setError(null)
              }}
              className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-text placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Organization Information */}
          <div className="border-t border-border pt-4 mt-4">
            <div>
              <label className="block text-sm font-semibold text-textSecondary mb-2">Organization Name *</label>
              <input
                type="text"
                placeholder="Your Organization"
                value={formData.organizationName}
                onChange={(e) => {
                  setFormData({ ...formData, organizationName: e.target.value })
                  setError(null)
                }}
                className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-text placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <p className="text-xs text-textSecondary mt-2">
                This will be your organization. You can only have one organization per account.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-secondary py-4 rounded-xl text-text font-semibold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>

          <div className="text-center mt-4">
            <p className="text-textSecondary text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-primary hover:text-primaryDark font-semibold transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
          </form>
        </div>
      </div>
    </div>
  )
}

