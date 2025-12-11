'use client'

import React from 'react'

export default function ProfileScreen() {
  const menuItems = [
    { icon: '👤', label: 'Edit Profile', action: () => {} },
    { icon: '⚙️', label: 'Settings', action: () => {} },
    { icon: '🔔', label: 'Notifications', action: () => {} },
    { icon: '👥', label: 'Manage Users', action: () => {} },
    { icon: '📊', label: 'Reports', action: () => {} },
    { icon: '❓', label: 'Help & Support', action: () => {} },
    { icon: '🚪', label: 'Logout', action: () => {}, isDestructive: true },
  ]

  return (
    <div className="h-full bg-gradient-to-b from-background to-surface flex flex-col overflow-hidden w-full" style={{ overflowX: 'hidden', overflowY: 'hidden', height: '100%', maxHeight: '100%' }}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="px-4 md:px-6 py-4 md:py-6 w-full">
          <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-primary to-secondary rounded-full mb-4">
                <span className="text-4xl font-bold text-text">A</span>
              </div>
              <h1 className="text-3xl font-bold text-text mb-2">Admin User</h1>
              <p className="text-textSecondary mb-3">admin@icepulse.com</p>
              <span className="inline-block bg-primary px-4 py-1.5 rounded-full text-sm font-semibold text-text">
                Admin
              </span>
            </div>

            <div className="flex justify-around bg-surface border border-border rounded-2xl p-5 md:p-6 mb-8">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary mb-1">12</p>
                <p className="text-xs text-textSecondary">Teams</p>
              </div>
              <div className="w-px bg-border"></div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary mb-1">156</p>
                <p className="text-xs text-textSecondary">Players</p>
              </div>
              <div className="w-px bg-border"></div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary mb-1">24</p>
                <p className="text-xs text-textSecondary">Coaches</p>
              </div>
            </div>

            <div className="space-y-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className={`w-full flex items-center space-x-4 bg-surface border rounded-xl p-4 hover:border-primary/50 transition-colors ${
                    item.isDestructive ? 'border-error' : 'border-border'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className={`flex-1 text-left font-medium ${
                    item.isDestructive ? 'text-error' : 'text-text'
                  }`}>
                    {item.label}
                  </span>
                  <span className="text-textSecondary text-xl">›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
