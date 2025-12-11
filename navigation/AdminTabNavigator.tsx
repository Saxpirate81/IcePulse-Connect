'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FileText, Video, TrendingUp, MessageCircle, User } from 'lucide-react'
import { useGame } from '@/contexts/GameContext'

interface AdminTabNavigatorProps {
  children: React.ReactNode
}

const tabs = [
  { name: 'Log', href: '/admin', icon: FileText },
  { name: 'Video', href: '/admin/video', icon: Video },
  { name: 'Stats', href: '/admin/stats', icon: TrendingUp },
  { name: 'Chat', href: '/admin/chat', icon: MessageCircle },
  { name: 'Admin', href: '/admin/profile', icon: User },
]

export default function AdminTabNavigator({ children }: AdminTabNavigatorProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { 
    setSelectedSeason, 
    setSelectedTeam, 
    setSelectedGame, 
    setLoggingMode, 
    setSelectedLogItems,
    setActiveLogView 
  } = useGame()
  
  // Check if we're in a logger view
  const isLoggerView = pathname?.startsWith('/admin/log')

  const handleLogClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Only reset if we're NOT already in a logger view
    // If we're in a logger view, clicking Log should just navigate to the main log screen
    // without clearing the logging mode
    if (!isLoggerView) {
      // Reset game selection state and clear localStorage
      setSelectedSeason(null)
      setSelectedTeam(null)
      setSelectedGame(null)
      setLoggingMode(null)
      setSelectedLogItems([])
      setActiveLogView(null)
      // Clear localStorage to prevent reloading old state
      localStorage.removeItem('gameState')
      localStorage.removeItem('loggingMode')
    }
    // Navigate to admin page
    router.push('/admin')
  }

  return (
    <div className="h-screen bg-gradient-to-b from-background to-surface flex flex-col relative overflow-hidden w-full">
      {/* Main content area - fixed height, no page scroll, but can scroll within */}
      <main className={`flex-1 overflow-hidden flex flex-col w-full ${!isLoggerView ? 'pb-16' : ''}`}>
        {children}
      </main>

      {/* Bottom Navigation - Fixed at bottom with solid background - Hidden in logger views */}
      {!isLoggerView && (
        <nav className="bottom-nav bg-surface border-t border-border shadow-2xl">
          <div className="flex justify-around items-center h-full safe-area-inset-bottom">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href === '/admin' && pathname === '/admin')
            const IconComponent = tab.icon
            
            // Special handling for Log button to reset state
            if (tab.name === 'Log') {
              return (
                <button
                  key={tab.name}
                  onClick={handleLogClick}
                  className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                    isActive ? 'text-primary' : 'text-textSecondary'
                  }`}
                >
                  <IconComponent 
                    size={26} 
                    className={`mb-1 transition-all duration-200 ${
                      isActive ? 'scale-110 text-primary drop-shadow-[0_0_8px_rgba(0,102,255,0.6)]' : 'scale-100 text-textSecondary opacity-90'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2.2}
                  />
                  <span className={`text-xs font-semibold transition-colors ${
                    isActive ? 'text-primary' : 'text-textSecondary'
                  }`}>
                    {tab.name}
                  </span>
                </button>
              )
            }
            
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                  isActive ? 'text-primary' : 'text-textSecondary'
                }`}
              >
                <IconComponent 
                  size={26} 
                  className={`mb-1 transition-all duration-200 ${
                    isActive ? 'scale-110 text-primary drop-shadow-[0_0_8px_rgba(0,102,255,0.6)]' : 'scale-100 text-textSecondary opacity-90'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2.2}
                />
                <span className={`text-xs font-semibold transition-colors ${
                  isActive ? 'text-primary' : 'text-textSecondary'
                }`}>
                  {tab.name}
                </span>
              </Link>
            )
          })}
          </div>
        </nav>
      )}

    </div>
  )
}
