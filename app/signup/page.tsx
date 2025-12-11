'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import SignupScreen from '@/screens/SignupScreen'

export default function SignupPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // If already logged in, redirect to admin
      router.push('/admin')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-b from-background to-surface flex items-center justify-center">
        <div className="text-textSecondary">Loading...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect
  }

  return <SignupScreen />
}

