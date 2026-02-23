import { Bell, Search, LogOut, RefreshCw, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { useClientStore } from '../../stores/clientStore'
import { usePetStore } from '../../stores/petStore'
import { useAppointmentStore } from '../../stores/appointmentStore'
import { useInventoryStore } from '../../stores/inventoryStore'

export default function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useUIStore()
  const { fetchClients } = useClientStore()
  const { fetchPets } = usePetStore()
  const { fetchAppointments } = useAppointmentStore()
  const { fetchItems } = useInventoryStore()

  const handleRefresh = () => {
    fetchClients()
    fetchPets()
    fetchAppointments()
    fetchItems()
  }

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients, pets, appointments..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        {/* Refresh data */}
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          title="Refresh data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-600">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'user@example.com'}</p>
          </div>
          <button 
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
