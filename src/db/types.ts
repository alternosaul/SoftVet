// Database Types for VetSoft
// TypeScript interfaces for all data models

// User Model
export interface User {
  id?: number // Auto-incremented by Dexie
  email: string
  name: string
  role: 'admin' | 'veterinarian' | 'receptionist'
  createdAt: string
}

// Client Model
export interface Client {
  id?: number // Auto-incremented by Dexie
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  notes: string
  createdAt: string
  updatedAt: string
}

// Pet Model
export interface Pet {
  id?: number
  clientId: number
  name: string
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'reptile' | 'other'
  breed: string
  gender: 'male' | 'female' | 'unknown'
  birthDate: string
  weight: number
  height?: number
  color: string
  microchipId: string
  photoUrl: string
  treatment?: string
  lastSurgery?: string
  allergies?: string
  medicalNotes?: string
  notes: string
  createdAt: string
  updatedAt: string
}

// Appointment Model
export interface Appointment {
  id?: number
  petId: number
  clientId: number
  date: string
  time: string
  duration: number
  type: 'consultation' | 'vaccination' | 'surgery' | 'grooming' | 'emergency' | 'follow-up'
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  veterinarian: string
  notes: string
  totalAmount?: number
  amountPaid?: number
  googleCalendarEventId?: string
  emailSent?: boolean
  reminderSent?: boolean
  createdAt: string
  updatedAt: string
}

// Inventory Model (medications and clinic items)
export interface InventoryItem {
  id?: number
  name: string
  type: 'medication' | 'item'
  description?: string
  quantity: number
  unit?: string
  price: number
  photoUrl?: string
  sku?: string
  createdAt?: string
  updatedAt?: string
}

// Appointment attachment (PDFs, images - medical studies, X-rays)
export interface AppointmentAttachment {
  id?: number
  appointmentId: number
  fileUrl: string
  fileName: string
  fileType?: string
  createdAt?: string
}

// Sale item (medication/item sold in an appointment)
export interface SaleItem {
  id?: number
  appointmentId: number
  inventoryId: number
  quantity: number
  unitPrice: number
  createdAt?: string
}

// Medical record - historial por cita
export interface MedicalRecord {
  id?: number
  appointmentId: number
  petId: number
  symptoms?: string
  diagnosis?: string
  treatment?: string
  notes?: string
  createdAt?: string
}

// Vaccine tracking
export interface Vaccine {
  id?: number
  petId: number
  name: string
  dateAdministered: string
  nextDueDate?: string
  notes?: string
  createdAt?: string
}

// Settings Model
export interface Setting {
  id?: number // Auto-incremented by Dexie
  key: string
  value: string
}

// Type for creating a new client (without id, with timestamps managed by DB)
export type CreateClientInput = Omit<Client, 'id'>

// Type for updating a client
export type UpdateClientInput = Partial<CreateClientInput>

// Type for creating a new pet (without id, with timestamps managed by DB)
export type CreatePetInput = Omit<Pet, 'id'>

// Type for updating a pet
export type UpdatePetInput = Partial<CreatePetInput>

// Type for creating a new appointment (without id, with timestamps managed by DB)
export type CreateAppointmentInput = Omit<Appointment, 'id'>

// Type for updating an appointment
export type UpdateAppointmentInput = Partial<CreateAppointmentInput>

// Type for creating a new user (without id and timestamps)
export type CreateUserInput = Omit<User, 'id'>

// Type for creating a new setting (without id)
export type CreateSettingInput = Omit<Setting, 'id'>

export type CreateInventoryInput = Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateInventoryInput = Partial<CreateInventoryInput>
