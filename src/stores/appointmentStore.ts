import { create } from 'zustand'
import { Client } from './clientStore'
import { Pet } from './petStore'
import { useAuthStore } from './authStore'
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvents,
  isCalendarAvailable
} from '../services/google/calendar'
import {
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendAppointmentCancellation,
  sendAppointmentRescheduled
} from '../services/google/gmail'
import { handleGoogleError } from '../services/google'
import {
  getAllAppointments,
  getAppointmentsByDate,
  getAppointmentsByDateRange,
  getAppointmentsByClientId,
  getAppointmentsByPetId,
  getUpcomingAppointments,
  addAppointment as dbAddAppointment,
  updateAppointment as dbUpdateAppointment,
  deleteAppointment as dbDeleteAppointment
} from '../db'
import { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from '../db/types'

interface AppointmentState {
  appointments: Appointment[]
  selectedAppointment: Appointment | null
  isLoading: boolean
  error: string | null
  // Google Calendar sync status
  calendarSyncEnabled: boolean
  emailNotificationsEnabled: boolean
  lastSyncTime: string | null
  // Actions
  fetchAppointments: () => Promise<void>
  fetchAppointmentsByDate: (date: string) => Promise<void>
  fetchAppointmentsByDateRange: (startDate: string, endDate: string) => Promise<void>
  fetchAppointmentsByClient: (clientId: number) => Promise<void>
  fetchAppointmentsByPet: (petId: number) => Promise<void>
  fetchUpcomingAppointments: (limit?: number) => Promise<void>
  addAppointment: (appointment: CreateAppointmentInput, client: Client, pet: Pet) => Promise<number>
  updateAppointment: (id: number, updates: UpdateAppointmentInput, client?: Client, pet?: Pet) => Promise<void>
  deleteAppointment: (id: number, client?: Client, pet?: Pet) => Promise<void>
  setSelectedAppointment: (appointment: Appointment | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setCalendarSyncEnabled: (enabled: boolean) => void
  setEmailNotificationsEnabled: (enabled: boolean) => void
  syncWithGoogleCalendar: (startDate: Date, endDate: Date) => Promise<void>
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
  selectedAppointment: null,
  isLoading: false,
  error: null,
  calendarSyncEnabled: false,
  emailNotificationsEnabled: false,
  lastSyncTime: null,
  
  fetchAppointments: async () => {
    set({ isLoading: true, error: null })
    try {
      const appointments = await getAllAppointments()
      set({ appointments, isLoading: false })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch appointments'
      console.error('Failed to fetch appointments:', error)
      set({ error: msg, isLoading: false })
    }
  },
  
  fetchAppointmentsByDate: async (date: string) => {
    set({ isLoading: true, error: null })
    try {
      const appointments = await getAppointmentsByDate(date)
      set({ appointments, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      set({ error: 'Failed to fetch appointments', isLoading: false })
    }
  },
  
  fetchAppointmentsByDateRange: async (startDate: string, endDate: string) => {
    set({ isLoading: true, error: null })
    try {
      const appointments = await getAppointmentsByDateRange(startDate, endDate)
      set({ appointments, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      set({ error: 'Failed to fetch appointments', isLoading: false })
    }
  },
  
  fetchAppointmentsByClient: async (clientId: number) => {
    set({ isLoading: true, error: null })
    try {
      const appointments = await getAppointmentsByClientId(clientId)
      set({ appointments, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      set({ error: 'Failed to fetch appointments', isLoading: false })
    }
  },
  
  fetchAppointmentsByPet: async (petId: number) => {
    set({ isLoading: true, error: null })
    try {
      const appointments = await getAppointmentsByPetId(petId)
      set({ appointments, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      set({ error: 'Failed to fetch appointments', isLoading: false })
    }
  },
  
  fetchUpcomingAppointments: async (limit: number = 10) => {
    set({ isLoading: true, error: null })
    try {
      const appointments = await getUpcomingAppointments(limit)
      set({ appointments, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      set({ error: 'Failed to fetch appointments', isLoading: false })
    }
  },
  
  addAppointment: async (appointmentData: CreateAppointmentInput, client: Client, pet: Pet) => {
    const { calendarSyncEnabled, emailNotificationsEnabled } = get()
    
    set({ isLoading: true, error: null })
    
    try {
      let googleCalendarEventId: string | undefined
      let emailSent = false
      
      // Create Google Calendar event if enabled
      if (calendarSyncEnabled) {
        try {
          const calendarId = useAuthStore.getState().googleCalendarId
          const event = await createCalendarEvent(
            {
              ...appointmentData,
              clientId: client.id!,
              petId: pet.id!
            } as unknown as Appointment,
            client,
            pet,
            calendarId
          )
          googleCalendarEventId = event.id
          console.log('Google Calendar event created:', event.id)
        } catch (error) {
          const googleError = handleGoogleError(error, 'calendar')
          console.error('Failed to create calendar event:', googleError)
          // Continue without calendar sync - don't fail the whole operation
        }
      }
      
      // Send confirmation email if enabled
      if (emailNotificationsEnabled) {
        try {
          await sendAppointmentConfirmation({
            appointment: {
              ...appointmentData,
              clientId: client.id!,
              petId: pet.id!
            } as unknown as Appointment,
            client,
            pet
          })
          emailSent = true
          console.log('Confirmation email sent')
        } catch (error) {
          const googleError = handleGoogleError(error, 'gmail')
          console.error('Failed to send confirmation email:', googleError)
          // Continue without email - don't fail the whole operation
        }
      }
      
      // Add the appointment with Google Calendar event ID and email status
      const newAppointment: CreateAppointmentInput = {
        ...appointmentData,
        googleCalendarEventId,
        emailSent
      }
      
      // Save to IndexedDB
      const id = await dbAddAppointment(newAppointment)
      
      // Fetch updated list
      const appointments = await getAllAppointments()
      set({ appointments, isLoading: false })
      
      return id
      
    } catch (error) {
      console.error('Failed to add appointment:', error)
      set({ error: 'Failed to add appointment', isLoading: false })
      throw error
    }
  },
  
  updateAppointment: async (id: number, updates: UpdateAppointmentInput, client?: Client, pet?: Pet) => {
    const { calendarSyncEnabled, emailNotificationsEnabled, appointments } = get()
    
    set({ isLoading: true, error: null })
    
    try {
      const existingAppointment = appointments.find(apt => apt.id === id)
      if (!existingAppointment) {
        throw new Error('Appointment not found')
      }
      
      let googleCalendarEventId = existingAppointment.googleCalendarEventId
      
      // Update Google Calendar event if enabled
      if (calendarSyncEnabled && googleCalendarEventId && client && pet) {
        try {
          const calendarId = useAuthStore.getState().googleCalendarId
          const updatedEvent = await updateCalendarEvent(
            googleCalendarEventId,
            { ...existingAppointment, ...updates } as Appointment,
            client,
            pet,
            calendarId
          )
          console.log('Google Calendar event updated:', updatedEvent.id)
        } catch (error) {
          const googleError = handleGoogleError(error, 'calendar')
          console.error('Failed to update calendar event:', googleError)
        }
      }
      
      // Check if the appointment was rescheduled
      if (emailNotificationsEnabled && client && pet) {
        const wasDateChanged = existingAppointment.date !== updates.date || 
                              existingAppointment.time !== updates.time
        
        if (wasDateChanged) {
          try {
            await sendAppointmentRescheduled({
              appointment: { ...existingAppointment, ...updates } as Appointment,
              client,
              pet
            })
            console.log('Rescheduled email sent')
          } catch (error) {
            const googleError = handleGoogleError(error, 'gmail')
            console.error('Failed to send rescheduled email:', googleError)
          }
        }
      }
      
      // Update in IndexedDB
      await dbUpdateAppointment(id, updates)
      
      // Fetch updated list
      const updatedAppointments = await getAllAppointments()
      set({ appointments: updatedAppointments, isLoading: false })
      
    } catch (error) {
      console.error('Failed to update appointment:', error)
      set({ error: 'Failed to update appointment', isLoading: false })
      throw error
    }
  },
  
  deleteAppointment: async (id: number, client?: Client, pet?: Pet) => {
    const { calendarSyncEnabled, emailNotificationsEnabled, appointments } = get()
    
    set({ isLoading: true, error: null })
    
    try {
      const existingAppointment = appointments.find(apt => apt.id === id)
      if (!existingAppointment) {
        throw new Error('Appointment not found')
      }
      
      // Delete Google Calendar event if it exists
      if (calendarSyncEnabled && existingAppointment.googleCalendarEventId) {
        try {
          const calendarId = useAuthStore.getState().googleCalendarId
          await deleteCalendarEvent(existingAppointment.googleCalendarEventId, calendarId)
          console.log('Google Calendar event deleted')
        } catch (error) {
          const googleError = handleGoogleError(error, 'calendar')
          console.error('Failed to delete calendar event:', googleError)
        }
      }
      
      // Send cancellation email if enabled
      if (emailNotificationsEnabled && client && pet) {
        try {
          await sendAppointmentCancellation({
            appointment: existingAppointment,
            client,
            pet
          })
          console.log('Cancellation email sent')
        } catch (error) {
          const googleError = handleGoogleError(error, 'gmail')
          console.error('Failed to send cancellation email:', googleError)
        }
      }
      
      // Delete from IndexedDB
      await dbDeleteAppointment(id)
      
      // Fetch updated list
      const updatedAppointments = await getAllAppointments()
      set({ appointments: updatedAppointments, isLoading: false })
      
    } catch (error) {
      console.error('Failed to delete appointment:', error)
      set({ error: 'Failed to delete appointment', isLoading: false })
      throw error
    }
  },
  
  setSelectedAppointment: (appointment: Appointment | null) => set({ selectedAppointment: appointment }),
  
  setLoading: (isLoading: boolean) => set({ isLoading }),
  
  setError: (error: string | null) => set({ error }),
  
  setCalendarSyncEnabled: (enabled: boolean) => {
    useAuthStore.getState().setGoogleCalendarEnabled(enabled)
    set({ calendarSyncEnabled: enabled })
  },
  
  setEmailNotificationsEnabled: (enabled: boolean) => {
    useAuthStore.getState().setGoogleGmailEnabled(enabled)
    set({ emailNotificationsEnabled: enabled })
  },
  
  syncWithGoogleCalendar: async (startDate: Date, endDate: Date) => {
    const { calendarSyncEnabled, appointments } = get()
    
    if (!calendarSyncEnabled) {
      console.log('Calendar sync is not enabled')
      return
    }
    
    set({ isLoading: true, error: null })
    
    try {
      const calendarId = useAuthStore.getState().googleCalendarId
      const events = await fetchCalendarEvents(startDate, endDate, calendarId)
      
      // Map Google Calendar events to appointments
      const syncedAppointments = appointments.map(apt => {
        const matchingEvent = events.find(
          event => event.id === apt.googleCalendarEventId
        )
        
        if (matchingEvent) {
          return {
            ...apt,
            updatedAt: new Date().toISOString()
          }
        }
        
        return apt
      })
      
      set({
        appointments: syncedAppointments,
        lastSyncTime: new Date().toISOString(),
        isLoading: false
      })
      
      console.log(`Synced ${events.length} events from Google Calendar`)
      
    } catch (error) {
      const googleError = handleGoogleError(error, 'calendar')
      console.error('Failed to sync with Google Calendar:', googleError)
      set({ error: googleError.message, isLoading: false })
    }
  }
}))

// Export Appointment type for use in other files
export type { Appointment }
