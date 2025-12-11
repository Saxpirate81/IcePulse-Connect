'use client'

import React from 'react'
import AdminPageHeader from '@/components/AdminPageHeader'

export default function StatsScreen() {
  const stats = [
    { label: 'Total Games', value: '48', change: '+12%' },
    { label: 'Goals Scored', value: '342', change: '+8%' },
    { label: 'Assists', value: '289', change: '+15%' },
    { label: 'Save Percentage', value: '92.5%', change: '+2.3%' },
  ]

  return (
    <div className="h-full bg-gradient-to-b from-background to-surface flex flex-col overflow-hidden w-full" style={{ overflowX: 'hidden', overflowY: 'hidden', height: '100%', maxHeight: '100%' }}>
      <AdminPageHeader />
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="px-4 md:px-6 py-4 md:py-6 w-full">
          <div className="w-full max-w-full">
            <h1 className="text-4xl md:text-5xl font-bold text-text mb-2">Stats</h1>
            <p className="text-textSecondary mb-6 md:mb-8">Performance analytics</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <p className="text-sm text-textSecondary mb-2">{stat.label}</p>
                  <p className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</p>
                  <span className="inline-block bg-success px-2 py-1 rounded-lg text-xs font-semibold text-text">
                    {stat.change}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-text mb-4">Top Performers</h2>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((rank) => (
                  <div
                    key={rank}
                    className="flex items-center space-x-4 bg-surface border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-text">{rank}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-text">Player {rank}</p>
                      <p className="text-xs text-textMuted">Team A</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">24</p>
                      <p className="text-xs text-textMuted">Goals</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
