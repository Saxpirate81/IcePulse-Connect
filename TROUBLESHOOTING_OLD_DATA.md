# Troubleshooting: Old Database Data Showing

If you're seeing organizations (or other data) from your old database, here's how to fix it:

## Issue: App Still Connected to Old Supabase Project

The app is pulling data from your old Supabase project because your environment variables still point to it.

## Solution Steps

### 1. Check Your Current Supabase Connection

Your `.env.local` file should have the NEW Supabase project credentials. Check:

```bash
cat .env.local | grep SUPABASE
```

You should see:
- `NEXT_PUBLIC_SUPABASE_URL` - Should be your NEW project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Should be your NEW project anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Should be your NEW project service role key

### 2. Update Environment Variables

1. Go to your **NEW** Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

4. Update your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-NEW-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...YOUR-NEW-ANON-KEY
SUPABASE_SERVICE_ROLE_KEY=eyJ...YOUR-NEW-SERVICE-ROLE-KEY
```

### 3. Restart Your Dev Server

**IMPORTANT**: After updating `.env.local`, you MUST restart your Next.js dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

Environment variables are only loaded when the server starts!

### 4. Verify Connection

1. In the app, make sure the **Supabase toggle** is ON (in the admin header)
2. Check the browser console for any errors
3. The organizations list should now show only data from your NEW database

### 5. Clear Browser Cache (if needed)

If you still see old data after updating env vars and restarting:

1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Clear:
   - **Local Storage** → Remove all `icepulse` related items
   - **Session Storage** → Clear all
4. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### 6. Verify New Database

1. Go to your NEW Supabase project dashboard
2. Navigate to **Table Editor** > **organizations**
3. You should see only the default organization: "IcePulse Organization"
4. If you see old organizations, they were migrated - you can delete them

## Quick Check: Which Database Am I Connected To?

To verify which Supabase project you're connected to:

1. Check the Supabase URL in your `.env.local`
2. Compare it to your Supabase dashboard URL
3. They should match!

## Still Seeing Old Data?

If you've done all the above and still see old data:

1. **Double-check** your `.env.local` file has the NEW project credentials
2. **Restart** your dev server (this is critical!)
3. **Clear** browser localStorage
4. **Check** the browser console for connection errors
5. **Verify** in Supabase dashboard that your new project only has the default organization

## Expected Behavior

After connecting to the new database:
- You should see **only one organization**: "IcePulse Organization" (the default one created by the schema)
- All other data (teams, seasons, games, players) should be empty
- This is correct - you're starting fresh!

