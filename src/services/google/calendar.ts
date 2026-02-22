import { getAccessToken } from './oauth'
import { useAuthStore } from '../../stores/authStore'
import { Appointment } from '../../stores/appointmentStore'
import { Client } from '../../stores/clientStore'
import { Pet } from '../../stores/petStore'

// Google Calendar API base URL
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted'
  }>
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
  colorId?: string
  status?: 'confirmed' | 'tentative' | 'cancelled'
  htmlLink?: string
  created?: string
  updated?: string
}

export interface CalendarListEntry {
  id: string
  summary: string
  description?: string
  primary?: boolean
  backgroundColor?: string
}

export interface GoogleCalendarError {
  error: {
    code: number
    message: string
    errors: Array<{
      domain: string
      reason: string
      message: string
    }>
  }
}

/**
 * Get the access token for API calls
 */
const getCalendarAccessToken = async (): Promise<string> => {
  return getAccessToken()
}

/**
 * List all calendars for the user
 */
export const listCalendars = async (): Promise<CalendarListEntry[]> => {
  const accessToken = await getCalendarAccessToken()
  
  const response = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    const error: GoogleCalendarError = await response.json()
    throw new Error(error.error.message || 'Failed to fetch calendars')
  }

  const data = await response.json()
  return data.items || []
}

/**
 * Get the primary calendar or a specific calendar
 */
export const getPrimaryCalendar = async (): Promise<CalendarListEntry> => {
  const accessToken = await getCalendarAccessToken()
  
  const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    const error: GoogleCalendarError = await response.json()
    throw new Error(error.error.message || 'Failed to fetch primary calendar')
  }

  return response.json()
}

/**
 * Create a Google Calendar event from an appointment
 */
export const createCalendarEvent = async (
  appointment: Appointment,
  client: Client,
  pet: Pet,
  calendarId: string = 'primary'
): Promise<CalendarEvent> => {
  const accessToken = await getCalendarAccessToken()

  // Format the appointment date and time
  const startDateTime = new Date(`${appointment.date}T${appointment.time}`)
  const endDateTime = new Date(startDateTime.getTime() + appointment.duration * 60 * 1000)

  // Build the event description with appointment details
  const description = buildEventDescription(appointment, client, pet)

  // Map appointment type to color
  const colorMap: Record<string, string> = {
    'consultation': '1',  // Lavender
    'vaccination': '2',   // Grape
    'surgery': '7',       // Tomato
    'grooming': '9',      // Cornflower
    'emergency': '11',    // Cinnamon
    'follow-up': '5'      // Mint
  }

  const event: CalendarEvent = {
    summary: `${getAppointmentTypeLabel(appointment.type)} - ${pet.name}`,
    description,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    attendees: [
      {
        email: client.email,
        displayName: `${client.firstName} ${client.lastName}`,
        responseStatus: 'needsAction'
      }
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours before
        { method: 'popup', minutes: 60 }       // 1 hour before
      ]
    },
    colorId: colorMap[appointment.type] || '1'
  }

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }
  )

  if (!response.ok) {
    const error: GoogleCalendarError = await response.json()
    throw new Error(error.error.message || 'Failed to create calendar event')
  }

  return response.json()
}

/**
 * Update an existing calendar event
 */
export const updateCalendarEvent = async (
  eventId: string,
  appointment: Appointment,
  client: Client,
  pet: Pet,
  calendarId: string = 'primary'
): Promise<CalendarEvent> => {
  const accessToken = await getCalendarAccessToken()

  const startDateTime = new Date(`${appointment.date}T${appointment.time}`)
  const endDateTime = new Date(startDateTime.getTime() + appointment.duration * 60 * 1000)

  const description = buildEventDescription(appointment, client, pet)

  const colorMap: Record<string, string> = {
    'consultation': '1',
    'vaccination': '2',
    'surgery': '7',
    'grooming': '9',
    'emergency': '11',
    'follow-up': '5'
  }

  const event: Partial<CalendarEvent> = {
    summary: `${getAppointmentTypeLabel(appointment.type)} - ${pet.name}`,
    description,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 60 }
      ]
    },
    colorId: colorMap[appointment.type] || '1'
  }

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events/${eventId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }
  )

  if (!response.ok) {
    const error: GoogleCalendarError = await response.json()
    throw new Error(error.error.message || 'Failed to update calendar event')
  }

  return response.json()
}

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (
  eventId: string,
  calendarId: string = 'primary'
): Promise<void> => {
  const accessToken = await getCalendarAccessToken()

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok && response.status !== 404) {
    const error: GoogleCalendarError = await response.json()
    throw new Error(error.error.message || 'Failed to delete calendar event')
  }
}

