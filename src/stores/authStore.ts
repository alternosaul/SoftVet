import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  picture?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  // Google OAuth specific
  googleCalendarEnabled: boolean
  googleGmailEnabled: boolean
  googleCalendarId: string
  // Methods
  setAuth: (user: User, accessToken: string, refreshToken: string, expiresIn: number) => void
  logout: () => void
  updateAccessToken: (accessToken: string, expiresIn: number) => void
  setGoogleCalendarEnabled: (enabled: boolean) => void
  setGoogleGmailEnabled: (enabled: boolean) => void
  setGoogleCalendarId: (calendarId: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      googleCalendarEnabled: false,
      googleGmailEnabled: false,
      googleCalendarId: 'primary',
      
      setAuth: (user, accessToken, refreshToken, expiresIn) => {
        const expiresAt = Date.now() + expiresIn * 1000
        set({
          isAuthenticated: true,
          user,
          accessToken,
          refreshToken,
          expiresAt
        })
      },
      
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          googleCalendarEnabled: false,
          googleGmailEnabled: false,
          googleCalendarId: 'primary'
        })
      },
      
      updateAccessToken: (accessToken, expiresIn) => {
        const expiresAt = Date.now() + expiresIn * 1000
        set({ accessToken, expiresAt })
      },

      setGoogleCalendarEnabled: (enabled) => {
        set({ googleCalendarEnabled: enabled })
      },

      setGoogleGmailEnabled: (enabled) => {
        set({ googleGmailEnabled: enabled })
      },

      setGoogleCalendarId: (calendarId) => {
        set({ googleCalendarId: calendarId })
      }
    }),
    {
      name: 'vetsoft-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        googleCalendarEnabled: state.googleCalendarEnabled,
        googleGmailEnabled: state.googleGmailEnabled,
        googleCalendarId: state.googleCalendarId
      })
    }
  )
)

// Selectors for easy access
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated
export const selectUser = (state: AuthState) => state.user
export const selectAccessToken = (state: AuthState) => state.accessToken
export const selectGoogleCalendarEnabled = (state: AuthState) => state.googleCalendarEnabled
export const selectGoogleGmailEnabled = (state: AuthState) => state.googleGmailEnabled
export const selectGoogleCalendarId = (state: AuthState) => state.googleCalendarId
