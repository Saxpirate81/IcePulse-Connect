'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import LogScreen from '@/screens/admin/LogScreen'

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <LogScreen />
    </ProtectedRoute>
  )
}

