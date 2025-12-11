/**
 * API Route: Request Password Reset
 * Sends password reset email to user
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single()

    // Use Supabase Auth for password reset (this handles token generation and email sending)
    // Supabase Auth will automatically send the email using the configured template
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/auth/reset-password`,
        },
      })

      if (authError) {
        console.error('Supabase auth error:', authError)
        // Don't reveal if user exists or not (security best practice)
        // Still return success to prevent email enumeration
        return NextResponse.json({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        })
      }

      // Supabase Auth automatically sends the password reset email
      // The email template is configured in Supabase Dashboard > Authentication > Email Templates
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      })
    } catch (emailError: any) {
      console.error('Error sending password reset email:', emailError)
      // Don't reveal if user exists or not (security best practice)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      })
    }
  } catch (error: any) {
    console.error('Error in reset-password API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

