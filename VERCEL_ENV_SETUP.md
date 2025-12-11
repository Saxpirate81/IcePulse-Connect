# Vercel Environment Variables Setup Guide

## Required Environment Variables

You need to set up the following environment variables in your Vercel project:

### 1. Supabase Configuration (Required)

These are the most important variables for your app to work:

- **`NEXT_PUBLIC_SUPABASE_URL`**
  - Your Supabase project URL
  - Format: `https://xxxxx.supabase.co`
  - Find it in: Supabase Dashboard → Settings → API → Project URL

- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
  - Your Supabase anonymous/public key
  - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Find it in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

- **`SUPABASE_SERVICE_ROLE_KEY`** (⚠️ Secret - never expose to client)
  - Your Supabase service role key
  - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Find it in: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
  - ⚠️ **IMPORTANT**: This key has admin access. Never expose it in client-side code.

### 2. Application URL (Optional but Recommended)

- **`NEXT_PUBLIC_APP_URL`**
  - Your production app URL
  - Format: `https://your-app.vercel.app` or your custom domain
  - Used for email links and redirects
  - If not set, will default to `http://localhost:3000`

### 3. Super Admin Email (Optional)

- **`NEXT_PUBLIC_SUPER_ADMIN_EMAIL`**
  - Email address for the super admin user
  - Default: `admin@icepulse.com`
  - Used for initial admin access

## How to Add Environment Variables in Vercel

### Step 1: Go to Your Project Settings
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project (`icepulse-connect-main` or your project name)
3. Go to **Settings** tab
4. Click on **Environment Variables** in the left sidebar

### Step 2: Add Each Variable
For each environment variable:

1. Click **Add New**
2. Enter the **Name** (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
3. Enter the **Value** (your actual key/URL)
4. Select which environments to apply to:
   - ✅ **Production** (for live site)
   - ✅ **Preview** (for preview deployments)
   - ✅ **Development** (optional, for local dev)
5. Click **Save**

### Step 3: Redeploy
After adding all variables:
1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic redeploy

## Quick Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (secret)
- [ ] `NEXT_PUBLIC_APP_URL` - Your Vercel app URL (optional)
- [ ] `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` - Super admin email (optional)

## Where to Find Your Supabase Keys

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Settings** (gear icon) in the left sidebar
4. Click **API** under Project Settings
5. You'll see:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** section:
     - `anon` `public` → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` `secret` → Use for `SUPABASE_SERVICE_ROLE_KEY`

## Security Notes

- ✅ Variables starting with `NEXT_PUBLIC_` are exposed to the browser (safe for public keys)
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` should **NEVER** start with `NEXT_PUBLIC_` (it's server-only)
- 🔒 Never commit `.env` files to Git (they're already in `.gitignore`)

## Testing

After setting up environment variables and redeploying:
1. Check the Vercel deployment logs for any errors
2. Try logging in to your app
3. Check browser console for any Supabase connection errors

## Need Help?

If you see errors like:
- "Supabase credentials not configured" → Check that all 3 Supabase variables are set
- "Failed to connect to Supabase" → Verify your Supabase URL and keys are correct
- "Unauthorized" → Check that your keys match your Supabase project

