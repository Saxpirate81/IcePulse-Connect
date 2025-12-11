'use client'

import React from 'react'
import Logo from './Logo'

interface LoadingSpinnerProps {
  message?: string
  size?: number
}

export default function LoadingSpinner({ message, size = 80 }: LoadingSpinnerProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
        <div className="animate-spin">
          <Logo size={size} />
        </div>
        {message && (
          <p className="text-textSecondary font-semibold text-sm">{message}</p>
        )}
      </div>
    </div>
  )
}

