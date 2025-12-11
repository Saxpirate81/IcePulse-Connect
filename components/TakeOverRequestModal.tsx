'use client'

import React from 'react'
import { X, Check, XCircle } from 'lucide-react'

interface TakeOverRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  requestingUserName: string
  requestingUserInitials: string
  viewName: string
}

export default function TakeOverRequestModal({
  isOpen,
  onClose,
  onApprove,
  onReject,
  requestingUserName,
  requestingUserInitials,
  viewName,
}: TakeOverRequestModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-text">Take Over Request</h3>
          <button
            onClick={onClose}
            className="text-textSecondary hover:text-text"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
              {requestingUserInitials}
            </div>
            <div>
              <p className="text-text font-semibold">{requestingUserName}</p>
              <p className="text-sm text-textSecondary">wants to take over</p>
            </div>
          </div>
          <p className="text-textSecondary">
            <span className="font-semibold text-text">{requestingUserName}</span> is requesting to take over the <span className="font-semibold text-text">{viewName}</span> logging view.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              onReject()
              onClose()
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-surface border border-border rounded-xl p-3 text-textSecondary font-semibold hover:bg-surfaceLight transition-colors"
          >
            <XCircle size={18} />
            Decline
          </button>
          <button
            onClick={() => {
              onApprove()
              onClose()
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-success border border-success rounded-xl p-3 text-text font-semibold hover:bg-success/90 transition-colors"
          >
            <Check size={18} />
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}

