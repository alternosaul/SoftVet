import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Appointments from './pages/Appointments'
import Calendar from './pages/Calendar'
import Clients from './pages/Clients'
import Pets from './pages/Pets'
import Settings from './pages/Settings'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'

// Protected route wrapper - shows loading while checking auth
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  const [showFallback, setShowFallback] = useState(false)
  const navigate = useNavigate()

  // If stuck loading > 10s, show "Continue to login" (Supabase unreachable or env issue)
  useEffect(() => {
    if (!isLoading) {
      setShowFallback(false)
      return
    }
    const t = setTimeout(() => setShowFallback(true), 10000)
    return () => clearTimeout(t)
  }, [isLoading])

  const goToLogin = () => {
    useAuthStore.setState({ isLoading: false, isAuthenticated: false, user: null })
    navigate('/login', { replace: true })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
          {showFallback && (
            <button
              type="button"
              onClick={goToLogin}
              className="mt-4 text-sm text-teal-600 hover:underline"
            >
              Taking too long? Continue to login
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/pets" element={<Pets />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
