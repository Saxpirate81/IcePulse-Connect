'use client'

import React, { useState, useEffect, useRef } from 'react'
import { GripVertical } from 'lucide-react'

interface ResizableSplitViewProps {
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  rightPanelHeader?: React.ReactNode
  defaultLeftWidth?: number // Percentage (0-100)
  minLeftWidth?: number // Percentage
  maxLeftWidth?: number // Percentage
  minRightWidth?: number // Percentage
}

export default function ResizableSplitView({
  leftPanel,
  rightPanel,
  rightPanelHeader,
  defaultLeftWidth = 50,
  minLeftWidth = 20,
  maxLeftWidth = 80,
  minRightWidth = 20,
}: ResizableSplitViewProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load saved width from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('splitViewLeftWidth')
      if (saved) {
        const width = parseFloat(saved)
        if (width >= minLeftWidth && width <= maxLeftWidth) {
          setLeftWidth(width)
        }
      } else {
        // Only use default if no saved value exists
        setLeftWidth(defaultLeftWidth)
      }
    }
  }, []) // Only run once on mount

  // Save width to localStorage when resizing stops
  useEffect(() => {
    if (typeof window !== 'undefined' && !isResizing) {
      localStorage.setItem('splitViewLeftWidth', leftWidth.toString())
    }
  }, [leftWidth, isResizing])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

      // Constrain to min/max values
      const constrainedWidth = Math.max(
        minLeftWidth,
        Math.min(maxLeftWidth, newLeftWidth)
      )

      // Also ensure right panel doesn't get too small
      const rightWidth = 100 - constrainedWidth
      if (rightWidth >= minRightWidth) {
        setLeftWidth(constrainedWidth)
      } else {
        setLeftWidth(100 - minRightWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      if (typeof window !== 'undefined') {
        localStorage.setItem('splitViewLeftWidth', leftWidth.toString())
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, minLeftWidth, maxLeftWidth, minRightWidth])

  return (
    <div
      ref={containerRef}
      className="h-full w-full flex overflow-hidden"
      style={{ userSelect: isResizing ? 'none' : 'auto' }}
    >
      {/* Left Panel (Video) */}
      <div
        className="flex-shrink-0 overflow-hidden"
        style={{
          width: `${leftWidth}%`,
          minWidth: `${minLeftWidth}%`,
          maxWidth: `${maxLeftWidth}%`,
        }}
      >
        {leftPanel}
      </div>

      {/* Resizer */}
      <div
        className="flex-shrink-0 w-1 bg-border hover:bg-primary cursor-col-resize transition-colors relative group"
        onMouseDown={handleMouseDown}
        style={{ cursor: isResizing ? 'col-resize' : 'col-resize' }}
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 flex items-center justify-center">
          <GripVertical
            size={20}
            className="text-textSecondary group-hover:text-primary transition-colors"
          />
        </div>
      </div>

      {/* Right Panel (Logger View) */}
      <div
        className="flex-1 flex flex-col overflow-hidden min-w-0"
        style={{
          minWidth: `${minRightWidth}%`,
        }}
      >
        {/* Right Panel Header (Logger Tabs) */}
        {rightPanelHeader && (
          <div className="flex-shrink-0">
            {rightPanelHeader}
          </div>
        )}
        
        {/* Right Panel Content */}
        <div className="flex-1 overflow-hidden">
          {rightPanel}
        </div>
      </div>
    </div>
  )
}

