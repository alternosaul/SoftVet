import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  PawPrint, 
  Settings,
  CalendarDays,
  Menu,
  Package,
  BarChart3
} from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/appointments', label: 'Appointments', icon: CalendarDays },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/pets', label: 'Pets', icon: PawPrint },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/reports', label: 'Reportes', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800 dark:text-gray-100">VetSoft</span>
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
