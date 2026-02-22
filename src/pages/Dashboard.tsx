import { CalendarDays, Users, PawPrint, TrendingUp } from 'lucide-react'
import { useAppointmentStore } from '../stores/appointmentStore'
import { useClientStore } from '../stores/clientStore'
import { usePetStore } from '../stores/petStore'

export default function Dashboard() {
  const { appointments } = useAppointmentStore()
  const { clients } = useClientStore()
  const { pets } = usePetStore()

  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(apt => apt.date === today)

  const stats = [
    { 
      label: 'Today\'s Appointments', 
      value: todayAppointments.length, 
      icon: CalendarDays,
      color: 'bg-blue-500'
    },
    { 
      label: 'Total Clients', 
      value: clients.length, 
      icon: Users,
      color: 'bg-teal-500'
    },
    { 
      label: 'Total Pets', 
      value: pets.length, 
      icon: PawPrint,
      color: 'bg-orange-500'
    },
    { 
      label: 'This Month', 
      value: appointments.filter(apt => apt.date.startsWith(today.substring(0, 7))).length,
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's your clinic overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Today's Appointments</h2>
        {todayAppointments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No appointments scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {todayAppointments.slice(0, 5).map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{apt.time}</p>
                    <p className="text-sm text-gray-500">{apt.type}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
