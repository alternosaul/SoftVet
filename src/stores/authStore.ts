// Auth store - Supabase Auth
// Manages authentication state with email/password and optional Google

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface User {
  id: string
  email: string
  name: string
  picture?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  // Google integration (optional, for Calendar/Gmail)
  googleCalendarEnabled: boolean
  googleGmailEnabled: boolean
  googleCalendarId: string
  // Methods
  setAuth: (user: User) => void
  logout: () => void
  setGoogleCalendarEnabled: (enabled: boolean) => void
  setGoogleGmailEnabled: (enabled: boolean) => void
  setGoogleCalendarId: (calendarId: string) => void
  checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      isLoading: true,
      googleCalendarEnabled: false,
      googleGmailEnabled: false,
      googleCalendarId: 'primary',

      setAuth: (user) => {
        set({
          isAuthenticated: true,
          user,
          isLoading: false
        })
      },

      logout: async () => {
        // Update state first so UI responds immediately (redirect to login)
        set({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          googleCalendarEnabled: false,
          googleGmailEnabled: false,
          googleCalendarId: 'primary'
        })
        // Sign out from Supabase in background
        try {
          await supabase.auth.signOut()
        } catch (err) {
          console.error('Supabase signOut error:', err)
        }
      },

      setGoogleCalendarEnabled: (enabled) => set({ googleCalendarEnabled: enabled }),
      setGoogleGmailEnabled: (enabled) => set({ googleGmailEnabled: enabled }),
      setGoogleCalendarId: (calendarId) => set({ googleCalendarId: calendarId }),

      // Check session: only sets isLoading. Auth state comes from onAuthStateChange (single source of truth).
      // getSession() returns cached data and can be stale; Supabase validates and may fire SIGNED_OUT.
      checkSession: async () => {
        set({ isLoading: true })
        if (!isSupabaseConfigured()) {
          set({ isAuthenticated: false, user: null, isLoading: false })
          return
        }
        const timeout = (ms: number) => new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), ms))
        try {
          await Promise.race([supabase.auth.getSession(), timeout(15000)])
          // Do NOT set auth here - getSession() can return stale cached data.
          // onAuthStateChange will set the real auth state after server validation.
          // Only clear loading if onAuthStateChange hasn't fired yet (timeout fallback).
          const state = get()
          if (state.isLoading) {
            set({ isLoading: false })
          }
        } catch (error) {
          const isTimeout = error instanceof Error && error.message === 'Session check timeout'
          if (isTimeout) {
            console.warn('Auth: Supabase unreachable or slow. Check VITE_SUPABASE_URL and network.')
          } else {
            console.error('Auth session check failed:', error)
          }
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false
          })
        }
      }
    }),
    {
      name: 'vetsoft-auth',
      partialize: (state) => ({
        googleCalendarEnabled: state.googleCalendarEnabled,
        googleGmailEnabled: state.googleGmailEnabled,
        googleCalendarId: state.googleCalendarId
      })
    }
  )
)

export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated
export const selectUser = (state: AuthState) => state.user
export const selectGoogleCalendarEnabled = (state: AuthState) => state.googleCalendarEnabled
export const selectGoogleGmailEnabled = (state: AuthState) => state.googleGmailEnabled
export const selectGoogleCalendarId = (state: AuthState) => state.googleCalendarId
