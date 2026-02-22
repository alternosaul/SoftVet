import { getAccessToken } from './oauth'
import { useAuthStore } from '../../stores/authStore'
import { Appointment } from '../../stores/appointmentStore'
import { Client } from '../../stores/clientStore'
import { Pet } from '../../stores/petStore'

// Gmail API base URL
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1'

export interface GmailMessage {
  id?: string
  threadId?: string
  labelIds?: string[]
  snippet?: string
  historyId?: string
  payload?: {
    headers: Array<{
      name: string
      value: string
    }>
    body?: {
      data?: string
    }
  }
}

export interface GmailError {
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

export interface EmailOptions {
  to: string
  subject: string
  body: string
  cc?: string
  bcc?: string
  replyTo?: string
}

export interface AppointmentEmailData {
  appointment: Appointment
  client: Client
  pet: Pet
  clinicName?: string
  clinicPhone?: string
  clinicAddress?: string
  veterinarianName?: string
}

// Default clinic information - should be configured in settings
const DEFAULT_CLINIC = {
  name: 'VetSoft - Clínica Veterinaria',
  phone: '(55) 1234-5678',
  address: 'Ciudad de México, México',
  email: 'contacto@vetsoft.com'
}

/**
 * Get the access token for API calls
 */
const getGmailAccessToken = async (): Promise<string> => {
  return getAccessToken()
}

/**
 * Create the raw email message
 */
const createRawEmail = (options: EmailOptions): string => {
  const lines = [
    `To: ${options.to}`,
    options.cc ? `Cc: ${options.cc}` : '',
    options.replyTo ? `Reply-To: ${options.replyTo}` : '',
    `Subject: ${options.subject}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    options.body
  ].filter(Boolean)

  // Encode to base64url
  return btoa(encodeURIComponent(lines.join('\n')).replace(/%([0-9A-F]{2})/g, (_, p1) => {
    return String.fromCharCode(parseInt(p1, 16))
  })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Send an email
 */
export const sendEmail = async (options: EmailOptions): Promise<GmailMessage> => {
  const accessToken = await getGmailAccessToken()

  const rawEmail = createRawEmail(options)

  const response = await fetch(
    `${GMAIL_API}/users/me/messages/send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: rawEmail
      })
    }
  )

  if (!response.ok) {
    const error: GmailError = await response.json()
    throw new Error(error.error.message || 'Failed to send email')
  }

  return response.json()
}

/**
 * Send appointment confirmation email
 */
export const sendAppointmentConfirmation = async (
  data: AppointmentEmailData
): Promise<GmailMessage> => {
  const { appointment, client, pet } = data
  const clinic = {
    name: data.clinicName || DEFAULT_CLINIC.name,
    phone: data.clinicPhone || DEFAULT_CLINIC.phone,
    address: data.clinicAddress || DEFAULT_CLINIC.address
  }

  const subject = `Confirmación de Cita - ${pet.name} - ${formatDate(appointment.date)}`
  
  const body = buildConfirmationEmail(appointment, client, pet, clinic)

  return sendEmail({
    to: client.email,
    subject,
    body
  })
}

/**
 * Send appointment reminder email
 */
export const sendAppointmentReminder = async (
  data: AppointmentEmailData
): Promise<GmailMessage> => {
  const { appointment, client, pet } = data
  const clinic = {
    name: data.clinicName || DEFAULT_CLINIC.name,
    phone: data.clinicPhone || DEFAULT_CLINIC.phone,
    address: data.clinicAddress || DEFAULT_CLINIC.address
  }

  const subject = `Recordatorio de Cita - ${pet.name} - ${formatDate(appointment.date)}`
  
  const body = buildReminderEmail(appointment, client, pet, clinic)

  return sendEmail({
    to: client.email,
    subject,
    body
  })
}

/**
 * Send appointment cancellation email
 */
export const sendAppointmentCancellation = async (
  data: AppointmentEmailData
): Promise<GmailMessage> => {
  const { appointment, client, pet } = data
  const clinic = {
    name: data.clinicName || DEFAULT_CLINIC.name,
    phone: data.clinicPhone || DEFAULT_CLINIC.phone,
    address: data.clinicAddress || DEFAULT_CLINIC.address
  }

  const subject = `Cita Cancelada - ${pet.name} - ${formatDate(appointment.date)}`
  
  const body = buildCancellationEmail(appointment, client, pet, clinic)

  return sendEmail({
    to: client.email,
    subject,
    body
  })
}

/**
 * Send appointment rescheduled email
 */
export const sendAppointmentRescheduled = async (
  data: AppointmentEmailData
): Promise<GmailMessage> => {
  const { appointment, client, pet } = data
  const clinic = {
    name: data.clinicName || DEFAULT_CLINIC.name,
    phone: data.clinicPhone || DEFAULT_CLINIC.phone,
    address: data.clinicAddress || DEFAULT_CLINIC.address
  }

  const subject = `Cita Reprogramada - ${pet.name} - ${formatDate(appointment.date)}`
  
  const body = buildRescheduledEmail(appointment, client, pet, clinic)

  return sendEmail({
    to: client.email,
    subject,
    body
  })
}

/**
 * Format date for display in emails
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format time for display in emails
 */
const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':')
  const date = new Date()
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10))
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Get appointment type label in Spanish
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
 * Build confirmation email content
 */
