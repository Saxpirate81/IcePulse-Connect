'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/components/Logo'
import { supabase } from '@/lib/supabase'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    // Check if we have the necessary tokens in the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')
    const token = searchParams.get('token')

    // If we have the token, we can proceed
    if (accessToken || token) {
      setVerifying(false)
    } else {
      // No token found, redirect to login
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
  }, [router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password) {
      setError('Password is required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setLoading(true)

      // Get the hash parameters from the URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (!supabase) {
        throw new Error('Supabase not configured')
      }

      // If we have tokens in the hash, use them to update the password
      if (accessToken && refreshToken) {
        // Set the session with the tokens from the email link
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError) {
          throw sessionError
        }

        // Update the password
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        })

        if (updateError) {
          throw updateError
        }

        setSuccess(true)
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        // Fallback: try to get the token from search params
        const token = searchParams.get('token')
        if (token) {
          // Exchange the token for a session and update password
          const { error: exchangeError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery',
          })

          if (exchangeError) {
            throw exchangeError
          }

          // Update the password
          const { error: updateError } = await supabase.auth.updateUser({
            password: password,
          })

          if (updateError) {
            throw updateError
          }

          setSuccess(true)
          setTimeout(() => {
            router.push('/')
          }, 2000)
        } else {
          throw new Error('Invalid reset link. Please request a new password reset.')
        }
      }
    } catch (error: any) {
      console.error('Error resetting password:', error)
      setError(error.message || 'Failed to reset password. The link may have expired. Please request a new password reset.')
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="h-screen bg-gradient-to-b from-background to-surface flex items-center justify-center">
        <div className="text-center">
          <div className="text-textSecondary mb-4">Verifying reset link...</div>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="h-screen bg-gradient-to-b from-background to-surface flex items-center justify-center">
        <div className="w-full max-w-md px-4 text-center">
          <div className="flex justify-center mb-8">
            <Logo size={150} />
          </div>
          <div className="bg-success/20 border border-success/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-success mb-2">Password Reset Successful!</h2>
            <p className="text-textSecondary">Your password has been updated. Redirecting to login...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-b from-background to-surface flex items-center justify-center overflow-hidden w-full" style={{ overflowX: 'hidden', overflowY: 'auto', height: '100vh', maxHeight: '100vh' }}>
      <div className="w-full max-w-md px-4 py-8">
        <div className="flex justify-center mb-12">
          <Logo size={150} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-text mb-2">Reset Password</h1>
            <p className="text-textSecondary">Enter your new password</p>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-textSecondary mb-2">
              New Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(null)
              }}
              placeholder="Enter new password (min. 6 characters)"
              className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-text placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-textSecondary mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setError(null)
              }}
              placeholder="Confirm new password"
              className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-text placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full bg-gradient-to-r from-primary to-secondary py-4 rounded-xl text-text font-semibold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Resetting password...
              </span>
            ) : (
              'Reset Password'
            )}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-textSecondary hover:text-primary text-sm transition-colors"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-gradient-to-b from-background to-surface flex items-center justify-center">
        <div className="text-center">
          <div className="text-textSecondary mb-4">Loading...</div>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

