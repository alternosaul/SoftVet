// Supabase client configuration
// Uses environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// Vite loads .env from project root - restart dev server after changing .env

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Dev-only: verify .env is loaded (helps debug "wrong .env" issues)
if (import.meta.env.DEV) {
  const ok = !!supabaseUrl && !!supabaseAnonKey
  console.log('[VetSoft] Supabase env:', ok ? `OK (${supabaseUrl})` : 'MISSING - check .env and restart dev server')
}

// Use localStorage for session persistence (works in browser and Electron)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
})

// Check if Supabase is configured (for debugging)
export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey
}

// Debug info for "Invalid API key" - safe to show in UI (no secrets)
export function getSupabaseDebugInfo(): { urlOk: boolean; keyOk: boolean; urlPrefix: string } {
  return {
    urlOk: !!supabaseUrl,
    keyOk: !!supabaseAnonKey,
    urlPrefix: supabaseUrl ? `${supabaseUrl.slice(0, 30)}...` : '(empty)'
  }
}