const buildConfirmationEmail = (
  appointment: Appointment,
  client: Client,
  pet: Pet,
  clinic: { name: string; phone: string; address: string }
): string => {
  return `Estimado/a ${client.firstName} ${client.lastName},

¡Gracias por confiar en nosotros! Le confirmamos la cita de su mascota.

📋 DETALLES DE LA CITA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐾 Mascota: ${pet.name}
🏥 Tipo de cita: ${getAppointmentTypeLabel(appointment.type)}
📅 Fecha: ${formatDate(appointment.date)}
⏰ Hora: ${formatTime(appointment.time)}
⏱️ Duración: ${appointment.duration} minutos
👨‍⚕️ Veterinario/a: ${appointment.veterinarian}

📍 INFORMACIÓN DE LA CLÍNICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${clinic.name}
📞 Teléfono: ${clinic.phone}
📍 Dirección: ${clinic.address}

📝 NOTAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${appointment.notes || 'No hay notas adicionales.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ NOTAS IMPORTANTES:
• Por favor arrive 10-15 minutos antes de su cita
• Traiga el historial médico de ${pet.name} si es su primera visita
• Si necesita cancelar o reprogramar, favor de通知arnos con al menos 24 horas de anticipación

¿Tiene alguna pregunta? No dude en contactarnos.

Atentamente,
El equipo de ${clinic.name}

---
Este correo fue enviado automáticamente desde VetSoft - Sistema de Gestión Veterinaria`
}

/**
 * Build reminder email content
 */
const buildReminderEmail = (
  appointment: Appointment,
  client: Client,
  pet: Pet,
  clinic: { name: string; phone: string; address: string }
): string => {
  return `Estimado/a ${client.firstName} ${client.lastName},

Este es un recordatorio de la cita programada para mañana.

📋 DETALLES DE LA CITA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐾 Mascota: ${pet.name}
🏥 Tipo de cita: ${getAppointmentTypeLabel(appointment.type)}
📅 Fecha: ${formatDate(appointment.date)}
⏰ Hora: ${formatTime(appointment.time)}
⏱️ Duración: ${appointment.duration} minutos
👨‍⚕️ Veterinario/a: ${appointment.veterinarian}

📍 INFORMACIÓN DE LA CLÍNICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${clinic.name}
📞 Teléfono: ${clinic.phone}
📍 Dirección: ${clinic.address}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ RECORDATORIOS IMPORTANTES:
• Por favor arrive 10-15 minutos antes de su cita
• Traiga el historial médico de ${pet.name}
• Si no puede asistir, favor de notificarnos lo antes posible

¿Tiene alguna pregunta? No dude en contactarnos.

Atentamente,
El equipo de ${clinic.name}

---
Este correo fue enviado automáticamente desde VetSoft - Sistema de Gestión Veterinaria`
}

/**
 * Build cancellation email content
 */
const buildCancellationEmail = (
  appointment: Appointment,
  client: Client,
  pet: Pet,
  clinic: { name: string; phone: string; address: string }
): string => {
  return `Estimado/a ${client.firstName} ${client.lastName},

Le informamos que su cita ha sido cancelada.

📋 DETALLES DE LA CITA CANCELADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐾 Mascota: ${pet.name}
🏥 Tipo de cita: ${getAppointmentTypeLabel(appointment.type)}
📅 Fecha: ${formatDate(appointment.date)}
⏰ Hora: ${formatTime(appointment.time)}
👨‍⚕️ Veterinario/a: ${appointment.veterinarian}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Lamentamos cualquier inconvenience esto pueda causar. Si desea reprogramar su cita, por favor contactenos.

📞 Teléfono: ${clinic.phone}
📧 Email: ${DEFAULT_CLINIC.email}

Atentamente,
El equipo de ${clinic.name}

---
Este correo fue enviado automáticamente desde VetSoft - Sistema de Gestión Veterinaria`
}

/**
 * Build rescheduled email content
 */
const buildRescheduledEmail = (
  appointment: Appointment,
  client: Client,
  pet: Pet,
  clinic: { name: string; phone: string; address: string }
): string => {
  return `Estimado/a ${client.firstName} ${client.lastName},

Le informamos que su cita ha sido reprogramada.

📋 NUEVOS DETALLES DE LA CITA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐾 Mascota: ${pet.name}
🏥 Tipo de cita: ${getAppointmentTypeLabel(appointment.type)}
📅 Nueva Fecha: ${formatDate(appointment.date)}
⏰ Nueva Hora: ${formatTime(appointment.time)}
⏱️ Duración: ${appointment.duration} minutos
👨‍⚕️ Veterinario/a: ${appointment.veterinarian}

📍 INFORMACIÓN DE LA CLÍNICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${clinic.name}
📞 Teléfono: ${clinic.phone}
📍 Dirección: ${clinic.address}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Si tiene alguna pregunta o necesita hacer cambios, no dude en contactarnos.

Atentamente,
El equipo de ${clinic.name}

---
Este correo fue enviado automáticamente desde VetSoft - Sistema de Gestión Veterinaria`
}

/**
 * Check if Gmail integration is available
 */
export const isGmailAvailable = async (): Promise<boolean> => {
  try {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) return false
    
    const accessToken = await getGmailAccessToken()
    const response = await fetch(`${GMAIL_API}/users/me/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    return response.ok
  } catch {
    return false
  }
}
