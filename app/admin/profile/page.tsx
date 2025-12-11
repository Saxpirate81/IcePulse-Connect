'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import AdminScreen from '@/screens/admin/AdminScreen'

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminScreen privilegeLevel="organizational" />
    </ProtectedRoute>
  )
}

