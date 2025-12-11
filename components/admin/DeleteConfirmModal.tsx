'use client'

import React from 'react'
import { AlertIcon, CloseIcon } from '@/components/icons/HockeyIcons'

interface DeleteConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  isArchive?: boolean
}

export default function DeleteConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isArchive = false
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${isArchive ? 'bg-warning/20' : 'bg-error/20'}`}>
            <AlertIcon size={24} className={isArchive ? 'text-warning' : 'text-error'} />
          </div>
          <h3 className="text-xl font-bold text-text">{title}</h3>
        </div>
        
        <p className="text-textSecondary mb-6">{message}</p>
        {!isArchive && (
          <p className="text-error text-sm font-semibold mb-6">This action cannot be undone.</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-surface border border-border text-textSecondary px-4 py-3 rounded-xl font-semibold hover:bg-surfaceLight transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors ${
              isArchive
                ? 'bg-warning text-text hover:bg-warning/90'
                : 'bg-error text-text hover:bg-error/90'
            }`}
          >
            {isArchive ? 'Archive' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

