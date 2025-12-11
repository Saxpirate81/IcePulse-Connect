'use client'

import React, { useState } from 'react'
import AdminPageHeader from '@/components/AdminPageHeader'

export default function ChatScreen() {
  const [message, setMessage] = useState('')

  const messages = [
    { id: 1, sender: 'Coach Smith', text: 'Great game today!', time: '2:30 PM', isMe: false },
    { id: 2, sender: 'You', text: 'Thanks! The team played really well.', time: '2:32 PM', isMe: true },
    { id: 3, sender: 'Parent Johnson', text: 'When is the next practice?', time: '3:15 PM', isMe: false },
    { id: 4, sender: 'You', text: 'Next practice is Tuesday at 6 PM.', time: '3:20 PM', isMe: true },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      // Handle send message
      setMessage('')
    }
  }

  return (
    <div className="h-full bg-gradient-to-b from-background to-surface flex flex-col overflow-hidden w-full" style={{ overflowX: 'hidden', overflowY: 'hidden', height: '100%', maxHeight: '100%' }}>
      <AdminPageHeader />
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        <div className="px-4 md:px-6 pt-4 md:pt-6 pb-6">
          <div className="w-full max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-text mb-2">Chat</h1>
            <p className="text-textSecondary">Team communications</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          <div className="px-4 md:px-6 space-y-4">
            <div className="w-full max-w-4xl mx-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] ${msg.isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!msg.isMe && (
                      <p className="text-xs text-textSecondary mb-1 ml-1">{msg.sender}</p>
                    )}
                    <div
                      className={`rounded-2xl px-3 py-2 ${
                        msg.isMe
                          ? 'bg-primary text-text rounded-br-sm'
                          : 'bg-surface border border-border text-text rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm mb-1">{msg.text}</p>
                      <p className="text-xs opacity-70 text-right">{msg.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 py-4 border-t border-border bg-surface">
          <form onSubmit={handleSubmit} className="flex space-x-3 w-full max-w-4xl mx-auto">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 bg-background border border-border rounded-3xl px-4 py-3 text-text placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-text font-bold hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              →
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
