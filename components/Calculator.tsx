'use client'

import React from 'react'

interface CalculatorProps {
  value: string
  onChange: (value: string) => void
  onClose: () => void
  title?: string
}

export default function Calculator({ value, onChange, onClose, title = 'Enter Time' }: CalculatorProps) {
  const handleNumberClick = (num: string) => {
    // Limit to 4 digits max for game clock (MM:SS)
    if (value.length < 4) {
      onChange(value + num)
    }
  }

  const handleClear = () => {
    onChange('') // Clear all input
  }

  const handleDelete = () => {
    onChange(value.slice(0, -1))
  }

  // Format value as MM:SS for display
  const formatTimeDisplay = (val: string) => {
    if (!val || val === '0') return '00:00'
    
    // Pad to 4 digits if needed
    const padded = val.padStart(4, '0')
    const minutes = padded.slice(0, -2) || '00'
    const seconds = padded.slice(-2) || '00'
    
    return `${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-xl font-bold text-text mb-4 text-center">{title}</h3>
        
        {/* Display */}
        <div className="bg-background border border-border rounded-xl p-4 mb-4">
          <div className="text-3xl font-mono font-bold text-primary text-center">
            {formatTimeDisplay(value)}
          </div>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Row 1 */}
          <button
            onClick={() => handleNumberClick('1')}
            className="bg-surfaceLight border border-border rounded-xl p-4 text-xl font-semibold text-text hover:bg-surface hover:border-primary transition-colors"
          >
            1
          </button>
          <button
            onClick={() => handleNumberClick('2')}
            className="bg-surfaceLight border border-border rounded-xl p-4 text-xl font-semibold text-text hover:bg-surface hover:border-primary transition-colors"
          >
            2
          </button>
          <button
            onClick={() => handleNumberClick('3')}
            className="bg-surfaceLight border border-border rounded-xl p-4 text-xl font-semibold text-text hover:bg-surface hover:border-primary transition-colors"
          >
            3
          </button>

          {/* Row 2 */}
          <button
            onClick={() => handleNumberClick('4')}
            className="bg-surfaceLight border border-border rounded-xl p-4 text-xl font-semibold text-text hover:bg-surface hover:border-primary transition-colors"
          >
            4
          </button>
          <button
            onClick={() => handleNumberClick('5')}
            className="bg-surfaceLight border border-border rounded-xl p-4 text-xl font-semibold text-text hover:bg-surface hover:border-primary transition-colors"
          >
            5
          </button>
          <button
            onClick={() => handleNumberClick('6')}
            className="bg-surfaceLight border border-border rounded-xl p-4 text-xl font-semibold text-text hover:bg-surface hover:border-primary transition-colors"
          >
            6
          </button>

          {/* Row 3 */}
          <button
            onClick={() => handleNumberClick('7')}
            className="bg-surfaceLight border border-border rounded-xl p-4 text-xl font-semibold text-text hover:bg-surface hover:border-primary transition-colors"
          >
            7
          </button>
          <button
            onClick={() => handleNumberClick('8')}
            className="bg-surfaceLight border border-border rounded-xl p-4 text-xl font-semibold text-text hover:bg-surface hover:border-primary transition-colors"
          >
            8
          </button>
          <button
            onClick={() => handleNumberClick('9')}
            className="bg-surfaceLight border border-border rounded-xl p-4 text-xl font-semibold text-text hover:bg-surface hover:border-primary transition-colors"
          >
            9
          </button>

          {/* Bottom Row */}
          <button
            onClick={handleClear}
            className="bg-error/20 border border-error rounded-xl p-4 text-lg font-semibold text-error hover:bg-error/30 transition-colors"
            title="Clear All"
          >
            C
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            className="bg-surfaceLight border border-border rounded-xl p-4 text-xl font-semibold text-text hover:bg-surface hover:border-primary transition-colors"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="bg-warning/20 border border-warning rounded-xl p-4 text-lg font-semibold text-warning hover:bg-warning/30 transition-colors"
          >
            ⌫
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-primary border border-primary rounded-xl p-3 text-text font-semibold hover:bg-primaryDark transition-colors"
          >
            Done
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

