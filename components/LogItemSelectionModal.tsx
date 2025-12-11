'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useGame } from '@/contexts/GameContext'

interface LogItemSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedItems: string[]) => void
  availableItems: { id: string; name: string; icon: string }[]
  selectedItems: string[]
  showClearAll?: boolean
}

export default function LogItemSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  availableItems,
  selectedItems: initialSelected,
  showClearAll = false,
}: LogItemSelectionModalProps) {
  const { currentUser, logViewAssignments, setLogViewAssignment, setTakeOverRequest, takeOverRequests } = useGame()
  const [selectedItems, setSelectedItems] = useState<string[]>(initialSelected)

  // Sync selectedItems when modal opens or initialSelected changes
  useEffect(() => {
    if (isOpen) {
      setSelectedItems(initialSelected)
    }
  }, [isOpen, initialSelected])

  if (!isOpen) return null

  const handleToggle = (itemId: string) => {
    const assignment = logViewAssignments[itemId]
    // Don't allow unchecking if another user is assigned (unless taking over)
    if (assignment && assignment.userId !== currentUser?.id) {
      return // Disabled - handled by UI
    }
    
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleClearAll = () => {
    setSelectedItems([])
    // Clear all assignments
    availableItems.forEach((item) => {
      setLogViewAssignment(item.id, null)
    })
  }

  const handleTakeOver = (itemId: string) => {
    const assignment = logViewAssignments[itemId]
    if (assignment && currentUser && assignment.userId !== currentUser.id) {
      // Create take over request
      setTakeOverRequest(itemId, {
        fromUserId: currentUser.id,
        fromUserName: currentUser.name,
        fromUserInitials: currentUser.initials,
      })
      // Add to selected items (will be pending approval)
      if (!selectedItems.includes(itemId)) {
        setSelectedItems((prev) => [...prev, itemId])
      }
    }
  }

  const handleConfirm = () => {
    // Call onConfirm with the selected items
    onConfirm(selectedItems)
    // Close the modal after confirming
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-text">Select Log Items</h3>
          <button
            onClick={onClose}
            className="text-textSecondary hover:text-text"
          >
            <X size={24} />
          </button>
        </div>

        <p className="text-textSecondary mb-6">
          Which items would you like to log during this game?
        </p>

        <div className="space-y-3 mb-6">
          {availableItems.map((item) => {
            const assignment = logViewAssignments[item.id]
            const isAssignedToOther = assignment && assignment.userId !== currentUser?.id
            const isSelected = selectedItems.includes(item.id)
            const hasTakeOverRequest = takeOverRequests[item.id] !== undefined
            const isDisabled = isAssignedToOther && !hasTakeOverRequest
            
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!isDisabled) {
                    handleToggle(item.id)
                  }
                }}
                className={`flex items-center space-x-3 p-4 bg-surfaceLight border rounded-xl transition-colors ${
                  isDisabled
                    ? 'border-warning/50 opacity-75 cursor-not-allowed'
                    : 'border-border cursor-pointer hover:border-primary/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    if (!isDisabled) {
                      handleToggle(item.id)
                    }
                  }}
                  disabled={isDisabled}
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed pointer-events-none"
                />
                <span className="text-2xl">{item.icon}</span>
                <span className="flex-1 text-text font-semibold">{item.name}</span>
                {assignment ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-textSecondary">Assigned to:</span>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isAssignedToOther
                        ? 'bg-warning text-text'
                        : 'bg-success text-text'
                    }`}>
                      {assignment.initials}
                    </span>
                    {isAssignedToOther && !hasTakeOverRequest && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTakeOver(item.id)
                        }}
                        className="text-xs px-3 py-1.5 bg-primary border border-primary text-text font-semibold rounded-lg hover:bg-primary/80 transition-colors whitespace-nowrap"
                      >
                        Request Take Over
                      </button>
                    )}
                    {hasTakeOverRequest && (
                      <span className="text-xs px-2 py-1 bg-warning/20 text-warning rounded whitespace-nowrap">
                        Pending Approval
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-textMuted">Available</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex gap-3">
          {showClearAll && (
            <button
              onClick={handleClearAll}
              className="px-4 py-3 bg-error/20 border border-error rounded-xl text-error font-semibold hover:bg-error/30 transition-colors"
            >
              Clear All
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="flex-1 bg-primary border border-primary rounded-xl p-3 text-text font-semibold hover:bg-primaryDark transition-colors"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-surface border border-border rounded-xl p-3 text-textSecondary font-semibold hover:bg-surfaceLight transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

