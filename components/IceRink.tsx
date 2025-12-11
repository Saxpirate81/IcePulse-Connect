'use client'

import React from 'react'

interface IceRinkProps {
  onSpotClick?: (x: number, y: number, zone: 'attacking' | 'defending') => void
  onFaceoffClick?: (x: number, y: number, faceoffType: string) => void // For faceoff logging
  rotation: number
  shots?: Array<{
    id: string
    x: number
    y: number
    zone: 'attacking' | 'defending'
    isGoal: boolean
    team: 'myTeam' | 'opponent'
  }>
  mode?: 'shots' | 'faceoffs' // Mode determines what's clickable
}

export default function IceRink({ onSpotClick, onFaceoffClick, rotation, shots = [], mode = 'shots' }: IceRinkProps) {
  // Only 0° and 180° rotations are allowed, so rink is always horizontal (not vertical)
  const isVertical = false
  
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    if (mode === 'faceoffs' && onFaceoffClick) {
      // Check if click is near a faceoff dot
      // Faceoff dots are at: 20% width (attacking), ~41.5% width (neutral left - between blue line and center), 50% width (center), ~58.5% width (neutral right - between center and blue line), 80% width (defending)
      // And at: 25% height (top), 50% height (center), 75% height (bottom)
      // Neutral zone is between blue lines (33% and 67%) and center line (50%)
      // So neutral left is at ~41.5% (halfway between 33% and 50%)
      // And neutral right is at ~58.5% (halfway between 50% and 67%)
      const faceoffDots = [
        { x: 20, y: 25, type: 'attacking-top' },
        { x: 20, y: 75, type: 'attacking-bottom' },
        { x: 41.5, y: 25, type: 'neutral-left-top' },
        { x: 41.5, y: 75, type: 'neutral-left-bottom' },
        { x: 50, y: 50, type: 'center' },
        { x: 58.5, y: 25, type: 'neutral-right-top' },
        { x: 58.5, y: 75, type: 'neutral-right-bottom' },
        { x: 80, y: 25, type: 'defending-top' },
        { x: 80, y: 75, type: 'defending-bottom' },
      ]
      
      for (const dot of faceoffDots) {
        const distance = Math.sqrt(Math.pow(x - dot.x, 2) + Math.pow(y - dot.y, 2))
        if (distance < 5) { // Within 5% of dot
          onFaceoffClick(dot.x, dot.y, dot.type)
          return
        }
      }
    } else if (mode === 'shots') {
      // Determine zone based on rotation
      let zone: 'attacking' | 'defending'
      if (rotation === 0) {
        zone = x < 50 ? 'attacking' : 'defending'
      } else if (rotation === 90) {
        zone = y < 50 ? 'attacking' : 'defending'
      } else if (rotation === 180) {
        zone = x > 50 ? 'attacking' : 'defending'
      } else { // 270
        zone = y > 50 ? 'attacking' : 'defending'
      }
      
      // Allow clicks in both zones - attacking zone for shots, defending zone for blocked shots
      if (onSpotClick) {
        onSpotClick(x, y, zone)
      }
    }
  }

  // Standard NHL rink dimensions (scaled to fit)
  const rinkWidth = 200
  const rinkHeight = 85
  const centerX = rinkWidth / 2
  const centerY = rinkHeight / 2
  
  // Goal dimensions
  const goalWidth = 6
  const goalDepth = 2
  const goalY = rinkHeight / 2
  
  // Corner radius for rounded rink
  const cornerRadius = 8

  // Consistent padding for zone labels (in pixels)
  const zoneLabelPadding = 8
  
  // Determine zone label positions based on rotation
  // Zone labels are positioned above each zone area (left and right)
  // Show labels for both shots and faceoffs modes
  const getZoneLabels = () => {
    // Determine which zone is on left and right based on rotation
    // Only 0° and 180° rotations are allowed
    let leftZone: 'attacking' | 'defending'
    let rightZone: 'attacking' | 'defending'
    
    if (rotation === 0 || rotation === 360) {
      // At 0°, left side is attacking, right side is defending
      leftZone = 'attacking'
      rightZone = 'defending'
    } else if (rotation === 180) {
      // At 180°, left side is defending, right side is attacking
      leftZone = 'defending'
      rightZone = 'attacking'
    } else {
      // Default
      leftZone = 'attacking'
      rightZone = 'defending'
    }
    
    return (
      <div 
        className="relative w-full" 
        style={{ 
          paddingBottom: `${zoneLabelPadding}px`,
        }}
      >
        {/* Left Zone Label - positioned above left half of rink */}
        <div 
          className="absolute text-lg font-semibold"
          style={{
            left: '5%', // Start of left zone
            width: '45%', // Width of left zone
            textAlign: 'left'
          }}
        >
          {leftZone === 'attacking' ? (
            <span className="text-primary">Attacking Zone</span>
          ) : (
            <span className="text-error">Defending Zone</span>
          )}
        </div>
        {/* Right Zone Label - positioned above right half of rink */}
        <div 
          className="absolute text-lg font-semibold"
          style={{
            right: '5%', // Start of right zone
            width: '45%', // Width of right zone
            textAlign: 'right'
          }}
        >
          {rightZone === 'attacking' ? (
            <span className="text-primary">Attacking Zone</span>
          ) : (
            <span className="text-error">Defending Zone</span>
          )}
        </div>
      </div>
    )
  }

  const getBottomLabel = () => {
    // No bottom label needed - labels are only above each zone
    return null
  }

  return (
    <div 
      className={`w-full flex flex-col items-center`} 
      style={{ 
        height: '100%',
        minHeight: '350px',
        maxHeight: 'calc(100vh - 400px)', // Leave room for header, controls, and list
        flex: '1 1 auto',
        overflow: 'hidden'
      }}
    >
      {/* Zone Labels - Position based on rotation (shown for both shots and faceoffs) */}
      {getZoneLabels()}

      {/* Ice Rink SVG - Expand container to fill available space */}
      <div 
        className={`relative w-full flex items-center justify-center flex-1`}
        style={{
          height: '100%',
          minHeight: '250px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <svg
          viewBox={`0 0 ${rinkWidth} ${rinkHeight}`}
          className="cursor-crosshair"
          onClick={handleClick}
          preserveAspectRatio="xMidYMid meet"
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease',
            maxWidth: '100%',
            maxHeight: '100%',
            flexShrink: 0,
            // Horizontal layout (only 0° and 180° rotations allowed)
            width: '100%',
            height: 'auto',
            minWidth: '100%'
          }}
        >
          {/* Ice Surface with rounded corners */}
          <rect
            x="0"
            y="0"
            width={rinkWidth}
            height={rinkHeight}
            rx={cornerRadius}
            ry={cornerRadius}
            fill="#E0F2FE"
            stroke="#0EA5E9"
            strokeWidth="0.5"
          />

          {/* Center Line (Red) */}
          <line
            x1={centerX}
            y1="0"
            x2={centerX}
            y2={rinkHeight}
            stroke="#DC2626"
            strokeWidth="1"
          />

          {/* Blue Lines */}
          <line
            x1={rinkWidth * 0.33}
            y1="0"
            x2={rinkWidth * 0.33}
            y2={rinkHeight}
            stroke="#2563EB"
            strokeWidth="1.5"
          />
          <line
            x1={rinkWidth * 0.67}
            y1="0"
            x2={rinkWidth * 0.67}
            y2={rinkHeight}
            stroke="#2563EB"
            strokeWidth="1.5"
          />

          {/* Center Circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r="15"
            fill="none"
            stroke="#DC2626"
            strokeWidth="1"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r="1"
            fill="#DC2626"
          />

          {/* Faceoff Circles - Attacking Zone (Left) */}
          <circle
            cx={rinkWidth * 0.2}
            cy={rinkHeight * 0.25}
            r="4"
            fill="none"
            stroke="#DC2626"
            strokeWidth="0.8"
          />
          <circle
            cx={rinkWidth * 0.2}
            cy={rinkHeight * 0.25}
            r="0.5"
            fill="#DC2626"
          />
          <circle
            cx={rinkWidth * 0.2}
            cy={rinkHeight * 0.75}
            r="4"
            fill="none"
            stroke="#DC2626"
            strokeWidth="0.8"
          />
          <circle
            cx={rinkWidth * 0.2}
            cy={rinkHeight * 0.75}
            r="0.5"
            fill="#DC2626"
          />

          {/* Faceoff Circles - Neutral Zone (between blue lines and center line) */}
          {/* Neutral left: between 33% (blue line) and 50% (center) = ~41.5% */}
          <circle
            cx={rinkWidth * 0.415}
            cy={rinkHeight * 0.25}
            r="4"
            fill="none"
            stroke="#DC2626"
            strokeWidth="0.8"
          />
          <circle
            cx={rinkWidth * 0.415}
            cy={rinkHeight * 0.25}
            r="0.5"
            fill="#DC2626"
          />
          <circle
            cx={rinkWidth * 0.415}
            cy={rinkHeight * 0.75}
            r="4"
            fill="none"
            stroke="#DC2626"
            strokeWidth="0.8"
          />
          <circle
            cx={rinkWidth * 0.415}
            cy={rinkHeight * 0.75}
            r="0.5"
            fill="#DC2626"
          />
          {/* Neutral right: between 50% (center) and 67% (blue line) = ~58.5% */}
          <circle
            cx={rinkWidth * 0.585}
            cy={rinkHeight * 0.25}
            r="4"
            fill="none"
            stroke="#DC2626"
            strokeWidth="0.8"
          />
          <circle
            cx={rinkWidth * 0.585}
            cy={rinkHeight * 0.25}
            r="0.5"
            fill="#DC2626"
          />
          <circle
            cx={rinkWidth * 0.585}
            cy={rinkHeight * 0.75}
            r="4"
            fill="none"
            stroke="#DC2626"
            strokeWidth="0.8"
          />
          <circle
            cx={rinkWidth * 0.585}
            cy={rinkHeight * 0.75}
            r="0.5"
            fill="#DC2626"
          />

          {/* Faceoff Circles - Defending Zone (Right) */}
          <circle
            cx={rinkWidth * 0.8}
            cy={rinkHeight * 0.25}
            r="4"
            fill="none"
            stroke="#DC2626"
            strokeWidth="0.8"
          />
          <circle
            cx={rinkWidth * 0.8}
            cy={rinkHeight * 0.25}
            r="0.5"
            fill="#DC2626"
          />
          <circle
            cx={rinkWidth * 0.8}
            cy={rinkHeight * 0.75}
            r="4"
            fill="none"
            stroke="#DC2626"
            strokeWidth="0.8"
          />
          <circle
            cx={rinkWidth * 0.8}
            cy={rinkHeight * 0.75}
            r="0.5"
            fill="#DC2626"
          />

          {/* Goal - Attacking Zone (Left) */}
          <rect
            x="0"
            y={goalY - goalWidth / 2}
            width={goalDepth}
            height={goalWidth}
            fill="#1E40AF"
            stroke="#1E3A8A"
            strokeWidth="0.5"
          />
          <line
            x1={goalDepth}
            y1={goalY - goalWidth / 2}
            x2={goalDepth}
            y2={goalY + goalWidth / 2}
            stroke="#1E3A8A"
            strokeWidth="0.8"
          />

          {/* Goal - Defending Zone (Right) */}
          <rect
            x={rinkWidth - goalDepth}
            y={goalY - goalWidth / 2}
            width={goalDepth}
            height={goalWidth}
            fill="#1E40AF"
            stroke="#1E3A8A"
            strokeWidth="0.5"
          />
          <line
            x1={rinkWidth - goalDepth}
            y1={goalY - goalWidth / 2}
            x2={rinkWidth - goalDepth}
            y2={goalY + goalWidth / 2}
            stroke="#1E3A8A"
            strokeWidth="0.8"
          />

          {/* Goal Crease - Attacking Zone (Left) */}
          <path
            d={`M ${goalDepth} ${goalY - goalWidth / 2} 
                A 6 6 0 0 1 ${goalDepth} ${goalY + goalWidth / 2}
                L ${goalDepth + 4} ${goalY + goalWidth / 2}
                L ${goalDepth + 4} ${goalY - goalWidth / 2}
                Z`}
            fill="none"
            stroke="#1E3A8A"
            strokeWidth="0.8"
          />

          {/* Goal Crease - Defending Zone (Right) */}
          <path
            d={`M ${rinkWidth - goalDepth} ${goalY - goalWidth / 2} 
                A 6 6 0 0 0 ${rinkWidth - goalDepth} ${goalY + goalWidth / 2}
                L ${rinkWidth - goalDepth - 4} ${goalY + goalWidth / 2}
                L ${rinkWidth - goalDepth - 4} ${goalY - goalWidth / 2}
                Z`}
            fill="none"
            stroke="#1E3A8A"
            strokeWidth="0.8"
          />


          {/* Rendered Shots (only in shots mode) */}
          {mode === 'shots' && shots.map((shot) => {
            const x = (shot.x / 100) * rinkWidth
            const y = (shot.y / 100) * rinkHeight
            
            if (shot.isGoal) {
              // Green dot for goal (bigger) - always green regardless of team
              return (
                <circle
                  key={shot.id}
                  cx={x}
                  cy={y}
                  r="2.5"
                  fill="#10B981"
                  stroke="#059669"
                  strokeWidth="0.5"
                />
              )
            } else {
              // Color based on team: Green for myTeam, Blue for opponent
              const color = shot.team === 'myTeam' ? '#10B981' : '#3B82F6'
              const strokeColor = shot.team === 'myTeam' ? '#059669' : '#2563EB'
              
              // Green dot for myTeam shots, Blue dot for opponent shots
              return (
                <circle
                  key={shot.id}
                  cx={x}
                  cy={y}
                  r="1.5"
                  fill={color}
                  stroke={strokeColor}
                  strokeWidth="0.3"
                />
              )
            }
          })}
          
          {/* Faceoff Dots - Highlight clickable areas in faceoff mode */}
          {mode === 'faceoffs' && (
            <>
              {/* Attacking Zone Faceoffs */}
              <circle
                cx={rinkWidth * 0.2}
                cy={rinkHeight * 0.25}
                r="4"
                fill="none"
                stroke="#DC2626"
                strokeWidth="1.2"
                className="cursor-pointer hover:fill-red-500/20"
              />
              <circle
                cx={rinkWidth * 0.2}
                cy={rinkHeight * 0.75}
                r="4"
                fill="none"
                stroke="#DC2626"
                strokeWidth="1.2"
                className="cursor-pointer hover:fill-red-500/20"
              />
              
              {/* Neutral Zone Faceoffs - between blue lines and center line */}
              <circle
                cx={rinkWidth * 0.415}
                cy={rinkHeight * 0.25}
                r="4"
                fill="none"
                stroke="#DC2626"
                strokeWidth="1.2"
                className="cursor-pointer hover:fill-red-500/20"
              />
              <circle
                cx={rinkWidth * 0.415}
                cy={rinkHeight * 0.75}
                r="4"
                fill="none"
                stroke="#DC2626"
                strokeWidth="1.2"
                className="cursor-pointer hover:fill-red-500/20"
              />
              <circle
                cx={rinkWidth * 0.585}
                cy={rinkHeight * 0.25}
                r="4"
                fill="none"
                stroke="#DC2626"
                strokeWidth="1.2"
                className="cursor-pointer hover:fill-red-500/20"
              />
              <circle
                cx={rinkWidth * 0.585}
                cy={rinkHeight * 0.75}
                r="4"
                fill="none"
                stroke="#DC2626"
                strokeWidth="1.2"
                className="cursor-pointer hover:fill-red-500/20"
              />
              
              {/* Center Faceoff */}
              <circle
                cx={centerX}
                cy={centerY}
                r="4"
                fill="none"
                stroke="#DC2626"
                strokeWidth="1.2"
                className="cursor-pointer hover:fill-red-500/20"
              />
              
              {/* Defending Zone Faceoffs */}
              <circle
                cx={rinkWidth * 0.8}
                cy={rinkHeight * 0.25}
                r="4"
                fill="none"
                stroke="#DC2626"
                strokeWidth="1.2"
                className="cursor-pointer hover:fill-red-500/20"
              />
              <circle
                cx={rinkWidth * 0.8}
                cy={rinkHeight * 0.75}
                r="4"
                fill="none"
                stroke="#DC2626"
                strokeWidth="1.2"
                className="cursor-pointer hover:fill-red-500/20"
              />
            </>
          )}
        </svg>
      </div>
      
      {/* Bottom Zone Label for vertical orientation */}
      {getBottomLabel()}
    </div>
  )
}

