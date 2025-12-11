'use client'

import React from 'react'
import { EditIcon, ArchiveIcon, DeleteIcon, CloseIcon } from '@/components/icons/HockeyIcons'

interface ItemActionModalProps {
  isOpen: boolean
  itemName: string
  onUpdate: () => void
  onArchive: () => void
  onDelete: () => void
  onClose: () => void
  showArchive?: boolean
  showDelete?: boolean
}

export default function ItemActionModal({
  isOpen,
  itemName,
  onUpdate,
  onArchive,
  onDelete,
  onClose,
  showArchive = true,
  showDelete = true
}: ItemActionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-text">{itemName}</h3>
          <button
            onClick={onClose}
            className="text-textSecondary hover:text-text"
          >
            <CloseIcon size={24} />
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => {
              onUpdate()
              onClose()
            }}
            className="w-full flex items-center gap-3 bg-primary/20 border border-primary rounded-xl px-4 py-3 text-text hover:bg-primary/30 transition-colors"
          >
            <EditIcon size={20} className="text-primary" />
            <span className="font-semibold">Update</span>
          </button>

          {showArchive && (
            <button
              onClick={() => {
                onArchive()
                onClose()
              }}
              className="w-full flex items-center gap-3 bg-warning/20 border border-warning rounded-xl px-4 py-3 text-text hover:bg-warning/30 transition-colors"
            >
              <ArchiveIcon size={20} className="text-warning" />
              <span className="font-semibold">Archive</span>
            </button>
          )}

          {showDelete && (
            <button
              onClick={() => {
                onDelete()
                onClose()
              }}
              className="w-full flex items-center gap-3 bg-error/20 border border-error rounded-xl px-4 py-3 text-text hover:bg-error/30 transition-colors"
            >
              <DeleteIcon size={20} className="text-error" />
              <span className="font-semibold">Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

