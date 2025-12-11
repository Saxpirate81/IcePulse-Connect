/**
 * API Route: Invite User
 * Sends invitation email to a new user using Supabase Auth
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, role, organization_id, inviterName } = body

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, role' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    // Use Supabase Auth to invite user by email
    // This will automatically send an invitation email using the configured template
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            name,
            role,
            organization_id,
            inviterName,
          },
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/auth/callback`,
        }
      )

      if (authError) {
        console.error('Supabase auth error:', authError)
        return NextResponse.json(
          { error: 'Failed to send invitation email', details: authError.message },
          { status: 500 }
        )
      }

      // Create user record in users table if auth user was created
      if (authData?.user) {
        try {
          await supabaseAdmin.from('users').insert({
            auth_user_id: authData.user.id,
            email: email,
            name: name,
            role: role,
            organization_id: organization_id || null,
            status: 'active',
          })
        } catch (dbError: any) {
          console.error('Error creating user record:', dbError)
          // Don't fail the request if user record creation fails - auth user was created
        }
      }

      // Supabase Auth automatically sends the invitation email
      // The email template is configured in Supabase Dashboard > Authentication > Email Templates
      return NextResponse.json({
        success: true,
        message: 'Invitation email sent successfully',
        userId: authData?.user?.id,
      })
    } catch (emailError: any) {
      console.error('Error sending invitation email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send invitation email', details: emailError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in invite-user API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

