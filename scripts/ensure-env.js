/**
 * Ensures Vite has access to env vars during Vercel build.
 * Vercel injects vars into process.env, but Vite may not always pick them up.
 * This script writes them to .env so Vite loads them when it starts.
 * Only runs when VERCEL=1 (build on Vercel). Local dev uses existing .env.
 */
const fs = require('fs')
const path = require('path')

if (process.env.VERCEL !== '1') {
  console.log('[ensure-env] Skipped (not Vercel build)')
  process.exit(0)
}

const envVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_GOOGLE_CLIENT_SECRET',
  'VITE_GOOGLE_REDIRECT_URI',
]

const lines = envVars
  .map((key) => {
    const val = process.env[key] || ''
    return `${key}=${val}`
  })
  .join('\n')

const envPath = path.join(__dirname, '..', '.env')
fs.writeFileSync(envPath, lines + '\n')

// Log only keys (never values) for build verification
const found = envVars.filter((k) => !!process.env[k])
console.log('[ensure-env] Wrote .env with', found.length, 'of', envVars.length, 'vars:', found.join(', ') || '(none)')
