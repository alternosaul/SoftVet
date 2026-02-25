/**
 * Ensures Vite has access to env vars during Vercel build.
 * Vercel injects vars into process.env, but Vite loads from .env file.
 * This script writes process.env to .env so Vite picks them up at build time.
 * Supports both manual vars (VITE_*) and Vercel+Supabase integration (SUPABASE_*, NEXT_PUBLIC_*).
 * Only runs when VERCEL=1 (build on Vercel). Local dev uses existing .env.
 */
const fs = require('fs')
const path = require('path')

if (process.env.VERCEL !== '1') {
  console.log('[ensure-env] Skipped (not Vercel build)')
  process.exit(0)
}

// Resolve Supabase URL: Vercel integration first (SUPABASE_*), then Vite vars
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ''

// Resolve Supabase anon key: Vercel integration first (SUPABASE_ANON_KEY), then Vite vars
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ''

// Validate - build fails if missing (clear feedback)
if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
  console.error('[ensure-env] ERROR: Missing Supabase URL or anon key')
  console.error('[ensure-env] Sources checked: VITE_SUPABASE_*, SUPABASE_*, NEXT_PUBLIC_SUPABASE_*')
  console.error('[ensure-env] If using Vercel+Supabase integration, ensure it is connected.')
  process.exit(1)
}

// Build .env content - Vite expects VITE_* prefix
const envLines = [
  `VITE_SUPABASE_URL=${supabaseUrl}`,
  `VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}`,
  `VITE_GOOGLE_CLIENT_ID=${process.env.VITE_GOOGLE_CLIENT_ID || ''}`,
  `VITE_GOOGLE_CLIENT_SECRET=${process.env.VITE_GOOGLE_CLIENT_SECRET || ''}`,
  `VITE_GOOGLE_REDIRECT_URI=${process.env.VITE_GOOGLE_REDIRECT_URI || ''}`
].join('\n')

const envPath = path.join(__dirname, '..', '.env')
fs.writeFileSync(envPath, envLines + '\n')

console.log('[ensure-env] OK - Supabase URL and anon key resolved for Vite build')
