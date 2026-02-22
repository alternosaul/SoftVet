import React from 'react'
import { Appointment } from '../../stores/appointmentStore'
import { Pet } from '../../stores/petStore'
import { Client } from '../../stores/clientStore'

export interface CalendarEventProps {
  appointment: Appointment
  pet?: Pet
  client?: Client
  onClick?: () => void
}

export const CalendarEvent: React.FC<CalendarEventProps> = ({
  appointment,
  pet,
  client,
  onClick
}) => {
  const typeColors: Record<Appointment['type'], string> = {
    consultation: 'bg-blue-500',
    vaccination: 'bg-green-500',
    surgery: 'bg-red-500',
    grooming: 'bg-purple-500',
    emergency: 'bg-orange-500',
    'follow-up': 'bg-teal-500'
  }

  const statusColors: Record<Appointment['status'], string> = {
    scheduled: 'border-l-4 border-blue-400',
    confirmed: 'border-l-4 border-green-400',
    'in-progress': 'border-l-4 border-yellow-400',
    completed: 'border-l-4 border-gray-400',
    cancelled: 'border-l-4 border-red-400 opacity-50',
    'no-show': 'border-l-4 border-orange-400 opacity-50'
  }

  const typeLabels: Record<Appointment['type'], string> = {
    consultation: 'Consultation',
    vaccination: 'Vaccination',
    surgery: 'Surgery',
    grooming: 'Grooming',
    emergency: 'Emergency',
    'follow-up': 'Follow-up'
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  return (
    <div
      onClick={onClick}
      className={`
        p-2 rounded-lg cursor-pointer transition-all duration-200
        hover:shadow-md hover:scale-[1.02]
        ${statusColors[appointment.status]}
        bg-white
      `}
    >
      <div className="flex items-start gap-2">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeColors[appointment.type]}`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="font-medium text-sm text-gray-900 truncate">
              {pet?.name || 'Unknown Pet'}
            </p>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatTime(appointment.time)}
            </span>
          </div>
          
          <p className="text-xs text-gray-600 truncate">
            {client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'}
          </p>
          
          <div className="flex items-center gap-2 mt-1">
            <span className={`
              inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
              ${typeColors[appointment.type]} text-white
            `}>
              {typeLabels[appointment.type]}
            </span>
            <span className="text-xs text-gray-400">
              {formatDuration(appointment.duration)}
            </span>
          </div>
          
          {appointment.veterinarian && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {appointment.veterinarian}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Compact version for calendar day cells
export interface CompactCalendarEventProps {
  appointment: Appointment
  pet?: Pet
  onClick?: () => void
}

export const CompactCalendarEvent: React.FC<CompactCalendarEventProps> = ({
  appointment,
  pet,
  onClick
}) => {
  const typeColors: Record<Appointment['type'], string> = {
    consultation: 'bg-blue-500',
    vaccination: 'bg-green-500',
    surgery: 'bg-red-500',
    grooming: 'bg-purple-500',
    emergency: 'bg-orange-500',
    'follow-up': 'bg-teal-500'
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div
      onClick={onClick}
      className={`
        px-2 py-1 rounded text-xs text-white truncate cursor-pointer
        transition-all duration-200 hover:opacity-80
        ${typeColors[appointment.type]}
      `}
      title={`${pet?.name || 'Unknown'} - ${formatTime(appointment.time)}`}
    >
      {formatTime(appointment.time)} {pet?.name || 'Unknown'}
    </div>
  )
}

export default CalendarEvent
