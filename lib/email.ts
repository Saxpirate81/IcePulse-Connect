/**
 * Email Service
 * Handles sending emails via Supabase Auth
 */

import { supabaseAdmin } from '@/lib/supabase'

// Email configuration
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Send user invitation email
 */
export async function sendInvitationEmail({
  to,
  name,
  role,
  invitationToken,
  inviterName,
}: {
  to: string
  name: string
  role: string
  invitationToken: string
  inviterName?: string
}) {
  if (!supabaseAdmin) {
    console.error('Supabase not configured')
    throw new Error('Email service not configured')
  }

  try {
    // Use Supabase Auth to send invitation email
    // This will use the email templates configured in Supabase Dashboard
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(to, {
      data: { 
        name,
        role,
        inviterName 
      },
      redirectTo: `${APP_URL}/auth/accept-invitation`,
    })

    if (error) {
      console.error('Error sending invitation email via Supabase:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to send invitation email:', error)
    throw error
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetToken,
  resetUrl,
}: {
  to: string
  name: string
  resetToken: string
  resetUrl?: string
}) {
  if (!supabaseAdmin) {
    console.error('Supabase not configured')
    throw new Error('Email service not configured')
  }

  try {
    // Use Supabase Auth to send password reset email
    // This will use the email templates configured in Supabase Dashboard
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: to,
      options: {
        redirectTo: resetUrl || `${APP_URL}/auth/reset-password`,
      },
    })

    if (error) {
      console.error('Error sending password reset email via Supabase:', error)
      throw error
    }

    // Supabase will automatically send the email using the configured template
    return data
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    throw error
  }
}

