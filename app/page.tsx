'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import LoginScreen from '@/screens/LoginScreen'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminSettings } from '@/contexts/AdminSettingsContext'
import OrganizationSetupModal from '@/components/OrganizationSetupModal'
import { getOrganizations } from '@/lib/supabase/queries'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user, isSuperAdmin } = useAuth()
  const { useSupabase, selectedOrganizationId, setSelectedOrganizationId } = useAdminSettings()
  const [checkingOrg, setCheckingOrg] = useState(false)
  const [showOrgSetup, setShowOrgSetup] = useState(false)
  const [orgCheckComplete, setOrgCheckComplete] = useState(false)

  // Set user's organization automatically after login
  useEffect(() => {
    if (user && user.organizationId && !isSuperAdmin) {
      // Regular users: automatically set their organization and lock it
      setSelectedOrganizationId(user.organizationId)
    }
  }, [user, isSuperAdmin, setSelectedOrganizationId])

  // Check for organization after authentication
  useEffect(() => {
    const checkOrganization = async () => {
      if (isAuthenticated && !isLoading && useSupabase && !orgCheckComplete) {
        setCheckingOrg(true)
        try {
          // For super admin, check all organizations
          // For regular users, they should already have an organization from their user record
          if (isSuperAdmin) {
            const orgs = await getOrganizations()
            if (orgs.length === 0) {
              // No organization exists - show setup modal
              setShowOrgSetup(true)
            } else {
              // Organization exists - set it as selected if not already set
              if (!selectedOrganizationId && orgs.length > 0) {
                setSelectedOrganizationId(orgs[0].id)
              }
              // Navigate to admin
              router.push('/admin')
            }
          } else {
            // Regular user - their organization is already set from their user record
            // Just navigate to admin
            router.push('/admin')
          }
        } catch (error) {
          console.error('Error checking organizations:', error)
          // On error, still navigate to admin (they can create org there)
          router.push('/admin')
        } finally {
          setCheckingOrg(false)
          setOrgCheckComplete(true)
        }
      } else if (isAuthenticated && !isLoading && !useSupabase) {
        // Not using Supabase - just navigate
        router.push('/admin')
        setOrgCheckComplete(true)
      }
    }

    checkOrganization()
  }, [isAuthenticated, isLoading, useSupabase, orgCheckComplete, selectedOrganizationId, setSelectedOrganizationId, router])

  const handleOrgSetupComplete = () => {
    setShowOrgSetup(false)
    router.push('/admin')
  }

  if (isLoading || checkingOrg) {
    return (
      <div className="h-screen bg-gradient-to-b from-background to-surface flex items-center justify-center">
        <div className="text-textSecondary">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <>
      {showOrgSetup && (
        <OrganizationSetupModal
          isOpen={showOrgSetup}
          onComplete={handleOrgSetupComplete}
        />
      )}
    </>
  )
}

