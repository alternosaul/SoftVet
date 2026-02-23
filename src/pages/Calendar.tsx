import { useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useAppointmentStore } from '../stores/appointmentStore'

export default function Calendar() {
  const { appointments } = useAppointmentStore()

  // Map appointments to FullCalendar event format
  const events = useMemo(() => {
    return appointments.map((apt) => {
      const start = new Date(`${apt.date}T${apt.time}`)
      const end = new Date(start.getTime() + (apt.duration || 30) * 60 * 1000)
      return {
        id: String(apt.id),
        title: `${apt.type} - ${apt.veterinarian}`,
        start: start.toISOString(),
        end: end.toISOString(),
        extendedProps: { status: apt.status }
      }
    })
  }, [appointments])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
        <p className="text-gray-500">View and manage your schedule</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          height="auto"
        />
      </div>
    </div>
  )
}
