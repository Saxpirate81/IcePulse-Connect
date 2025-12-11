# Database Setup Instructions

## Step 1: Create New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: IcePulse Connect
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)

## Step 2: Run the Schema Migration

1. In your new Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase_migrations/001_initial_schema.sql`
4. Paste into the SQL Editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. Verify success - you should see "Success. No rows returned"

## Step 3: Update Environment Variables

1. In Supabase Dashboard, go to **Settings** > **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - **Keep this secret!**

3. Update your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Verify Setup

1. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

2. In the app, you should see:
   - Admin header with Supabase toggle (only visible to admin users)
   - Organization selector
   - Privilege level selector

3. Test creating:
   - An organization (should auto-create one)
   - A season
   - A team
   - A player

## Step 5: Create Your First Admin User

1. Go to Supabase Dashboard > **Authentication** > **Users**
2. Click "Add user" > "Create new user"
3. Enter:
   - **Email**: admin@icepulse.com (or your email)
   - **Password**: (choose a secure password)
   - **Auto Confirm User**: ✅ (check this)
4. Click "Create user"

5. In Supabase Dashboard > **Table Editor** > **users**
6. Click "Insert row"
7. Fill in:
   - **auth_user_id**: (copy the UUID from the user you just created in Auth)
   - **email**: admin@icepulse.com
   - **name**: Admin User
   - **role**: organizational
   - **organization_id**: (copy the UUID from the organizations table - should be the default one created)

## Step 6: Test Admin Features

1. Log in with your admin credentials
2. You should see:
   - Admin header controls (Supabase toggle, Organization selector, Privilege Level selector)
   - Full access to all admin features

3. Test switching:
   - Supabase toggle (on/off)
   - Organization selector
   - Privilege Level (organizational, coach, player, parent)

## Notes

- **Admin Testing Features**: Only visible to users with `role = 'organizational'`
- **Regular Users**: Will NOT see the admin testing controls
- **Default Organization**: Created automatically when you run the schema
- **RLS Policies**: Currently set to allow all for authenticated users (we'll refine this later)

## Troubleshooting

### "Supabase not configured" error
- Check that `.env.local` has all three Supabase keys
- Restart the dev server after updating `.env.local`

### "No organizations found"
- Check that the schema migration ran successfully
- Verify the `organizations` table has at least one row

### Admin header not showing
- Make sure you're logged in as a user with `role = 'organizational'`
- Check the `users` table to verify your role

### Can't create teams/seasons
- Make sure you've selected an organization in the header
- Verify the organization exists in the database

