'use client'

import React, { useEffect } from 'react'
import { useGame } from '@/contexts/GameContext'
import TakeOverRequestModal from './TakeOverRequestModal'

const logItemNames: Record<string, string> = {
  'shifts': 'Shifts',
  'goals': 'Goals',
  'penalties': 'Penalties',
  'shots': 'Shots',
  'faceoffs': 'Faceoffs',
  'clock': 'Clock',
}

export default function TakeOverRequestHandler() {
  const { 
    currentUser, 
    logViewAssignments, 
    takeOverRequests, 
    approveTakeOver, 
    setTakeOverRequest,
    setLogViewAssignment,
  } = useGame()
  
  // Check for take over requests for views assigned to current user
  useEffect(() => {
    if (!currentUser) return
    
    Object.entries(takeOverRequests).forEach(([viewId, request]) => {
      const assignment = logViewAssignments[viewId]
      // If this view is assigned to current user, show the modal
      if (assignment && assignment.userId === currentUser.id) {
        // Modal will be shown by the component
      }
    })
  }, [takeOverRequests, logViewAssignments, currentUser])
  
  // Find the first pending request for current user
  const pendingRequest = Object.entries(takeOverRequests).find(([viewId, request]) => {
    const assignment = logViewAssignments[viewId]
    return assignment && assignment.userId === currentUser?.id
  })
  
  if (!pendingRequest || !currentUser) return null
  
  const [viewId, request] = pendingRequest
  
  const handleApprove = () => {
    approveTakeOver(viewId)
  }
  
  const handleReject = () => {
    setTakeOverRequest(viewId, null)
  }
  
  return (
    <TakeOverRequestModal
      isOpen={true}
      onClose={handleReject}
      onApprove={handleApprove}
      onReject={handleReject}
      requestingUserName={request.fromUserName}
      requestingUserInitials={request.fromUserInitials}
      viewName={logItemNames[viewId] || viewId}
    />
  )
}

