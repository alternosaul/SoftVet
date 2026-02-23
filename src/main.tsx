// App entry point - Supabase auth + React

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { useAuthStore } from './stores/authStore'
import { useUIStore } from './stores/uiStore'
import { supabase } from './lib/supabase'
import { initializeDatabase } from './db/hooks'

// Check initial session on app load (fallback if onAuthStateChange doesn't fire)
useAuthStore.getState().checkSession().then(() => {
  // onAuthStateChange(INITIAL_SESSION) will also set auth - avoid double init
  if (useAuthStore.getState().isAuthenticated) {
    initializeDatabase().catch(err => console.error('Database init failed:', err))
  }
})

// Listen for auth state changes (login, logout, session refresh)
// Single source of truth for auth - do NOT set auth from checkSession/getSession (can be stale)
// Handles: SIGNED_IN, INITIAL_SESSION (page load), TOKEN_REFRESHED, SIGNED_OUT
supabase.auth.onAuthStateChange(async (event, session) => {
  const { setAuth, logout } = useAuthStore.getState()

  // Valid session: set auth and clear loading
  if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
    const user = {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.full_name || session.user.email || 'User',
      picture: session.user.user_metadata?.avatar_url
    }
    setAuth(user)
    // Initialize database in background - do NOT await to avoid blocking UI / freezing login
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      initializeDatabase().catch(err => console.error('Database init failed:', err))
    }
  } else if (event === 'SIGNED_OUT') {
    logout()
  } else if (event === 'INITIAL_SESSION' && !session) {
    // No session on load (expired/invalid) - clear auth and loading
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      isLoading: false
    })
  }
})

// Apply theme (dark mode) to document - runs on mount and when theme changes
const applyTheme = () => {
  const theme = useUIStore.getState().theme
  document.documentElement.classList.toggle('dark', theme === 'dark')
}
applyTheme()
useUIStore.subscribe(applyTheme)

// Global error handlers
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, colno, error })
}

window.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
