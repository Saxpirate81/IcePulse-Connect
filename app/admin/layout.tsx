'use client'

import AdminTabNavigator from '@/navigation/AdminTabNavigator'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminTabNavigator>{children}</AdminTabNavigator>
}

