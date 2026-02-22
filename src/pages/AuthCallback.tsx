import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const error = searchParams.get('error')

      if (error) {
        console.error('Auth error:', error)
        navigate('/login')
        return
      }

      if (code) {
        try {
          // In a production app, you would exchange the code for tokens
          // by calling your backend API. For now, we'll simulate this.
          const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              code,
              client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
              client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
              redirect_uri: `${window.location.origin}/auth/callback`,
              grant_type: 'authorization_code'
            })
          })

          if (response.ok) {
            const tokens = await response.json()
            
            // Get user info
            const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`
              }
            })

            if (userResponse.ok) {
              const userInfo = await userResponse.json()
              
              setAuth(
                {
                  id: userInfo.id,
                  email: userInfo.email,
                  name: userInfo.name,
                  picture: userInfo.picture
                },
                tokens.access_token,
                tokens.refresh_token,
                tokens.expires_in
              )

              navigate('/dashboard')
            }
          } else {
            console.error('Token exchange failed')
            navigate('/login')
          }
        } catch (err) {
          console.error('Auth callback error:', err)
          navigate('/login')
        }
      }
    }

    handleCallback()
  }, [searchParams, navigate, setAuth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  )
}
