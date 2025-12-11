'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import ForgotPasswordModal from '@/components/ForgotPasswordModal'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginScreen() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      // Navigation will be handled by app/page.tsx after checking for organization
      // Just let the auth state change trigger the redirect
    } catch (error) {
      console.error('Login error:', error)
      // TODO: Show error message to user
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-gradient-to-b from-background to-surface flex items-center justify-center overflow-hidden w-full" style={{ overflowX: 'hidden', overflowY: 'hidden', height: '100vh', maxHeight: '100vh' }}>
      <div className="w-full max-w-md px-4">
        <div className="flex justify-center mb-12">
          <Logo size={150} />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-text mb-2">Welcome Back</h1>
            <p className="text-textSecondary">Sign in to continue</p>
          </div>

          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-text placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-text placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

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
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="text-center mt-4 space-y-2">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-textSecondary hover:text-primary text-sm transition-colors block w-full"
            >
              Forgot your password?
            </button>
            <p className="text-textSecondary text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="text-primary hover:text-primaryDark font-semibold transition-colors"
              >
                Sign up as Organization
              </button>
            </p>
          </div>
        </form>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  )
}
