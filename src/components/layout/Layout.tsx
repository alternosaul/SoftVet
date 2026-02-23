import { ReactNode, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { useClientStore } from '../../stores/clientStore'
import { usePetStore } from '../../stores/petStore'
import { useAppointmentStore } from '../../stores/appointmentStore'
import { useInventoryStore } from '../../stores/inventoryStore'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { sidebarOpen } = useUIStore()
  const { user } = useAuthStore()
  const { fetchClients, error: clientError } = useClientStore()
  const { fetchPets, error: petError } = usePetStore()
  const { fetchAppointments, error: appointmentError } = useAppointmentStore()
  const { fetchItems, error: inventoryError } = useInventoryStore()

  const dataError = clientError || petError || appointmentError || inventoryError

  // Load data when user is authenticated (ensures session is ready before fetch)
  useEffect(() => {
    if (!user?.id) return
    fetchClients()
    fetchPets()
    fetchAppointments()
    fetchItems()
  }, [user?.id, fetchClients, fetchPets, fetchAppointments, fetchItems])

  // Retry all data fetches when user clicks retry
  const handleRetryData = () => {
    useClientStore.getState().setError(null)
    usePetStore.getState().setError(null)
    useAppointmentStore.getState().setError(null)
    useInventoryStore.getState().setError(null)
    fetchClients()
    fetchPets()
    fetchAppointments()
    fetchItems()
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header />
        {dataError && (
          <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center justify-between gap-4 flex-wrap">
            <div>
              <strong>Error de datos:</strong> {dataError}
              <span className="ml-2 text-red-600 dark:text-red-400 block mt-1">
                Si el proyecto Supabase está pausado (plan gratuito), restáuralo en el Dashboard. Si la sesión expiró, cierra sesión y vuelve a entrar. Datos con otro user_id: Ajustes → Datos.
              </span>
            </div>
            <button
              onClick={handleRetryData}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium shrink-0"
            >
              Reintentar
            </button>
          </div>
        )}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
