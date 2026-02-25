# Supabase Setup for VetSoft

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Wait for the database to be ready

## 2. Run the Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Run **001_initial_schema.sql** first:
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy and paste the entire SQL into the editor
   - Click **Run**
3. Run **002_extended_schema.sql** for extended features (pet care, payments, inventory):
   - Open `supabase/migrations/002_extended_schema.sql`
   - Copy and paste the entire SQL into the editor
   - Click **Run**

## 3. Configure Environment Variables

1. Copy `.env.example` to `.env`
2. In Supabase Dashboard, go to **Settings** → **API**
3. Copy these values to your `.env`:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 4. Configure Auth (Optional)

### Email/Password

- Email/password auth is enabled by default
- To disable email confirmation for testing: **Authentication** → **Providers** → **Email** → uncheck "Confirm email"

### Google OAuth

1. Go to **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Add your Google Client ID and Secret from [Google Cloud Console](https://console.cloud.google.com)
4. Add redirect URL: `http://localhost:5173/auth/callback` (for dev) and your production URL

## 5. Storage (for appointment attachments - optional)

To enable PDF/image uploads for appointments:

1. Go to **Storage** in Supabase Dashboard
2. Create a new bucket named `appointment-attachments`
3. Set it to **Public** (or configure RLS policies for authenticated users)
4. Run migration **004_appointment_attachments.sql** in SQL Editor

## 6. Run the App

```bash
npm run dev
```

Sign up with email/password or use Google to log in. New users get demo data (clients, pets, appointments) automatically.

## Troubleshooting

### Cannot log in
- **Email not confirmed**: Supabase requires email confirmation by default. Check your inbox and click the verification link. Or disable it in Supabase Dashboard → Authentication → Providers → Email → uncheck "Confirm email".
- **Invalid credentials**: Verify email and password. For new sign-ups, ensure you've confirmed your email first.
- **Connection error**: Verify `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Supabase Dashboard → Settings → API.

### Clients/Pets data not showing
- **Migrations not run**: Run `001_initial_schema.sql`, then `002_extended_schema.sql`, then `003_full_schema.sql` in Supabase SQL Editor. Without these, the tables do not exist.
- **RLS / user_id mismatch**: If you inserted data manually via SQL Editor with a different user_id, the app won't show it. Go to Settings → Data and run the UPDATE queries with your User ID.
- **Session expired**: Try logging out and back in. Click "Reintentar" in the error banner if data fails to load.

## Deploy on Vercel (Production)

If login works locally but not on Vercel, check:

### 1. Environment variables in Vercel

1. Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add exactly (names must match):
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon/public key
3. **Important**: Assign to **Production** (and **Preview** if you use preview deploys)
4. Redeploy after adding/changing variables (Deployments → ⋮ → Redeploy)

### 2. Supabase Site URL and Redirect URLs

Supabase must allow your production domain:

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Site URL**: set to `https://tu-app.vercel.app` (your Vercel URL)
3. **Redirect URLs**: add:
   - `https://tu-app.vercel.app/**`
   - `https://tu-app.vercel.app/auth/callback`

Without this, Supabase may reject auth requests from your production domain.

### 3. Build logs

If the build fails with `[ensure-env] ERROR: Missing required env vars`, the variables are not reaching the build. Verify names and environment scope in Vercel.
