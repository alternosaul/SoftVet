import { useAuthStore } from '../../stores/authStore'

// Google OAuth 2.0 configuration
// These should be set in environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`

// Google OAuth scopes
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send'
].join(' ')

export interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

export interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture: string
}

export interface GoogleAuthError {
  error: string
  error_description?: string
}

/**
 * Generate the Google OAuth URL for the authorization flow
 */
export const getGoogleAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    access_type: 'offline', // Request refresh token
    prompt: 'consent' // Force consent to get refresh token
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export const exchangeCodeForToken = async (code: string): Promise<GoogleTokenResponse> => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  })

  if (!response.ok) {
    const error: GoogleAuthError = await response.json()
    throw new Error(error.error_description || 'Failed to exchange code for token')
  }

  return response.json()
}

/**
 * Refresh the access token using the refresh token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<GoogleTokenResponse> => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
      grant_type: 'refresh_token'
    })
  })

  if (!response.ok) {
    const error: GoogleAuthError = await response.json()
    throw new Error(error.error_description || 'Failed to refresh access token')
  }

  return response.json()
}

/**
 * Fetch user info from Google
 */
export const fetchGoogleUserInfo = async (accessToken: string): Promise<GoogleUserInfo> => {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user info')
  }

  return response.json()
}

/**
 * Check if the access token is expired or about to expire
 */
export const isTokenExpired = (expiresAt: number | null): boolean => {
  if (!expiresAt) return true
  // Consider token expired 5 minutes before actual expiry
  return Date.now() >= expiresAt - 5 * 60 * 1000
}

/**
 * Initialize the authentication process with Google
 */
export const initGoogleAuth = (): void => {
  const authUrl = getGoogleAuthUrl()
  // Open in a popup or redirect
  window.location.href = authUrl
}

/**
 * Handle the OAuth callback and set up authentication
 */
export const handleOAuthCallback = async (code: string): Promise<void> => {
  try {
    const tokenResponse = await exchangeCodeForToken(code)
    const userInfo = await fetchGoogleUserInfo(tokenResponse.access_token)

    // Store authentication in the auth store
    const { setAuth } = useAuthStore.getState()
    
    setAuth(
      {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      },
      tokenResponse.access_token,
      tokenResponse.refresh_token || '',
      tokenResponse.expires_in
    )
  } catch (error) {
    console.error('OAuth callback error:', error)
    throw error
  }
}

/**
 * Logout from Google and clear local tokens
 */
export const logoutGoogle = async (): Promise<void> => {
  const { logout, accessToken } = useAuthStore.getState()
  
  // Revoke Google access token if available
  if (accessToken) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Error revoking Google token:', error)
    }
  }
  
  // Clear local authentication
  logout()
}

/**
 * Ensure we have a valid access token, refreshing if necessary
 */
export const ensureValidToken = async (): Promise<string> => {
  const { accessToken, refreshToken, expiresAt, updateAccessToken } = useAuthStore.getState()
  
  if (!accessToken || !refreshToken) {
    throw new Error('No authentication tokens available')
  }
  
  if (isTokenExpired(expiresAt)) {
    // Token is expired, refresh it
    const newTokenResponse = await refreshAccessToken(refreshToken)
    updateAccessToken(newTokenResponse.access_token, newTokenResponse.expires_in)
    return newTokenResponse.access_token
  }
  
  return accessToken
}

/**
 * Get the current access token, ensuring it's valid
 */
export const getAccessToken = async (): Promise<string> => {
  return ensureValidToken()
}

/**
 * Check if Google OAuth is properly configured
 */
export const isGoogleOAuthConfigured = (): boolean => {
  return !!GOOGLE_CLIENT_ID
}
