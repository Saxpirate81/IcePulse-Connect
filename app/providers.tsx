'use client'

import { GameProvider } from '@/contexts/GameContext'
import { AdminSettingsProvider, useAdminSettings } from '@/contexts/AdminSettingsContext'
import { AuthProvider } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/LoadingSpinner'

function LoadingWrapper({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAdminSettings()
  return (
    <>
      {children}
      {isLoading && <LoadingSpinner />}
    </>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminSettingsProvider>
        <LoadingWrapper>
          <GameProvider>{children}</GameProvider>
        </LoadingWrapper>
      </AdminSettingsProvider>
    </AuthProvider>
  )
}
