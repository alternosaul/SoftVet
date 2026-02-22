// Google OAuth Service
export * from './oauth'

// Google Calendar Service
export * from './calendar'

// Google Gmail Service
export * from './gmail'

// Centralized error handling
import { useAuthStore } from '../../stores/authStore'
import { isGoogleOAuthConfigured } from './oauth'
import { isCalendarAvailable } from './calendar'
import { isGmailAvailable } from './gmail'

export interface GoogleServiceError {
  service: 'oauth' | 'calendar' | 'gmail'
  message: string
  code?: string
  status?: number
}

/**
 * Handle Google API errors with centralized error handling
 */
export const handleGoogleError = (error: unknown, service: GoogleServiceError['service']): GoogleServiceError => {
  let message = 'An unknown error occurred'
  let code: string | undefined
  let status: number | undefined

  if (error instanceof Error) {
    message = error.message
    
    // Check for specific error patterns
    if (message.includes('401') || message.includes('unauthorized')) {
      code = 'UNAUTHORIZED'
      status = 401
      // Token might be expired, try to refresh
      handleTokenExpiration()
    } else if (message.includes('403') || message.includes('forbidden')) {
      code = 'FORBIDDEN'
      status = 403
    } else if (message.includes('404') || message.includes('not found')) {
      code = 'NOT_FOUND'
      status = 404
    } else if (message.includes('500') || message.includes('server error')) {
      code = 'SERVER_ERROR'
      status = 500
    }
  }

  const googleError: GoogleServiceError = {
    service,
    message,
    code,
    status
  }

  // Log the error for debugging
  console.error(`[Google ${service.toUpperCase()} Error]:`, googleError)

  return googleError
}

/**
 * Handle token expiration by attempting to refresh
 */
const handleTokenExpiration = async (): Promise<void> => {
  const { refreshToken, logout } = useAuthStore.getState()
  
  if (!refreshToken) {
    // No refresh token, must log out
    console.warn('No refresh token available, logging out')
    logout()
    return
  }

  try {
    // Import dynamically to avoid circular dependency
    const oauthModule = await import('./oauth')
    
    const tokenResponse = await oauthModule.refreshAccessToken(refreshToken)
    const userInfo = await oauthModule.fetchGoogleUserInfo(tokenResponse.access_token)
    
    const { setAuth } = useAuthStore.getState()
    setAuth(
      {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      },
      tokenResponse.access_token,
      refreshToken,
      tokenResponse.expires_in
    )
    
    console.log('Token refreshed successfully')
  } catch (error) {
    console.error('Failed to refresh token:', error)
    logout()
  }
}

/**
 * Check if the user is authenticated with Google
 */
export const isGoogleAuthenticated = (): boolean => {
  const { isAuthenticated, accessToken } = useAuthStore.getState()
  return isAuthenticated && !!accessToken
}

/**
 * Get the current user's Google profile
 */
export const getGoogleProfile = async (): Promise<{
  id: string
  email: string
  name: string
  picture: string
} | null> => {
  const { user } = useAuthStore.getState()
  if (!user) return null
  return {
    id: user.id || '',
    email: user.email || '',
    name: user.name || '',
    picture: user.picture || ''
  }
}

/**
 * Initialize Google services - check configuration
 */
export const initializeGoogleServices = async (): Promise<{
  configured: boolean
  authenticated: boolean
  calendar: boolean
  gmail: boolean
}> => {
  const configured = isGoogleOAuthConfigured()
  const authenticated = isGoogleAuthenticated()
  
  let calendar = false
  let gmail = false
  
  if (authenticated) {
    try {
      calendar = await isCalendarAvailable()
    } catch {
      calendar = false
    }
    
    try {
      gmail = await isGmailAvailable()
    } catch {
      gmail = false
    }
  }
  
  return {
    configured,
    authenticated,
    calendar,
    gmail
  }
}
