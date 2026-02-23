// OAuth callback handler - Supabase redirects here after Google sign-in
// Processes the auth session and redirects to dashboard

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase parses OAuth tokens from URL hash - may need a brief moment to process
        let session = null
        let error = null
        for (let attempt = 0; attempt < 3; attempt++) {
          const result = await supabase.auth.getSession()
          session = result.data?.session ?? null
          error = result.error ?? null
          if (session?.user) break
          await new Promise(r => setTimeout(r, 300))
        }

        if (error) {
          console.error('Auth callback error:', error)
          navigate('/login')
          return
        }

        if (session?.user) {
          const user = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email || 'User',
            picture: session.user.user_metadata?.avatar_url
          }
          setAuth(user)
          navigate('/dashboard')
        } else {
          navigate('/login')
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        navigate('/login')
      }
    }

    handleCallback()
  }, [navigate, setAuth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  )
}
