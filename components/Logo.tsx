'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'

interface LogoProps {
  size?: number
}

export default function Logo({ size = 120 }: LogoProps) {
  // Try to load logo - supports multiple formats
  const logoExtensions = ['png', 'svg', 'jpg', 'jpeg', 'webp']
  const [logoSrc, setLogoSrc] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
    // Check if logo exists by trying to load it
    const checkLogo = async () => {
      for (const ext of logoExtensions) {
        try {
          const testImg = document.createElement('img')
          testImg.src = `/logo.${ext}`
          await new Promise<void>((resolve, reject) => {
            testImg.onload = () => resolve()
            testImg.onerror = () => reject(new Error('Image not found'))
            // Timeout after 1 second
            setTimeout(() => reject(new Error('Timeout')), 1000)
          })
          setLogoSrc(`/logo.${ext}`)
          return
        } catch (error) {
          // Try next format
          continue
        }
      }
      setLogoError(true)
    }
    
    // Only check on client side
    if (typeof window !== 'undefined') {
      checkLogo()
    }
  }, [])

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      {logoSrc && !logoError ? (
        <Image
          src={logoSrc}
          alt="IcePulse Logo"
          width={size}
          height={size}
          className="object-contain"
          priority
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ 
            width: size, 
            height: size,
            backgroundColor: '#1A1F3A',
            border: '1px solid #2D3447'
          }}
        >
          <span 
            className="font-bold tracking-wide"
            style={{ 
              fontSize: size * 0.2,
              color: '#0066FF'
            }}
          >
            IcePulse
          </span>
        </div>
      )}
    </div>
  );
}
