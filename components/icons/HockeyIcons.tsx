/**
 * Hockey-specific icons using emoji and SVG
 * Replaces generic lucide-react icons with hockey-themed ones
 */

import React from 'react'

// Hockey stick icon (SVG)
export const HockeyStick = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M8 2L6 4L4 8L3 12L4 16L6 20L8 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 2L10 4L12 8L13 12L12 16L10 20L8 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Hockey puck icon (SVG)
export const HockeyPuck = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.9"/>
    <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
  </svg>
)

// Team/Players icon - Hockey players
export const HockeyPlayers = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <span className={className} style={{ fontSize: size }}>
    🏒
  </span>
)

// Trophy/Cup icon - Stanley Cup
export const StanleyCup = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <span className={className} style={{ fontSize: size }}>
    🏆
  </span>
)

// Calendar icon - Game schedule
export const GameSchedule = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <span className={className} style={{ fontSize: size }}>
    📅
  </span>
)

// User icon - Player/Coach
export const HockeyPlayer = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <span className={className} style={{ fontSize: size }}>
    👤
  </span>
)

// Building icon - Arena/Organization
export const HockeyArena = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <span className={className} style={{ fontSize: size }}>
    🏟️
  </span>
)

// Plus icon - Add
export const AddIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <span className={className} style={{ fontSize: size }}>
    ➕
  </span>
)

// Edit icon - Edit
export const EditIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <span className={className} style={{ fontSize: size }}>
    ✏️
  </span>
)

// Archive icon - Archive
export const ArchiveIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <span className={className} style={{ fontSize: size }}>
    📦
  </span>
)

// Delete icon - Delete
export const DeleteIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <span className={className} style={{ fontSize: size }}>
    🗑️
  </span>
)

// Save icon - Save
export const SaveIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <span className={className} style={{ fontSize: size }}>
    💾
  </span>
)

// X/Close icon - Close
export const CloseIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <span className={className} style={{ fontSize: size }}>
    ✕
  </span>
)

// Search icon - Search
export const SearchIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <span className={className} style={{ fontSize: size }}>
    🔍
  </span>
)

// Check icon - Check
export const CheckIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <span className={className} style={{ fontSize: size }}>
    ✓
  </span>
)

// Mail icon - Email
export const MailIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <span className={className} style={{ fontSize: size }}>
    ✉️
  </span>
)

// Alert icon - Warning
export const AlertIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <span className={className} style={{ fontSize: size }}>
    ⚠️
  </span>
)

