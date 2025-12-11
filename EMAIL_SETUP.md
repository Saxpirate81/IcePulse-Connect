# Email Setup Guide for IcePulse Connect

This guide will help you set up automated emails for user invitations and password resets using your IcePulse email address.

## Option 1: Using Supabase Auth (Recommended - Built-in)

Supabase Auth has built-in email functionality that you can configure with your own SMTP server or use their default service.

### Step 1: Configure SMTP in Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Settings** > **Email**
3. Enable **Custom SMTP** (optional - you can use Supabase's default email service)
4. If using custom SMTP, enter your SMTP credentials:
   - **SMTP Host**: Your SMTP server (e.g., `smtp.gmail.com`, `smtp.office365.com`)
   - **SMTP Port**: Usually `587` for TLS or `465` for SSL
   - **SMTP User**: Your email address
   - **SMTP Password**: Your email password or app-specific password
   - **SMTP Sender Name**: IcePulse Connect
   - **SMTP Admin Email**: noreply@icepulse.com

### Step 2: Customize Email Templates
1. Go to **Authentication** > **Email Templates**
2. Customize the templates for:
   - **Invite User** - Customize the invitation email
   - **Reset Password** - Customize the password reset email
   - **Magic Link** (if using)

### Step 3: No Code Changes Needed!
The app is already configured to use Supabase Auth for emails. Just make sure your Supabase project has email configured.

### Benefits
- ✅ No external API keys needed
- ✅ Integrated with your Supabase project
- ✅ Email templates customizable in dashboard
- ✅ Works with custom SMTP or Supabase's default service

## Option 2: Using Resend (Alternative)

### Step 1: Create Resend Account
1. Go to [resend.com](https://resend.com) and sign up for a free account
2. Verify your email address
3. Add and verify your domain (icepulse.com) or use their test domain for development

### Step 2: Get Your API Key
1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it "IcePulse Connect Production" (or similar)
4. Copy the API key (starts with `re_`)

### Step 3: Add Environment Variables
Add these to your `.env.local` file:

```env
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here

# Email Configuration
EMAIL_FROM=noreply@icepulse.com
EMAIL_FROM_NAME=IcePulse Connect
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Step 4: Verify Domain (Production)
1. In Resend dashboard, go to **Domains**
2. Add your domain (e.g., `icepulse.com`)
3. Add the DNS records they provide to your domain registrar
4. Wait for verification (usually takes a few minutes)

## Option 2: Using Gmail (Free & Easy)

**Yes, you CAN use your Gmail account!** Here's how:

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled

### Step 2: Create App-Specific Password
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select **Mail** and **Other (Custom name)**
3. Name it "IcePulse Connect" (or similar)
4. Click **Generate**
5. **Copy the 16-character password** (you won't see it again!)

### Step 3: Install Nodemailer
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### Step 4: Update Email Service
Replace the Resend implementation in `lib/email.ts` with Nodemailer:

```typescript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Use the app-specific password
  },
})

// Then update sendInvitationEmail and sendPasswordResetEmail to use:
await transporter.sendMail({
  from: `${FROM_NAME} <${FROM_EMAIL}>`,
  to: email,
  subject: '...',
  html: '...',
  text: '...',
})
```

### Step 5: Add Gmail Environment Variables
Add these to your `.env.local` file:

```env
# Gmail Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Email Settings
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=IcePulse Connect
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Gmail Limits
- **Free Gmail**: 500 emails/day
- **Google Workspace**: 2,000 emails/day
- Perfect for most applications!

## Option 3: Using Your Own SMTP Server

If you prefer to use your own email server (Outlook, custom SMTP):

### Step 1: Get SMTP Credentials
You'll need:
- SMTP Host (e.g., `smtp.gmail.com`, `smtp.office365.com`)
- SMTP Port (usually `587` for TLS or `465` for SSL)
- SMTP Username (your email address)
- SMTP Password (app-specific password for Gmail/Outlook)

### Step 2: Install Nodemailer
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### Step 3: Update Email Service
Replace the Resend implementation in `lib/email.ts` with Nodemailer:

```typescript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})
```

### Step 4: Add SMTP Environment Variables
```env
SMTP_HOST=smtp.icepulse.com
SMTP_PORT=587
SMTP_USER=noreply@icepulse.com
SMTP_PASSWORD=your_smtp_password
EMAIL_FROM=noreply@icepulse.com
EMAIL_FROM_NAME=IcePulse Connect
```

## Option 3: Using Supabase Auth Email (Built-in)

Supabase has built-in email functionality that you can configure:

### Step 1: Configure SMTP in Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Settings** > **Email**
3. Enable **Custom SMTP**
4. Enter your SMTP credentials:
   - **SMTP Host**: Your SMTP server
   - **SMTP Port**: Usually 587
   - **SMTP User**: Your email address
   - **SMTP Password**: Your email password
   - **SMTP Sender Name**: IcePulse Connect
   - **SMTP Admin Email**: noreply@icepulse.com

### Step 2: Customize Email Templates
1. Go to **Authentication** > **Email Templates**
2. Customize the templates for:
   - **Invite User**
   - **Reset Password**
   - **Magic Link** (if using)

### Step 3: Use Supabase Auth Functions
The password reset will work automatically with Supabase Auth. For invitations, you can use:

```typescript
await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
  data: { name, role }
})
```

## Testing

### Test Invitation Email
1. Go to Admin > Users
2. Click "Add User"
3. Fill in the form
4. Check "Send invitation email to user"
5. Click "Save"
6. Check the user's email inbox

### Test Password Reset
1. Go to Login screen
2. Click "Forgot your password?"
3. Enter an email address
4. Check the email inbox for reset link

## Troubleshooting

### Emails Not Sending
1. Check that `RESEND_API_KEY` is set in `.env.local`
2. Verify your domain in Resend (for production)
3. Check Resend dashboard for delivery status
4. Check spam/junk folder
5. Verify `NEXT_PUBLIC_APP_URL` is correct

### Resend API Errors
- **401 Unauthorized**: Check your API key
- **422 Validation Error**: Check email format
- **429 Rate Limit**: You've hit the free tier limit (100 emails/day)

### SMTP Errors
- **Connection timeout**: Check SMTP host and port
- **Authentication failed**: Verify username and password
- **TLS/SSL errors**: Try different port (587 vs 465)

## Production Checklist

- [ ] Domain verified in Resend (or SMTP configured)
- [ ] `RESEND_API_KEY` added to production environment
- [ ] `EMAIL_FROM` set to your verified domain
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] Email templates customized
- [ ] Test emails sent and received successfully

## Free Tier Limits

**Resend Free Tier:**
- 3,000 emails/month
- 100 emails/day
- 1 domain

**Supabase Free Tier:**
- Uses their default email service (limited)
- Custom SMTP recommended for production

