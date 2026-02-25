// Login page - Email/password and optional Google (Supabase Auth)

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PawPrint, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase, isSupabaseConfigured, getSupabaseDebugInfo } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSupabaseConfigured()) {
      setMessage({ type: 'error', text: 'Supabase no configurado. Revisa .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)' })
      return
    }
    setLoading(true)
    setMessage(null)
    setShowDebug(false)

    // Timeout wrapper - Supabase can hang if unreachable (network/firewall/free tier paused)
    const withTimeout = (promise: Promise<unknown>, ms: number) => {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout. Check your internet and try again.')), ms))
      return Promise.race([promise, timeout])
    }

    try {
      if (isSignUp) {
        const signUpPromise = supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        })
        const { data, error } = (await withTimeout(signUpPromise, 15000)) as Awaited<typeof signUpPromise>
        if (error) throw error
        if (data.session) {
          setAuth({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.full_name || data.user.email || 'User',
            picture: data.user.user_metadata?.avatar_url
          })
          navigate('/dashboard')
        } else {
          setMessage({
            type: 'success',
            text: 'Account created! Check your email to confirm, or sign in now.'
          })
          setIsSignUp(false)
        }
      } else {
        const signInPromise = supabase.auth.signInWithPassword({ email, password })
        const { data, error } = (await withTimeout(signInPromise, 15000)) as Awaited<typeof signInPromise>
        if (error) throw error
        // Set auth state directly from response (don't rely on onAuthStateChange)
        if (data?.session?.user) {
          setAuth({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.full_name || data.user.email || 'User',
            picture: data.user.user_metadata?.avatar_url
          })
          navigate('/dashboard')
        } else {
          throw new Error('No session returned')
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión. Verifica conexión.'
      // Mensajes más claros para errores comunes de Supabase
      let displayMsg = msg
      if (msg.toLowerCase().includes('email not confirmed')) {
        displayMsg = 'Confirma tu email. Revisa tu bandeja de entrada y haz clic en el enlace de verificación.'
      } else if (msg.toLowerCase().includes('invalid login')) {
        displayMsg = 'Email o contraseña incorrectos. Verifica tus credenciales.'
      } else if (msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('credentials')) {
        displayMsg = 'Email o contraseña incorrectos. Verifica tus credenciales.'
      } else if (msg.toLowerCase().includes('invalid') && (msg.toLowerCase().includes('api') || msg.toLowerCase().includes('key'))) {
        displayMsg = 'Invalid API key: revisa Vercel → Settings → Environment Variables. URL y anon key deben coincidir con tu proyecto Supabase.'
        setShowDebug(true)
      } else if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('timeout')) {
        displayMsg = 'Error de conexión. Verifica tu internet. Si usas Supabase free tier, el proyecto puede estar pausado (despiértalo en el dashboard).'
      } else if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('Invalid') || window.location.hostname !== 'localhost') {
        // En producción (Vercel), mostrar debug y hint de URL Configuration
        setShowDebug(true)
      }
      setMessage({
        type: 'error',
        text: displayMsg
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
      if (error) throw error
      // User will be redirected to Google, then back to /auth/callback
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Google sign-in failed'
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-4">
            <PawPrint className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">VetSoft</h1>
          <p className="text-gray-500 mt-2">Veterinary Clinic Management System</p>
        </div>

        {!isSupabaseConfigured() && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            Supabase no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env
          </div>
        )}

        {showDebug && (
          <div className="mb-4 p-4 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 text-xs font-mono">
            <p className="font-semibold mb-2">Debug (env vars):</p>
            <p>URL: {getSupabaseDebugInfo().urlOk ? getSupabaseDebugInfo().urlPrefix : '❌ vacío'}</p>
            <p>Key: {getSupabaseDebugInfo().keyOk ? '✓ presente' : '❌ vacío'}</p>
            {window.location.hostname !== 'localhost' && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="font-semibold text-amber-700">Si funciona en local pero no en Vercel:</p>
                <p className="mt-1">Supabase → Authentication → URL Configuration</p>
                <p>• Site URL: <code className="bg-gray-200 px-1">https://{window.location.hostname}</code></p>
                <p>• Redirect URLs: añade <code className="bg-gray-200 px-1">https://{window.location.hostname}/**</code></p>
              </div>
            )}
          </div>
        )}

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-500 mb-6">
            {isSignUp ? 'Sign up to manage your clinic' : 'Sign in to manage your clinic'}
          </p>

          {/* Message */}
          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {isSignUp && (
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Toggle Sign Up / Sign In */}
          <p className="mt-6 text-center text-sm text-gray-500">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false)
                    setMessage(null)
                  }}
                  className="text-teal-600 hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true)
                    setMessage(null)
                  }}
                  className="text-teal-600 hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl mb-1">📅</div>
            <p className="text-xs text-gray-500">Calendar Sync</p>
          </div>
          <div>
            <div className="text-2xl mb-1">📧</div>
            <p className="text-xs text-gray-500">Email Alerts</p>
          </div>
          <div>
            <div className="text-2xl mb-1">🐾</div>
            <p className="text-xs text-gray-500">Pet Records</p>
          </div>
        </div>
      </div>
    </div>
  )
}
