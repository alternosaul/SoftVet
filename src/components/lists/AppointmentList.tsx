import React, { useState, useMemo } from 'react'
import { Appointment } from '../../stores/appointmentStore'
import { Pet } from '../../stores/petStore'
import { Client } from '../../stores/clientStore'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'

export interface AppointmentListProps {
  appointments: Appointment[]
  pets: Pet[]
  clients: Client[]
  onAppointmentClick?: (appointment: Appointment) => void
  onAddAppointment?: () => void
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  pets,
  clients,
  onAppointmentClick,
  onAddAppointment
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'time'>('date')

  const getPetById = (petId: number) => pets.find(p => p.id === petId)
  const getClientById = (clientId: number) => clients.find(c => c.id === clientId)

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no-show', label: 'No Show' }
  ]

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'grooming', label: 'Grooming' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'follow-up', label: 'Follow-up' }
  ]

  const filteredAppointments = useMemo(() => {
    let result = [...appointments]
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(apt => {
        const pet = getPetById(apt.petId)
        const client = getClientById(apt.clientId)
        return (
          pet?.name.toLowerCase().includes(query) ||
          client?.firstName.toLowerCase().includes(query) ||
          client?.lastName.toLowerCase().includes(query) ||
          apt.notes?.toLowerCase().includes(query) ||
          apt.veterinarian?.toLowerCase().includes(query)
        )
      })
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(apt => apt.status === statusFilter)
    }
    
    // Filter by type
    if (typeFilter !== 'all') {
      result = result.filter(apt => apt.type === typeFilter)
    }
    
    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return a.time.localeCompare(b.time)
      }
      return a.time.localeCompare(b.time)
    })
    
    return result
  }, [appointments, searchQuery, statusFilter, typeFilter, sortBy, pets, clients])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  const statusColors: Record<Appointment['status'], string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    'in-progress': 'bg-yellow-100 text-yellow-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
    'no-show': 'bg-orange-100 text-orange-700'
  }

  const typeLabels: Record<Appointment['type'], string> = {
    consultation: 'Consultation',
    vaccination: 'Vaccination',
    surgery: 'Surgery',
    grooming: 'Grooming',
    emergency: 'Emergency',
    'follow-up': 'Follow-up'
  }

  const statusLabels: Record<Appointment['status'], string> = {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    'in-progress': 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    'no-show': 'No Show'
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search appointments..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={statusOptions}
            className="w-36"
          />
          
          <Select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            options={typeOptions}
            className="w-36"
          />
          
          <Button
            variant={sortBy === 'date' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSortBy('date')}
          >
            By Date
          </Button>
          
          {onAddAppointment && (
            <Button variant="primary" size="sm" onClick={onAddAppointment}>
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Appointment
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        Showing {filteredAppointments.length} of {appointments.length} appointments
      </p>

      {/* Appointment list */}
      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <Card className="text-center py-8">
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
            <p className="text-gray-500">No appointments found</p>
          </Card>
        ) : (
          filteredAppointments.map(appointment => {
            const pet = getPetById(appointment.petId)
            const client = getClientById(appointment.clientId)
            
            return (
              <Card
                key={appointment.id}
                hover
                onClick={() => onAppointmentClick?.(appointment)}
                className={`
                  cursor-pointer transition-all
                  ${appointment.status === 'cancelled' ? 'opacity-60' : ''}
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Date badge */}
                  <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg px-3 py-2 min-w-[70px]">
                    <span className="text-xs text-gray-500 uppercase">
                      {new Date(appointment.date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      {new Date(appointment.date).getDate()}
                    </span>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">
                        {pet?.name || 'Unknown Pet'}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[appointment.type]}`}>
                        {typeLabels[appointment.type]}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[appointment.status]}`}>
                        {statusLabels[appointment.status]}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-1">
                      {client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'}
                      {client && <span className="text-gray-400"> • {client.phone}</span>}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(appointment.time)}
                      </span>
                      <span>{appointment.duration} min</span>
                      {appointment.veterinarian && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {appointment.veterinarian}
                        </span>
                      )}
                    </div>
                    
                    {appointment.notes && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                        {appointment.notes}
                      </p>
                    )}
                  </div>
                  
                  {/* Arrow */}
                  <svg 
                    className="w-5 h-5 text-gray-300 flex-shrink-0" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AppointmentList
