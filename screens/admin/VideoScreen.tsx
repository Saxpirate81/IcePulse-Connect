'use client'

import React from 'react'
import AdminPageHeader from '@/components/AdminPageHeader'

export default function VideoScreen() {
  return (
    <div className="h-full bg-gradient-to-b from-background to-surface flex flex-col overflow-hidden w-full" style={{ overflowX: 'hidden', overflowY: 'hidden', height: '100%', maxHeight: '100%' }}>
      <AdminPageHeader />
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="px-4 md:px-6 py-4 md:py-6 w-full">
          <div className="w-full max-w-full">
            <h1 className="text-4xl md:text-5xl font-bold text-text mb-2">Video</h1>
            <p className="text-textSecondary mb-6 md:mb-8">Game footage and highlights</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div className="relative w-full h-48 bg-surfaceLight flex items-center justify-center">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity">
                      <span className="text-2xl text-text ml-1">▶</span>
                    </div>
                  </div>
                  <div className="p-4 md:p-6">
                    <h3 className="text-lg font-semibold text-text mb-1">Game Highlights #{item}</h3>
                    <p className="text-sm text-textSecondary mb-1">Team A vs Team B</p>
                    <p className="text-xs text-textMuted">Dec 15, 2024</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
