/**
 * Ensures Vite has access to env vars during Vercel build.
 * Vercel injects vars into process.env, but Vite loads from .env file.
 * This script writes process.env to .env so Vite picks them up at build time.
 * Only runs when VERCEL=1 (build on Vercel). Local dev uses existing .env.
 */
const fs = require('fs')
const path = require('path')

if (process.env.VERCEL !== '1') {
  console.log('[ensure-env] Skipped (not Vercel build)')
  process.exit(0)
}

// Required for Supabase connection - build fails if missing (clear feedback)
const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
// Optional (Google OAuth)
const optional = ['VITE_GOOGLE_CLIENT_ID', 'VITE_GOOGLE_CLIENT_SECRET', 'VITE_GOOGLE_REDIRECT_URI']
const envVars = [...required, ...optional]

// Validate required vars before writing
const missing = required.filter((k) => !process.env[k] || process.env[k].trim() === '')
if (missing.length > 0) {
  console.error('[ensure-env] ERROR: Missing required env vars in Vercel:', missing.join(', '))
  console.error('[ensure-env] Add them in Vercel Dashboard → Project → Settings → Environment Variables')
  console.error('[ensure-env] Names must be exactly: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
  console.error('[ensure-env] Assign to Production (and Preview if you use preview deploys)')
  process.exit(1)
}

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
console.log('[ensure-env] OK - wrote .env with', found.length, 'vars:', found.join(', '))
