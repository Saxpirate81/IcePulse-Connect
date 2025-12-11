'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Maximize2, Minimize2, X, Rewind, FastForward, StepBack, StepForward, RotateCcw, RotateCw } from 'lucide-react'
import GameClockDisplay from '@/components/GameClockDisplay'

interface GameVideoPlayerProps {
  videoId: string
  onClose?: () => void
  isMinimized?: boolean
  onToggleMinimize?: () => void
  gameDate?: string | null
  teamName?: string | null
  opponent?: string | null
  showGameClock?: boolean
}

export default function GameVideoPlayer({ 
  videoId, 
  onClose, 
  isMinimized = false,
  onToggleMinimize,
  gameDate,
  teamName,
  opponent,
  showGameClock = false
}: GameVideoPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1) // 1 = 100%, 4 = 400%
  const [isPlaying, setIsPlaying] = useState(false)
  const [panX, setPanX] = useState(0) // Pan offset X
  const [panY, setPanY] = useState(0) // Pan offset Y
  const [playbackRate, setPlaybackRate] = useState(1) // Current playback rate
  const [screenshotOverlay, setScreenshotOverlay] = useState<string | null>(null) // Screenshot data URL
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const screenshotCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastTouchDistance = useRef<number | null>(null)
  const isPinching = useRef(false)
  const isDragging = useRef(false)
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const speedControlInterval = useRef<NodeJS.Timeout | null>(null)
  const originalPlaybackRate = useRef<number>(1)
  const wasPlayingBeforeSpeedControl = useRef<boolean>(false)

  // Extract video ID from URL if needed
  const extractVideoId = (input: string): string => {
    if (!input) return ''
    
    // If it's already just an ID (11 characters, alphanumeric with dashes/underscores)
    if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
      return input.trim()
    }
    
    // Try to extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/,
    ]
    
    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    // If no pattern matches, return the input as-is
    return input.trim()
  }

  const cleanVideoId = extractVideoId(videoId)

  // Function to capture screenshot of the video when paused
  const captureScreenshot = async (iframeId: string) => {
    try {
      const iframe = document.getElementById(iframeId) as HTMLIFrameElement
      if (!iframe || !videoContainerRef.current || !playerRef.current) return

      // Get the container dimensions
      const container = videoContainerRef.current
      const rect = container.getBoundingClientRect()
      
      // Create a canvas to capture
      const canvas = document.createElement('canvas')
      canvas.width = rect.width
      canvas.height = rect.height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return

      // Try to get current time for more accurate thumbnail
      let currentTime = 0
      try {
        const time = await playerRef.current.getCurrentTime()
        currentTime = typeof time === 'number' ? time : 0
      } catch (e) {
        // If getCurrentTime fails, use 0
        currentTime = 0
      }

      // Use YouTube thumbnail API - maxresdefault gives highest quality
      const thumbnailUrl = `https://img.youtube.com/vi/${cleanVideoId}/maxresdefault.jpg`
      
      // Load thumbnail and draw to canvas
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          // Draw the thumbnail scaled to fit the canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
          setScreenshotOverlay(dataUrl)
        } catch (e) {
          console.error('Error drawing thumbnail:', e)
          // Fallback: create a simple placeholder
          createPlaceholderScreenshot(canvas, ctx)
        }
      }
      
      img.onerror = () => {
        // If thumbnail fails, create placeholder
        createPlaceholderScreenshot(canvas, ctx)
      }
      
      img.src = thumbnailUrl
    } catch (error) {
      console.error('Failed to capture screenshot:', error)
      setScreenshotOverlay(null)
    }
  }

  // Create a placeholder screenshot (black screen with play icon)
  const createPlaceholderScreenshot = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    try {
      // Fill with black background
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw a subtle play icon in the center
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = Math.min(canvas.width, canvas.height) * 0.08
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.fill()
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.beginPath()
      ctx.moveTo(centerX - radius * 0.4, centerY - radius * 0.6)
      ctx.lineTo(centerX - radius * 0.4, centerY + radius * 0.6)
      ctx.lineTo(centerX + radius * 0.4, centerY)
      ctx.closePath()
      ctx.fill()
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      setScreenshotOverlay(dataUrl)
    } catch (error) {
      console.error('Placeholder creation failed:', error)
      setScreenshotOverlay(null)
    }
  }

  // Hide screenshot overlay when any control is used
  const hideScreenshotOverlay = () => {
    setScreenshotOverlay(null)
  }

  // YouTube IFrame API URL with enablejsapi=1 for play/pause control
  // Added parameters to suppress overlays and related videos
  // Note: YouTube doesn't provide a parameter to completely disable the "more videos" overlay
  // The overlay is controlled by YouTube and appears when video is paused/ended
  const embedUrl = React.useMemo(() => {
    if (!cleanVideoId) return ''
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    // Parameters: rel=0 (only show videos from same channel), modestbranding=1 (minimal branding)
    // iv_load_policy=3 (disable annotations), cc_load_policy=0 (no captions by default)
    // disablekb=1 (disable keyboard controls), fs=0 (disable fullscreen button)
    return `https://www.youtube.com/embed/${cleanVideoId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1&origin=${origin}&iv_load_policy=3&cc_load_policy=0&playsinline=1&disablekb=1&controls=1&fs=0`
  }, [cleanVideoId])

  // YouTube Player instance
  const playerRef = useRef<any>(null)

  // Debug logging
  useEffect(() => {
    console.log('GameVideoPlayer - videoId:', videoId)
    console.log('GameVideoPlayer - cleanVideoId:', cleanVideoId)
  }, [videoId, cleanVideoId])

  // Load YouTube IFrame API and initialize player
  useEffect(() => {
    if (typeof window === 'undefined' || isMinimized || !cleanVideoId) return

    let checkInterval: NodeJS.Timeout | null = null
    let initTimeout: NodeJS.Timeout | null = null

    const initializePlayer = () => {
      const iframeId = `youtube-player-${cleanVideoId}`
      const iframeElement = document.getElementById(iframeId)
      
      // If player already exists and is valid, don't re-initialize
      if (playerRef.current && iframeElement) {
        try {
          // Check if player is still valid by checking if we can get player state
          const state = playerRef.current.getPlayerState()
          if (state !== undefined && state !== null) {
            // Player is still valid, don't re-initialize
            return
          }
        } catch (e) {
          // Player is invalid, continue with initialization
          playerRef.current = null
        }
      }
      
      if (!iframeElement || !(window as any).YT?.Player) {
        // Retry after a short delay if iframe isn't ready (max 10 attempts)
        if (initTimeout) clearTimeout(initTimeout)
        initTimeout = setTimeout(initializePlayer, 200)
        return
      }

      try {
        // Only destroy if we're creating a new one
        if (playerRef.current) {
          try {
            playerRef.current.destroy()
          } catch (e) {
            // Ignore errors
          }
        }

        const ytPlayer = new (window as any).YT.Player(iframeId, {
          events: {
            onStateChange: async (event: any) => {
              // 1 = playing, 2 = paused, 0 = ended
              const wasPlaying = isPlaying
              setIsPlaying(event.data === 1)
              
              // Capture screenshot when video is paused or ended
              if (event.data === 2 || event.data === 0) {
                // Wait a moment for the pause to complete, then capture screenshot
                setTimeout(async () => {
                  try {
                    await captureScreenshot(iframeId)
                  } catch (error) {
                    console.error('Failed to capture screenshot:', error)
                    // Fallback: clear overlay if capture fails
                    setScreenshotOverlay(null)
                  }
                }, 300) // Small delay to ensure video is fully paused
              } else if (event.data === 1 && wasPlaying === false) {
                // Video started playing - hide screenshot overlay
                setScreenshotOverlay(null)
              }
            },
            onReady: () => {
              // Player is ready
              console.log('YouTube player ready')
              
              // Try to hide overlays immediately
              try {
                const iframe = document.getElementById(iframeId) as HTMLIFrameElement
                if (iframe) {
                  const wrapper = iframe.closest('.youtube-video-wrapper')
                  if (wrapper) {
                    wrapper.classList.add('hide-youtube-overlays')
                  }
                }
              } catch (e) {
                // Ignore errors
              }
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event.data)
            }
          }
        })
        playerRef.current = ytPlayer
      } catch (error) {
        console.error('Error initializing YouTube player:', error)
      }
    }

    // Check if API is already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      // Wait a bit for iframe to be ready
      initTimeout = setTimeout(initializePlayer, 1000)
    } else {
      // Load the API
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
      if (!existingScript) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
      }

      // Wait for API to be ready
      const originalCallback = (window as any).onYouTubeIframeAPIReady
      ;(window as any).onYouTubeIframeAPIReady = () => {
        if (originalCallback) originalCallback()
        initTimeout = setTimeout(initializePlayer, 1000)
      }

      // If API loads after we set the callback, check periodically
      checkInterval = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          if (checkInterval) clearInterval(checkInterval)
          initTimeout = setTimeout(initializePlayer, 1000)
        }
      }, 200)
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval)
      if (initTimeout) clearTimeout(initTimeout)
      // Don't destroy player on cleanup - let it persist
      // This prevents the video from disappearing on re-renders
    }
  }, [cleanVideoId, isMinimized])

  // Cleanup speed control interval on unmount
  useEffect(() => {
    return () => {
      if (speedControlInterval.current) {
        clearInterval(speedControlInterval.current)
        speedControlInterval.current = null
      }
      // Reset playback speed on unmount
      if (playerRef.current && originalPlaybackRate.current !== 1) {
        try {
          // Check if setPlaybackRate method exists
          if (typeof playerRef.current.setPlaybackRate === 'function') {
            playerRef.current.setPlaybackRate(originalPlaybackRate.current)
          }
        } catch (e) {
          // Ignore errors
        }
      }
    }
  }, [])

  // Handle zoom with scroll wheel (desktop) - Ctrl/Cmd + scroll or trackpad pinch
  // Only allow zoom when hovering over the video container
  // Also handle mouse drag to pan when zoomed
  useEffect(() => {
    if (isMinimized || !videoContainerRef.current) return

    const container = videoContainerRef.current
    if (!container) return
    
    // Store container reference for cleanup
    const containerRef = container

    let isHovering = false

    const handleMouseEnter = () => {
      isHovering = true
    }

    const handleMouseLeave = () => {
      isHovering = false
    }

    const handleWheel = (e: WheelEvent) => {
      // Only allow zoom when hovering over the video container
      if (!isHovering) return
      
      // Allow zoom with Ctrl/Cmd + scroll, or trackpad pinch (which has ctrlKey set)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        e.stopPropagation()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setZoomLevel(prev => Math.max(1, Math.min(4, prev + delta))) // 100% to 400%
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      // Allow dragging when zoomed, even if clicking on the iframe area
      if (zoomLevel > 1 && e.button === 0) { // Left mouse button
        isDragging.current = true
        dragStart.current = {
          x: e.clientX,
          y: e.clientY,
          panX,
          panY
        }
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current && dragStart.current && zoomLevel > 1) {
        e.preventDefault()
        const deltaX = e.clientX - dragStart.current.x
        const deltaY = e.clientY - dragStart.current.y
        
        // Calculate max pan based on zoom level
        const maxPan = (zoomLevel - 1) * 50 // Allow panning up to 50% of container per zoom level
        
        setPanX(prev => {
          const newPan = dragStart.current!.panX + deltaX
          return Math.max(-maxPan, Math.min(maxPan, newPan))
        })
        
        setPanY(prev => {
          const newPan = dragStart.current!.panY + deltaY
          return Math.max(-maxPan, Math.min(maxPan, newPan))
        })
      }
    }

    const handleMouseUp = () => {
      isDragging.current = false
      dragStart.current = null
    }

    containerRef.addEventListener('mouseenter', handleMouseEnter)
    containerRef.addEventListener('mouseleave', handleMouseLeave)
    containerRef.addEventListener('wheel', handleWheel, { passive: false })
    containerRef.addEventListener('mousedown', handleMouseDown, { capture: true })
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      if (containerRef) {
        containerRef.removeEventListener('mouseenter', handleMouseEnter)
        containerRef.removeEventListener('mouseleave', handleMouseLeave)
        containerRef.removeEventListener('wheel', handleWheel)
        containerRef.removeEventListener('mousedown', handleMouseDown, { capture: true })
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isMinimized, zoomLevel, panX, panY])

  // Handle pinch-to-zoom (mobile) - two finger expand/contract
  // Only allow zoom when touching the video container
  // Also handle single finger drag to pan when zoomed
  useEffect(() => {
    if (isMinimized || !videoContainerRef.current) return

    const container = videoContainerRef.current
    if (!container) return
    
    // Store container reference for cleanup
    const containerRef = container

    const handleTouchStart = (e: TouchEvent) => {
      // Only process touches that start within the video container
      const touch = e.touches[0]
      if (!touch) return
      
      const rect = containerRef.getBoundingClientRect()
      const isWithinContainer = 
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      
      if (!isWithinContainer) {
        // If touch starts outside container, prevent zoom
        isPinching.current = false
        isDragging.current = false
        lastTouchDistance.current = null
        dragStart.current = null
        return
      }

      if (e.touches.length === 2) {
        // Two finger pinch - prevent page zoom
        e.preventDefault()
        e.stopPropagation()
        isPinching.current = true
        isDragging.current = false
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )
        lastTouchDistance.current = distance
      } else if (e.touches.length === 1 && zoomLevel > 1) {
        // Single finger drag when zoomed
        isDragging.current = true
        isPinching.current = false
        const touch = e.touches[0]
        dragStart.current = {
          x: touch.clientX,
          y: touch.clientY,
          panX,
          panY
        }
      } else {
        isPinching.current = false
        isDragging.current = false
        lastTouchDistance.current = null
        dragStart.current = null
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        // Pinch zoom
        e.preventDefault()
        e.stopPropagation()
        isPinching.current = true
        isDragging.current = false
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )
        
        const scale = distance / lastTouchDistance.current
        setZoomLevel(prev => {
          const newZoom = prev * scale
          return Math.max(1, Math.min(4, newZoom)) // 100% to 400%
        })
        
        lastTouchDistance.current = distance
      } else if (e.touches.length === 1 && isDragging.current && dragStart.current && zoomLevel > 1) {
        // Single finger drag to pan
        e.preventDefault()
        e.stopPropagation()
        const touch = e.touches[0]
        const deltaX = touch.clientX - dragStart.current.x
        const deltaY = touch.clientY - dragStart.current.y
        
        // Calculate max pan based on zoom level
        const maxPan = (zoomLevel - 1) * 50 // Allow panning up to 50% of container per zoom level
        
        setPanX(prev => {
          const newPan = dragStart.current!.panX + deltaX
          return Math.max(-maxPan, Math.min(maxPan, newPan))
        })
        
        setPanY(prev => {
          const newPan = dragStart.current!.panY + deltaY
          return Math.max(-maxPan, Math.min(maxPan, newPan))
        })
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        isPinching.current = false
        isDragging.current = false
        lastTouchDistance.current = null
        dragStart.current = null
      } else if (e.touches.length === 1) {
        // Still have one touch, might be dragging
        if (zoomLevel > 1) {
          const touch = e.touches[0]
          dragStart.current = {
            x: touch.clientX,
            y: touch.clientY,
            panX,
            panY
          }
        }
      }
    }

    // Use passive: false for touchstart to allow preventDefault for pinch zoom
    containerRef.addEventListener('touchstart', handleTouchStart, { passive: false })
    containerRef.addEventListener('touchmove', handleTouchMove, { passive: false })
    containerRef.addEventListener('touchend', handleTouchEnd, { passive: true })
    containerRef.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      if (containerRef) {
        containerRef.removeEventListener('touchstart', handleTouchStart)
        containerRef.removeEventListener('touchmove', handleTouchMove)
        containerRef.removeEventListener('touchend', handleTouchEnd)
        containerRef.removeEventListener('touchcancel', handleTouchEnd)
      }
    }
  }, [isMinimized, zoomLevel, panX, panY])

  // Handle click/tap to play/pause (but not during pinch zoom or drag)
  const handleVideoClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't trigger play/pause if we're pinching, dragging, or just finished dragging
    if (isPinching.current || isDragging.current || 
        (e.nativeEvent instanceof TouchEvent && (e.nativeEvent as TouchEvent).touches.length === 2)) {
      return
    }
    
    // Hide screenshot overlay when video is clicked
    hideScreenshotOverlay()
    
    // Don't trigger if we just panned (moved more than 5px)
    if (dragStart.current) {
      const touch = e.nativeEvent instanceof TouchEvent ? e.nativeEvent.changedTouches[0] : null
      const mouse = e.nativeEvent instanceof MouseEvent ? e.nativeEvent : null
      if (touch) {
        const deltaX = Math.abs(touch.clientX - (dragStart.current.x || 0))
        const deltaY = Math.abs(touch.clientY - (dragStart.current.y || 0))
        if (deltaX > 5 || deltaY > 5) {
          return // Was a drag, not a click
        }
      } else if (mouse && dragStart.current) {
        const deltaX = Math.abs(mouse.clientX - dragStart.current.x)
        const deltaY = Math.abs(mouse.clientY - dragStart.current.y)
        if (deltaX > 5 || deltaY > 5) {
          return // Was a drag, not a click
        }
      }
    }
    
    e.stopPropagation()
    e.preventDefault()
    
    // Try using YouTube Player API first
    if (playerRef.current) {
      try {
        if (isPlaying) {
          playerRef.current.pauseVideo()
        } else {
          playerRef.current.playVideo()
        }
        return
      } catch (error) {
        console.error('Error controlling video with API:', error)
      }
    }

    // Fallback: try postMessage if player not initialized
    if (iframeRef.current?.contentWindow) {
      try {
        if (isPlaying) {
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
        } else {
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
        }
      } catch (error) {
        console.error('Error controlling video:', error)
      }
    }
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(4, prev + 0.5)) // Max 400%
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(1, prev - 0.5))
  }

  const handleResetZoom = () => {
    setZoomLevel(1)
    setPanX(0)
    setPanY(0)
  }

  // Time jump functions
  const handleSeek = (seconds: number) => {
    if (!playerRef.current) return
    
    // Check if getCurrentTime method exists
    if (typeof playerRef.current.getCurrentTime !== 'function') {
      console.warn('getCurrentTime method not available on YouTube player')
      return
    }
    
    try {
      // Try using getCurrentTime as a promise (newer API)
      const currentTimePromise = playerRef.current.getCurrentTime()
      if (currentTimePromise && typeof currentTimePromise.then === 'function') {
        currentTimePromise.then((currentTime: number) => {
          const newTime = Math.max(0, currentTime + seconds)
          if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
            playerRef.current.seekTo(newTime, true)
          }
        }).catch(() => {
          // Fallback if getCurrentTime fails
          try {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
              const currentTime = playerRef.current.getCurrentTime()
              if (typeof currentTime === 'number') {
                const newTime = Math.max(0, currentTime + seconds)
                if (typeof playerRef.current.seekTo === 'function') {
                  playerRef.current.seekTo(newTime, true)
                }
              }
            }
          } catch (e) {
            console.error('Error seeking video:', e)
          }
        })
      } else {
        // Direct call (older API)
        const currentTime = playerRef.current.getCurrentTime()
        if (typeof currentTime === 'number') {
          const newTime = Math.max(0, currentTime + seconds)
          if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
            playerRef.current.seekTo(newTime, true)
          }
        }
      }
    } catch (error) {
      console.error('Error seeking video:', error)
    }
  }

  // Set playback rate
  const setPlaybackSpeed = (rate: number) => {
    if (!playerRef.current) {
      console.warn('Player not initialized, cannot set playback speed')
      return
    }
    try {
      console.log('Setting playback rate to:', rate)
      // Check if setPlaybackRate method exists (may not be available in all YouTube API versions)
      if (typeof playerRef.current.setPlaybackRate === 'function') {
        playerRef.current.setPlaybackRate(rate)
        setPlaybackRate(rate)
        console.log('Playback rate set successfully')
      } else {
        console.warn('setPlaybackRate method not available on YouTube player')
        // Fallback: just update state for UI purposes
        setPlaybackRate(rate)
      }
    } catch (error) {
      console.error('Error setting playback rate:', error)
      // Fallback: just update state for UI purposes
      setPlaybackRate(rate)
    }
  }

  // Reset playback rate to normal
  const resetPlaybackSpeed = () => {
    if (playerRef.current && originalPlaybackRate.current) {
      try {
        // Check if setPlaybackRate method exists
        if (typeof playerRef.current.setPlaybackRate === 'function') {
          playerRef.current.setPlaybackRate(originalPlaybackRate.current)
          setPlaybackRate(originalPlaybackRate.current)
        } else {
          console.warn('setPlaybackRate method not available on YouTube player')
          // Fallback: just update state for UI purposes
          setPlaybackRate(originalPlaybackRate.current)
        }
      } catch (error) {
        console.error('Error resetting playback rate:', error)
        // Fallback: just update state for UI purposes
        setPlaybackRate(originalPlaybackRate.current)
      }
    }
  }

  // Handle backwards playback (seek continuously)
  const startBackwardsPlayback = (rate: number) => {
    hideScreenshotOverlay()
    if (speedControlInterval.current) {
      clearInterval(speedControlInterval.current)
    }
    
    if (!playerRef.current) {
      console.warn('Player not initialized, cannot start backwards playback')
      return
    }
    
    // Save current playing state if not already saved
    if (!wasPlayingBeforeSpeedControl.current) {
      try {
        const playerState = playerRef.current.getPlayerState()
        // 1 = playing, 2 = paused, 0 = ended
        wasPlayingBeforeSpeedControl.current = playerState === 1
      } catch (e) {
        // Ignore errors, assume paused
        wasPlayingBeforeSpeedControl.current = false
      }
    }
    
    // Pause video while seeking backwards
    try {
      const playerState = playerRef.current.getPlayerState()
      if (playerState === 1) { // Playing
        playerRef.current.pauseVideo()
      }
    } catch (e) {
      // Ignore errors
    }
    
    // Check if getCurrentTime method exists before starting interval
    if (typeof playerRef.current.getCurrentTime !== 'function') {
      console.warn('getCurrentTime method not available for backwards playback')
      return
    }
    
    // Seek backwards continuously
    speedControlInterval.current = setInterval(() => {
      if (!playerRef.current) return
      
      try {
        // Handle both promise and direct return values
        const currentTimePromise = playerRef.current.getCurrentTime()
          if (currentTimePromise && typeof currentTimePromise.then === 'function') {
            // Promise-based API
            currentTimePromise.then((currentTime: number) => {
              if (typeof currentTime === 'number') {
                // Seek backwards based on rate (higher rate = faster backwards)
                const seekAmount = rate === 2 ? 0.1 : 0.05 // 2x = faster backwards
                const newTime = Math.max(0, currentTime - seekAmount)
                if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
                  playerRef.current.seekTo(newTime, true)
                }
              }
            }).catch(() => {
              // Fallback if promise fails
              try {
                const currentTime = playerRef.current?.getCurrentTime()
                if (typeof currentTime === 'number') {
                  const seekAmount = rate === 2 ? 0.1 : 0.05
                  const newTime = Math.max(0, currentTime - seekAmount)
                  if (playerRef.current) {
                    playerRef.current.seekTo(newTime, true)
                  }
                }
              } catch (e) {
                // Ignore errors
              }
            })
          } else if (typeof currentTimePromise === 'number') {
            // Direct return value
            const seekAmount = rate === 2 ? 0.1 : 0.05
            const newTime = Math.max(0, currentTimePromise - seekAmount)
            if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
              playerRef.current.seekTo(newTime, true)
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }
    }, 50) // Update every 50ms for smooth backwards playback
  }

  // Handle forwards playback (set playback rate)
  const startForwardsPlayback = (rate: number) => {
    if (!playerRef.current) {
      console.warn('Player not initialized, cannot start forwards playback')
      return
    }
    
    // Save current playing state if not already saved
    if (!wasPlayingBeforeSpeedControl.current) {
      try {
        const playerState = playerRef.current.getPlayerState()
        // 1 = playing, 2 = paused, 0 = ended
        wasPlayingBeforeSpeedControl.current = playerState === 1
      } catch (e) {
        // Ignore errors, assume paused
        wasPlayingBeforeSpeedControl.current = false
      }
    }
    
    // Save original rate if not already saved
    if (originalPlaybackRate.current === 1) {
      try {
        // Check if getPlaybackRate method exists
        if (typeof playerRef.current.getPlaybackRate === 'function') {
          const currentRate = playerRef.current.getPlaybackRate()
          if (typeof currentRate === 'number') {
            originalPlaybackRate.current = currentRate
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Ensure video is playing for forwards speed control
    try {
      const playerState = playerRef.current.getPlayerState()
      if (playerState !== 1) { // Not playing
        playerRef.current.playVideo()
      }
    } catch (e) {
      // Ignore errors
    }
    
    setPlaybackSpeed(rate)
  }

  // Handle button press (start speed control)
  const handleSpeedControlStart = (rate: number, direction: 'backwards' | 'forwards') => {
    hideScreenshotOverlay() // Hide overlay when any speed control starts
    console.log('Speed control start:', { rate, direction, playerReady: !!playerRef.current })
    if (direction === 'backwards') {
      startBackwardsPlayback(rate)
    } else {
      startForwardsPlayback(rate)
    }
  }

  // Handle button release (reset to normal speed and restore play/pause state)
  const handleSpeedControlEnd = () => {
    if (speedControlInterval.current) {
      clearInterval(speedControlInterval.current)
      speedControlInterval.current = null
    }
    
    // Reset playback speed
    resetPlaybackSpeed()
    originalPlaybackRate.current = 1
    
    // Restore original play/pause state
    if (playerRef.current) {
      try {
        if (wasPlayingBeforeSpeedControl.current) {
          // Was playing, resume normal playback
          playerRef.current.playVideo()
        } else {
          // Was paused, pause the video
          playerRef.current.pauseVideo()
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Reset the flag
    wasPlayingBeforeSpeedControl.current = false
  }

  // -5 seconds backwards
  const handleSeekBack5 = () => {
    hideScreenshotOverlay()
    handleSeek(-5)
  }
  
  // +5 seconds forwards
  const handleSeekForward5 = () => {
    hideScreenshotOverlay()
    handleSeek(5)
  }

  // Format date and time in 12hr format
  const formatGameHeader = () => {
    const parts: string[] = []
    
    if (gameDate) {
      try {
        const date = new Date(gameDate)
        // Format date as MM/DD/YYYY
        const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`
        
        // Format time in 12hr format with AM/PM
        let hours = date.getHours()
        const minutes = date.getMinutes().toString().padStart(2, '0')
        const ampm = hours >= 12 ? 'PM' : 'AM'
        hours = hours % 12
        hours = hours ? hours : 12 // the hour '0' should be '12'
        const timeStr = `${hours}:${minutes} ${ampm}`
        
        parts.push(`${dateStr} ${timeStr}`)
      } catch (e) {
        // If date parsing fails, just use the raw date string
        parts.push(gameDate)
      }
    }
    
    // Add team names
    if (teamName && opponent) {
      parts.push(`${teamName} vs ${opponent}`)
    } else if (teamName) {
      parts.push(teamName)
    } else if (opponent) {
      parts.push(`vs ${opponent}`)
    }
    
    return parts.join(' • ') || 'Game Video'
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40 bg-surface border-2 border-primary rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between bg-primary/20 px-3 py-2">
          <span className="text-sm font-semibold text-text truncate" title={formatGameHeader()}>
            {formatGameHeader()}
          </span>
          <div className="flex items-center gap-2">
            {onToggleMinimize && (
              <button
                onClick={onToggleMinimize}
                className="text-textSecondary hover:text-text transition-colors"
                aria-label="Maximize video"
              >
                <Maximize2 size={16} />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="text-textSecondary hover:text-error transition-colors"
                aria-label="Close video"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        {/* Responsive minimized size: smaller on mobile, larger on desktop */}
        <div className="w-48 h-27 md:w-64 md:h-36">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Game Video"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-surface border border-border rounded-xl overflow-hidden shadow-lg ${isFullscreen ? 'fixed inset-2 md:inset-4 z-50' : 'w-full'}`}>
      {/* Game Clock - Show above video when in video logger view */}
      {showGameClock && (
        <div className="mb-4">
          <GameClockDisplay size="small" showControls={true} showScores={true} showLockButton={true} teamName={teamName || undefined} />
        </div>
      )}

      {/* Video Header */}
      <div className="flex items-center justify-between bg-primary/10 px-2 md:px-3 py-2 border-b border-border min-w-0 overflow-hidden relative" style={{ zIndex: 30, pointerEvents: 'auto' }}>
        <div className="flex items-center gap-1 md:gap-2 flex-1 min-w-0">
          <h3 className="text-[10px] md:text-xs font-semibold text-text truncate flex-shrink" title={formatGameHeader()} style={{ maxWidth: '100%' }}>
            {formatGameHeader()}
          </h3>
          <span className="text-[10px] md:text-xs text-textSecondary flex-shrink-0">({Math.round(zoomLevel * 100)}%)</span>
        </div>
        <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 31 }}>
          {/* Video Playback Controls */}
          <div className="flex items-center gap-0.5 md:gap-1 border-r border-border pr-1 md:pr-2 mr-0.5 md:mr-1" style={{ pointerEvents: 'auto' }}>
            {/* -5 Backwards Button */}
            <button
              onClick={handleSeekBack5}
              className="text-textSecondary hover:text-text transition-colors p-1 md:p-1.5 relative group"
              aria-label="Jump back 5 seconds"
              title="Jump back 5 seconds"
            >
              <StepBack size={18} className="md:w-[20px] md:h-[20px]" />
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                -5 seconds
              </span>
            </button>
            
            {/* Fast Rewind (2x speed backwards, click and hold) */}
            <button
              onMouseDown={() => handleSpeedControlStart(2, 'backwards')}
              onMouseUp={handleSpeedControlEnd}
              onMouseLeave={handleSpeedControlEnd}
              onTouchStart={() => handleSpeedControlStart(2, 'backwards')}
              onTouchEnd={handleSpeedControlEnd}
              className="text-textSecondary hover:text-text transition-colors p-1 md:p-1.5 relative group active:bg-primary/20"
              aria-label="Fast rewind 2x speed (hold)"
              title="Hold for fast rewind at 2x speed"
            >
              <Rewind size={18} className="md:w-[20px] md:h-[20px]" />
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                Hold for 2x rewind
              </span>
            </button>
            
            {/* Slow Motion Backwards (0.5x speed backwards, click and hold) */}
            <button
              onMouseDown={() => handleSpeedControlStart(0.5, 'backwards')}
              onMouseUp={handleSpeedControlEnd}
              onMouseLeave={handleSpeedControlEnd}
              onTouchStart={() => handleSpeedControlStart(0.5, 'backwards')}
              onTouchEnd={handleSpeedControlEnd}
              className="text-textSecondary hover:text-text transition-colors p-1 md:p-1.5 relative group active:bg-primary/20"
              aria-label="Slow motion backwards 0.5x speed (hold)"
              title="Hold for slow motion backwards at 0.5x speed"
            >
              <RotateCcw size={18} className="md:w-[20px] md:h-[20px]" />
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                Hold for 0.5x slow motion backwards
              </span>
            </button>
            
            {/* Slow Motion Forwards (0.5x speed forwards, click and hold) */}
            <button
              onMouseDown={() => handleSpeedControlStart(0.5, 'forwards')}
              onMouseUp={handleSpeedControlEnd}
              onMouseLeave={handleSpeedControlEnd}
              onTouchStart={() => handleSpeedControlStart(0.5, 'forwards')}
              onTouchEnd={handleSpeedControlEnd}
              className="text-textSecondary hover:text-text transition-colors p-1 md:p-1.5 relative group active:bg-primary/20"
              aria-label="Slow motion forwards 0.5x speed (hold)"
              title="Hold for slow motion forwards at 0.5x speed"
            >
              <RotateCw size={18} className="md:w-[20px] md:h-[20px]" />
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                Hold for 0.5x slow motion forwards
              </span>
            </button>
            
            {/* Fast Forward (2x speed forwards, click and hold) */}
            <button
              onMouseDown={() => handleSpeedControlStart(2, 'forwards')}
              onMouseUp={handleSpeedControlEnd}
              onMouseLeave={handleSpeedControlEnd}
              onTouchStart={() => handleSpeedControlStart(2, 'forwards')}
              onTouchEnd={handleSpeedControlEnd}
              className="text-textSecondary hover:text-text transition-colors p-1 md:p-1.5 relative group active:bg-primary/20"
              aria-label="Fast forward 2x speed (hold)"
              title="Hold for fast forward at 2x speed"
            >
              <FastForward size={18} className="md:w-[20px] md:h-[20px]" />
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                Hold for 2x fast forward
              </span>
            </button>
            
            {/* +5 Forwards Button */}
            <button
              onClick={handleSeekForward5}
              className="text-textSecondary hover:text-text transition-colors p-1 md:p-1.5 relative group"
              aria-label="Jump forward 5 seconds"
              title="Jump forward 5 seconds"
            >
              <StepForward size={18} className="md:w-[20px] md:h-[20px]" />
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                +5 seconds
              </span>
            </button>
          </div>
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="text-textSecondary hover:text-text transition-colors p-1 md:p-1.5 flex-shrink-0"
              aria-label="Minimize video"
            >
              <Minimize2 size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-textSecondary hover:text-text transition-colors p-1 md:p-1.5 flex-shrink-0"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 size={16} className="md:w-[18px] md:h-[18px]" />
            ) : (
              <Maximize2 size={16} className="md:w-[18px] md:h-[18px]" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-textSecondary hover:text-error transition-colors p-1"
              aria-label="Close video"
            >
              <X size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
          )}
        </div>
      </div>

      {/* Video Container - Responsive with zoom support, ensures video fits and isn't cut off */}
      <div
        ref={videoContainerRef}
        className="relative w-full bg-black youtube-video-wrapper"
        style={{ 
          paddingBottom: '56.25%', // 16:9 aspect ratio (works for all screen sizes)
          height: 0,
          touchAction: 'none', // Prevent default touch behaviors for pinch zoom and pan
          isolation: 'isolate', // Create new stacking context to contain zoom
          overflow: 'hidden', // Prevent video from being cut off
          cursor: zoomLevel > 1 ? (isDragging.current ? 'grabbing' : 'grab') : 'pointer',
          maxWidth: '100%', // Ensure video never goes off screen
          maxHeight: '100%', // Ensure video never goes off screen
          boxSizing: 'border-box', // Include padding in width/height calculations
        }}
        onClick={handleVideoClick}
        onTouchEnd={(e) => {
          // Only trigger play/pause if it's a single tap (not part of pinch zoom or drag)
          if (!isPinching.current && !isDragging.current && e.touches.length === 0 && 
              lastTouchDistance.current === null && e.changedTouches.length === 1) {
            // Small delay to check if it was a drag
            setTimeout(() => {
              if (!isDragging.current && !isPinching.current) {
                handleVideoClick(e)
              }
            }, 150)
          }
          // Reset drag state after a short delay
          setTimeout(() => {
            isDragging.current = false
            dragStart.current = null
          }, 100)
        }}
      >
        {/* Zoomed video container - scales within bounds, never cuts off, supports panning */}
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
            transformOrigin: 'center center',
            width: '100%',
            height: '100%',
            overflow: 'hidden', // Clip zoomed content to prevent cutoff
            transition: (isDragging.current || isPinching.current) ? 'none' : 'transform 0.1s ease-out',
            pointerEvents: zoomLevel > 1 ? 'none' : 'auto' // Disable pointer events when zoomed to allow panning
          }}
        >
          <iframe
            key={`youtube-iframe-${cleanVideoId}`}
            id={`youtube-player-${cleanVideoId}`}
            ref={iframeRef}
            src={embedUrl}
            className="w-full h-full"
            style={{ 
              border: 'none',
              display: 'block',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: zoomLevel > 1 ? 'none' : 'auto' // Disable iframe pointer events when zoomed
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Game Video"
            loading="lazy"
            onLoad={() => {
              console.log('YouTube iframe loaded successfully')
              console.log('Embed URL:', embedUrl)
            }}
            onError={(e) => {
              console.error('YouTube iframe error:', e)
            }}
          />
          
          {/* Screenshot Overlay - Shows when video is paused to hide YouTube "more videos" overlay */}
          {typeof window !== 'undefined' && screenshotOverlay && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${screenshotOverlay})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                imageRendering: 'high-quality',
                zIndex: 1, // Lower z-index to ensure it doesn't interfere with controls
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

