'use client'

import { useState, useEffect } from 'react'

export function useIsDesktop(breakpoint: number = 768): boolean {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkSize = () => {
      setIsDesktop(window.innerWidth >= breakpoint)
    }
    
    // Set initial value
    checkSize()
    
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [breakpoint])

  return isDesktop
}

