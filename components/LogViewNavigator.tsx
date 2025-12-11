'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useGame } from '@/contexts/GameContext'
import { usePathname, useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import LogItemSelectionModal from './LogItemSelectionModal'

const logItemRoutes: Record<string, string> = {
  'shifts': '/admin/log/shifts',
  'goals': '/admin/log/goals',
  'penalties': '/admin/log/penalties',
  'shots': '/admin/log/shots',
  'faceoffs': '/admin/log/faceoffs',
  'clock': '/admin/log/clock',
}

const logItemNames: Record<string, string> = {
  'shifts': 'Shifts',
  'goals': 'Goals',
  'penalties': 'Penalties',
  'shots': 'Shots',
  'faceoffs': 'Faceoffs',
  'clock': 'Clock',
}

const allLogItems = [
  { id: 'shifts', name: 'Log Shifts', icon: '🔄' },
  { id: 'goals', name: 'Goals', icon: '⚽' },
  { id: 'penalties', name: 'Penalties', icon: '⚠️' },
  { id: 'shots', name: 'Shots', icon: '🎯' },
  { id: 'faceoffs', name: 'Faceoffs', icon: '🔄' },
  { id: 'clock', name: 'Clock', icon: '⏱️' },
]

export default function LogViewNavigator() {
  const { 
    selectedLogItems, 
    activeLogView, 
    setActiveLogView, 
    setSelectedLogItems,
    currentUser,
    logViewAssignments,
    setLogViewAssignment,
  } = useGame()
  const pathname = usePathname()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  // Check if there are any available items that aren't selected
  const hasAvailableItems = allLogItems.some((item) => !selectedLogItems.includes(item.id))
  
  // Auto-assign current user to active view when they navigate to it
  useEffect(() => {
    if (activeLogView && currentUser) {
      const assignment = logViewAssignments[activeLogView]
      // Only assign if no one else is assigned or if current user is already assigned
      if (!assignment) {
        setLogViewAssignment(activeLogView, currentUser.id, currentUser.name)
      } else if (assignment.userId !== currentUser.id) {
        // Another user is assigned - could show warning or prevent access
        console.warn(`View ${activeLogView} is already assigned to ${assignment.userName}`)
      }
    }
  }, [activeLogView, currentUser, logViewAssignments, setLogViewAssignment])

  if (selectedLogItems.length === 0) return null

  const handleViewClick = (itemId: string) => {
    // Optimize navigation by using startTransition for faster UI updates
    startTransition(() => {
      setActiveLogView(itemId)
      const route = logItemRoutes[itemId]
      if (route) {
        // Use replace instead of push for faster navigation within log views
        router.replace(route)
      }
    })
  }

  const handleModalConfirm = (items: string[]) => {
    setSelectedLogItems(items)
    // Auto-assign current user to all selected items if not already assigned
    if (currentUser) {
      items.forEach((itemId) => {
        if (!logViewAssignments[itemId]) {
          setLogViewAssignment(itemId, currentUser.id, currentUser.name)
        }
      })
    }
    if (items.length > 0 && !items.includes(activeLogView || '')) {
      // If current view was removed, navigate to first available
      const firstItem = items[0]
      setActiveLogView(firstItem)
      const route = logItemRoutes[firstItem]
      if (route) {
        router.push(route)
      }
    }
  }

  return (
    <>
      <div className="bg-surface border-b border-border px-4 py-2 flex-shrink-0 overflow-x-hidden w-full max-w-full" style={{ maxWidth: '100vw' }}>
        <div className="w-full max-w-full flex gap-2 overflow-x-auto items-center scrollbar-hide" style={{ maxWidth: '100%' }}>
          {selectedLogItems.map((itemId) => {
            const isActive = pathname === logItemRoutes[itemId] || activeLogView === itemId
            const assignment = logViewAssignments[itemId]
            const isAssignedToCurrentUser = assignment?.userId === currentUser?.id
            
            return (
              <button
                key={itemId}
                onClick={() => handleViewClick(itemId)}
                disabled={isPending}
                className={`px-4 py-2 rounded-lg border transition-colors whitespace-nowrap flex-shrink-0 relative ${
                  isActive
                    ? 'bg-primary border-primary text-text'
                    : 'bg-surfaceLight border-border text-textSecondary hover:border-primary/50'
                } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
              >
                <span>{logItemNames[itemId] || itemId}</span>
                {assignment && (
                  <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg ${
                    isAssignedToCurrentUser
                      ? 'bg-success text-text border-2 border-surface'
                      : 'bg-warning text-text border-2 border-surface'
                  }`}>
                    {assignment.initials}
                  </span>
                )}
              </button>
            )
          })}
          {hasAvailableItems && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-lg border border-border bg-surfaceLight text-textSecondary hover:border-primary/50 hover:text-text transition-colors flex-shrink-0 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={18} />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>

      <LogItemSelectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleModalConfirm}
        availableItems={allLogItems}
        selectedItems={selectedLogItems}
      />
    </>
  )
}

