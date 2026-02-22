import React, { useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Appointment } from '../../stores/appointmentStore'
import { Pet } from '../../stores/petStore'
import { Client } from '../../stores/clientStore'
import { CalendarEvent } from './CalendarEvent'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

export interface AppointmentCalendarProps {
  appointments: Appointment[]
  pets: Pet[]
  clients: Client[]
  onDateSelect?: (start: Date, end: Date) => void
  onEventClick?: (appointment: Appointment) => void
  onEventDrop?: (appointment: Appointment, newStart: Date, newEnd: Date) => void
  onAppointmentCreate?: (date: string, time: string) => void
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  pets,
  clients,
  onDateSelect,
  onEventClick,
  onEventDrop,
  onAppointmentCreate
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showModal, setShowModal] = useState(false)

  const getPetById = (petId: string) => pets.find(p => p.id === petId)
  const getClientById = (clientId: string) => clients.find(c => c.id === clientId)

  const events = useMemo(() => {
    return appointments.map(apt => {
      const pet = getPetById(apt.petId)
      return {
        id: apt.id,
        title: pet?.name || 'Unknown Pet',
        start: `${apt.date}T${apt.time}`,
        end: calculateEndTime(apt.date, apt.time, apt.duration),
        backgroundColor: getEventColor(apt.type),
        borderColor: getEventColor(apt.type),
        extendedProps: {
          appointment: apt,
          pet,
          client: getClientById(apt.clientId)
        }
      }
    })
  }, [appointments, pets, clients])

  const calculateEndTime = (date: string, time: string, duration: number) => {
    const [hours, minutes] = time.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + duration
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${date}T${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }

  const getEventColor = (type: Appointment['type']) => {
    const colors: Record<Appointment['type'], string> = {
      consultation: '#3B82F6',
      vaccination: '#22C55E',
      surgery: '#EF4444',
      grooming: '#A855F7',
      emergency: '#F97316',
      'follow-up': '#0D9488'
    }
    return colors[type]
  }

  const handleDateSelect = (selectInfo: any) => {
    const start = selectInfo.start
    const end = selectInfo.end
    
    if (onDateSelect) {
      onDateSelect(start, end)
    } else {
      // Default behavior - open create modal
      const dateStr = start.toISOString().split('T')[0]
      const timeStr = start.toTimeString().slice(0, 5)
      onAppointmentCreate?.(dateStr, timeStr)
    }
  }

  const handleEventClick = (clickInfo: any) => {
    const appointment = clickInfo.event.extendedProps.appointment as Appointment
    setSelectedAppointment(appointment)
    setShowModal(true)
    
    if (onEventClick) {
      onEventClick(appointment)
    }
  }

  const handleEventDrop = (info: any) => {
    const appointment = info.event.extendedProps.appointment as Appointment
    const newStart = info.event.start
    const newEnd = info.event.end
    
    if (onEventDrop) {
      onEventDrop(appointment, newStart, newEnd)
    }
  }

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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={3}
        weekends={true}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        allDaySlot={false}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        height="auto"
        eventContent={(eventInfo) => {
          const apt = eventInfo.event.extendedProps.appointment as Appointment
          const pet = eventInfo.event.extendedProps.pet as Pet
          return (
            <CalendarEvent
              appointment={apt}
              pet={pet}
            />
          )
        }}
        eventClassNames={(eventInfo) => {
          const apt = eventInfo.event.extendedProps.appointment as Appointment
          if (apt.status === 'cancelled' || apt.status === 'no-show') {
            return ['opacity-50']
          }
          return []
        }}
        dayHeaderClassNames="text-gray-600 font-medium text-sm"
        titleFormat={{ year: 'numeric', month: 'long', day: 'numeric' }}
        nowIndicatorClassName="bg-vet-teal"
        eventInteractive={true}
      />

      {/* Appointment Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Appointment Details"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{formatDate(selectedAppointment.date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">{formatTime(selectedAppointment.time)}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Service Type</p>
              <p className="font-medium">{typeLabels[selectedAppointment.type]}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Pet</p>
              <p className="font-medium">
                {getPetById(selectedAppointment.petId)?.name || 'Unknown'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Owner</p>
              <p className="font-medium">
                {getClientById(selectedAppointment.clientId)
                  ? `${getClientById(selectedAppointment.clientId)?.firstName} ${getClientById(selectedAppointment.clientId)?.lastName}`
                  : 'Unknown'}
              </p>
            </div>
            
            {selectedAppointment.veterinarian && (
              <div>
                <p className="text-sm text-gray-500">Veterinarian</p>
                <p className="font-medium">{selectedAppointment.veterinarian}</p>
              </div>
            )}
            
            {selectedAppointment.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-gray-700">{selectedAppointment.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AppointmentCalendar