/**
 * Fetch events for a date range
 */
export const fetchCalendarEvents = async (
  startDate: Date,
  endDate: Date,
  calendarId: string = 'primary'
): Promise<CalendarEvent[]> => {
  const accessToken = await getCalendarAccessToken()

  const params = new URLSearchParams({
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime'
  })

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    const error: GoogleCalendarError = await response.json()
    throw new Error(error.error.message || 'Failed to fetch calendar events')
  }

  const data = await response.json()
  return data.items || []
}

/**
 * Get a single calendar event by ID
 */
export const getCalendarEvent = async (
  eventId: string,
  calendarId: string = 'primary'
): Promise<CalendarEvent> => {
  const accessToken = await getCalendarAccessToken()

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events/${eventId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    const error: GoogleCalendarError = await response.json()
    throw new Error(error.error.message || 'Failed to fetch calendar event')
  }

  return response.json()
}

/**
 * Build a descriptive text for the calendar event
 */
const buildEventDescription = (
  appointment: Appointment,
  client: Client,
  pet: Pet
): string => {
  const lines = [
    '📅 Cita Veterinaria - VetSoft',
    '',
    '--- Detalles de la Mascota ---',
    `Nombre: ${pet.name}`,
    `Especie: ${getSpeciesLabel(pet.species)}`,
    `Raza: ${pet.breed || 'No especificada'}`,
    '',
    '--- Dueño ---',
    `Nombre: ${client.firstName} ${client.lastName}`,
    `Teléfono: ${client.phone}`,
    `Email: ${client.email}`,
    ''
  ]

  if (appointment.notes) {
    lines.push('--- Notas ---')
    lines.push(appointment.notes)
    lines.push('')
  }

  lines.push('--- Información de la Cita ---')
  lines.push(`Tipo: ${getAppointmentTypeLabel(appointment.type)}`)
  lines.push(`Duración: ${appointment.duration} minutos`)
  lines.push(`Veterinario: ${appointment.veterinarian}`)
  lines.push('')
  lines.push('ℹ️ Esta cita fue programada desde VetSoft - Sistema de Gestión Veterinaria')

  return lines.join('\n')
}

/**
 * Get a human-readable label for appointment types
 */
const getAppointmentTypeLabel = (type: Appointment['type']): string => {
  const labels: Record<Appointment['type'], string> = {
    'consultation': 'Consulta',
    'vaccination': 'Vacunación',
    'surgery': 'Cirugía',
    'grooming': 'Estética',
    'emergency': 'Emergencia',
    'follow-up': 'Seguimiento'
  }
  return labels[type] || type
}

/**
 * Get a human-readable label for species
 */
const getSpeciesLabel = (species: Pet['species']): string => {
  const labels: Record<Pet['species'], string> = {
    'dog': 'Perro',
    'cat': 'Gato',
    'bird': 'Ave',
    'rabbit': 'Conejo',
    'hamster': 'Hámster',
    'fish': 'Pez',
    'reptile': 'Reptil',
    'other': 'Otro'
  }
  return labels[species] || species
}

/**
 * Check if Google Calendar integration is available
 */
export const isCalendarAvailable = async (): Promise<boolean> => {
  try {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) return false
    
    await getPrimaryCalendar()
    return true
  } catch {
    return false
  }
}
