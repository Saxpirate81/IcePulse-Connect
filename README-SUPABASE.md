# Supabase Setup Instructions

## 1. Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```bash
# Get these from your Supabase project settings:
# https://app.supabase.com/project/YOUR_PROJECT/settings/api

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 2. Getting Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## 3. Database Schema

Make sure your Supabase database has the following tables matching the schema from `ice-pulse-app`:

- `organizations`
- `teams`
- `seasons`
- `games`
- `users`
- `rosters`
- `roster_memberships`
- `persons`
- `goals`
- `penalties`
- `shifts`
- `shots`
- `clips`
- `play_types`

## 4. Enabling Supabase in Components

To enable Supabase queries in the management components, pass `useSupabase={true}`:

```tsx
<TeamManagement
  teams={teams}
  useSupabase={true}
  // ... other props
/>
```

## 5. Testing the Connection

The app will automatically use Supabase when:
- Environment variables are set
- `useSupabase={true}` is passed to components
- Supabase client is properly initialized

If Supabase is not configured, the components will fall back to mock data handlers.

## 6. Row Level Security (RLS)

Make sure to set up Row Level Security policies in Supabase to control access to data based on user roles and organizations.

