import React from 'react'
import { Appointment } from '../../stores/appointmentStore'
import { Pet } from '../../stores/petStore'
import { Client } from '../../stores/clientStore'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'

export interface UpcomingAppointmentsProps {
  appointments: Appointment[]
  pets: Pet[]
  clients: Client[]
  limit?: number
  onAppointmentClick?: (appointment: Appointment) => void
  onViewAll?: () => void
}

export const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  appointments,
  pets,
  clients,
  limit = 5,
  onAppointmentClick,
  onViewAll
}) => {
  const getPetById = (petId: string) => pets.find(p => p.id === petId)
  const getClientById = (clientId: string) => clients.find(c => c.id === clientId)

  // Filter upcoming appointments and sort by date/time
  const today = new Date().toISOString().split('T')[0]
  const upcomingAppointments = appointments
    .filter(apt => apt.date >= today && apt.status !== 'cancelled')
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.time.localeCompare(b.time)
    })
    .slice(0, limit)

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Today'
    } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
      return 'Tomorrow'
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const typeColors: Record<Appointment['type'], string> = {
    consultation: 'bg-blue-100 text-blue-700',
    vaccination: 'bg-green-100 text-green-700',
    surgery: 'bg-red-100 text-red-700',
    grooming: 'bg-purple-100 text-purple-700',
    emergency: 'bg-orange-100 text-orange-700',
    'follow-up': 'bg-teal-100 text-teal-700'
  }

  const typeLabels: Record<Appointment['type'], string> = {
    consultation: 'Consultation',
    vaccination: 'Vaccination',
    surgery: 'Surgery',
    grooming: 'Grooming',
    emergency: 'Emergency',
    'follow-up': 'Follow-up'
  }

  return (
    <Card padding="none">
      <CardHeader className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle>Upcoming Appointments</CardTitle>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      
      <div className="divide-y divide-gray-100">
        {upcomingAppointments.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <svg 
              className="w-12 h-12 mx-auto text-gray-300 mb-3" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <p className="text-gray-500">No upcoming appointments</p>
          </div>
        ) : (
          upcomingAppointments.map((appointment) => {
            const pet = getPetById(appointment.petId)
            const client = getClientById(appointment.clientId)
            
            return (
              <div
                key={appointment.id}
                onClick={() => onAppointmentClick?.(appointment)}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {pet?.name || 'Unknown Pet'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[appointment.type]}`}>
                        {typeLabels[appointment.type]}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-500 truncate">
                      {client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'}
                    </p>
                    
                    {appointment.notes && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {appointment.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(appointment.date)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatTime(appointment.time)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {appointment.duration} min
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}

export default UpcomingAppointments
