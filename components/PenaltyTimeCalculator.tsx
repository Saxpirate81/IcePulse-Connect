'use client'

import React, { useState, useEffect } from 'react'

interface PenaltyTimeCalculatorProps {
  minutes: number
  seconds: number
  onChange: (minutes: number, seconds: number) => void
  onClose: () => void
  title?: string
}

export default function PenaltyTimeCalculator({ minutes, seconds, onChange, onClose, title = 'Enter Penalty Duration' }: PenaltyTimeCalculatorProps) {
  // Store the input string (up to 3 digits)
  const [inputValue, setInputValue] = useState('')

  // Initialize input value from minutes/seconds when component mounts or values change externally
  useEffect(() => {
    if (minutes === 0 && seconds === 0) {
      setInputValue('')
    } else {
      // Convert minutes:seconds to input string (MSS format)
      const minsStr = String(minutes)
      const secsStr = String(seconds).padStart(2, '0')
      setInputValue(minsStr + secsStr)
    }
  }, []) // Only on mount

  // Update when cleared externally
  useEffect(() => {
    if (minutes === 0 && seconds === 0 && inputValue.length > 0) {
      setInputValue('')
    }
  }, [minutes, seconds])

  const handleNumberClick = (num: string) => {
    // Limit to 3 digits max (M:SS format)
    const newInput = (inputValue + num).slice(-3) // Keep only last 3 digits
    setInputValue(newInput)
    
    // Parse: first digit is minutes, last 2 are seconds
    if (newInput.length === 0) {
      onChange(0, 0)
    } else if (newInput.length === 1) {
      // Single digit: treat as seconds (0:0S)
      onChange(0, Math.min(59, parseInt(newInput) || 0))
    } else if (newInput.length === 2) {
      // Two digits: treat as seconds (0:SS)
      onChange(0, Math.min(59, parseInt(newInput) || 0))
    } else if (newInput.length === 3) {
      // Three digits: first is minutes, last 2 are seconds (M:SS)
      const newMinutes = parseInt(newInput[0]) || 0
      const newSeconds = parseInt(newInput.slice(1)) || 0
      onChange(Math.min(20, newMinutes), Math.min(59, newSeconds))
    }
  }

  const handleClear = () => {
    setInputValue('')
    onChange(0, 0) // Clear all input
  }

  const handleDelete = () => {
    // Remove last digit
    const newInput = inputValue.slice(0, -1)
    setInputValue(newInput)
    
    // Reparse based on length
    if (newInput.length === 0) {
      onChange(0, 0)
    } else if (newInput.length === 1) {
      onChange(0, Math.min(59, parseInt(newInput) || 0))
    } else if (newInput.length === 2) {
      onChange(0, Math.min(59, parseInt(newInput) || 0))
    }
  }

  // Format value for display (M:SS)
  const formatDisplay = (mins: number, secs: number) => {
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-xl font-bold text-text mb-4 text-center">{title}</h3>
        
        {/* Display */}
        <div className="bg-background border border-border rounded-xl p-4 mb-4">
          <div className="text-3xl font-mono font-bold text-primary text-center">
            {formatDisplay(minutes, seconds)}
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

