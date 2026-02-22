import Dexie, { Table } from 'dexie'
import {
  User,
  Client,
  Pet,
  Appointment,
  Setting,
  CreateClientInput,
  UpdateClientInput,
  CreatePetInput,
  UpdatePetInput,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  CreateUserInput
} from './types'

// VetSoft Database Class
export class VetSoftDatabase extends Dexie {
  // Tables
  users!: Table<User, number>
  clients!: Table<Client, number>
  pets!: Table<Pet, number>
  appointments!: Table<Appointment, number>
  settings!: Table<Setting, number>

  constructor() {
    super('VetSoftDB')

    // Define schema with indexes
    this.version(1).stores({
      // Primary key is ++id (auto-increment)
      // Indexes for efficient querying
      users: '++id, email, name, role, createdAt',
      clients: '++id, email, firstName, lastName, phone, city, createdAt, updatedAt',
      pets: '++id, clientId, name, species, breed, gender, createdAt, updatedAt',
      appointments: '++id, petId, clientId, date, time, status, veterinarian, createdAt, updatedAt',
      settings: '++id, key, value'
    })
  }
}

// Create database instance
export const db = new VetSoftDatabase()

// Database Helper Methods

// ==================== CLIENTS ====================

/**
 * Get all clients
 */
export async function getAllClients(): Promise<Client[]> {
  return await db.clients.orderBy('createdAt').reverse().toArray()
}

/**
 * Get a client by ID
 */
export async function getClientById(id: number): Promise<Client | undefined> {
  return await db.clients.get(id)
}

/**
 * Get clients by email
 */
export async function getClientByEmail(email: string): Promise<Client | undefined> {
  return await db.clients.where('email').equals(email).first()
}

/**
 * Search clients by name
 */
export async function searchClients(query: string): Promise<Client[]> {
  const lowerQuery = query.toLowerCase()
  return await db.clients
    .filter(client =>
      client.firstName.toLowerCase().includes(lowerQuery) ||
      client.lastName.toLowerCase().includes(lowerQuery) ||
      client.email.toLowerCase().includes(lowerQuery)
    )
    .toArray()
}

/**
 * Add a new client
 */
export async function addClient(client: CreateClientInput): Promise<number> {
  const now = new Date().toISOString()
  return await db.clients.add({
    ...client,
    createdAt: now,
    updatedAt: now
  })
}

/**
 * Update a client
 */
export async function updateClient(id: number, updates: UpdateClientInput): Promise<number> {
  return await db.clients.update(id, {
    ...updates,
    updatedAt: new Date().toISOString()
  })
}

/**
 * Delete a client
 */
export async function deleteClient(id: number): Promise<void> {
  await db.clients.delete(id)
}

/**
 * Get client count
 */
export async function getClientCount(): Promise<number> {
  return await db.clients.count()
}

// ==================== PETS ====================

/**
 * Get all pets
 */
export async function getAllPets(): Promise<Pet[]> {
  return await db.pets.orderBy('createdAt').reverse().toArray()
}

/**
 * Get a pet by ID
 */
export async function getPetById(id: number): Promise<Pet | undefined> {
  return await db.pets.get(id)
}

/**
 * Get pets by client ID
 */
export async function getPetsByClientId(clientId: number): Promise<Pet[]> {
  return await db.pets.where('clientId').equals(clientId).toArray()
}

/**
 * Search pets by name
 */
export async function searchPets(query: string): Promise<Pet[]> {
  const lowerQuery = query.toLowerCase()
  return await db.pets
    .filter(pet =>
      pet.name.toLowerCase().includes(lowerQuery) ||
      pet.breed.toLowerCase().includes(lowerQuery)
    )
    .toArray()
}

/**
 * Add a new pet
 */
export async function addPet(pet: CreatePetInput): Promise<number> {
  const now = new Date().toISOString()
  return await db.pets.add({
    ...pet,
    createdAt: now,
    updatedAt: now
  })
}

/**
 * Update a pet
 */
export async function updatePet(id: number, updates: UpdatePetInput): Promise<number> {
  return await db.pets.update(id, {
    ...updates,
    updatedAt: new Date().toISOString()
  })
}

/**
 * Delete a pet
 */
export async function deletePet(id: number): Promise<void> {
  await db.pets.delete(id)
}

/**
 * Get pet count
 */
export async function getPetCount(): Promise<number> {
  return await db.pets.count()
}

// ==================== APPOINTMENTS ====================

/**
 * Get all appointments
 */
export async function getAllAppointments(): Promise<Appointment[]> {
  return await db.appointments.orderBy('date').reverse().toArray()
}

/**
 * Get an appointment by ID
 */
export async function getAppointmentById(id: number): Promise<Appointment | undefined> {
  return await db.appointments.get(id)
}

/**
 * Get appointments by client ID
 */
export async function getAppointmentsByClientId(clientId: number): Promise<Appointment[]> {
  return await db.appointments.where('clientId').equals(clientId).toArray()
}

/**
 * Get appointments by pet ID
 */
export async function getAppointmentsByPetId(petId: number): Promise<Appointment[]> {
  return await db.appointments.where('petId').equals(petId).toArray()
}

/**
 * Get appointments by date
 */
export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  return await db.appointments.where('date').equals(date).toArray()
}

/**
 * Get appointments by date range
 */
export async function getAppointmentsByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
  return await db.appointments
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray()
}

/**
 * Get appointments by status
 */
export async function getAppointmentsByStatus(status: Appointment['status']): Promise<Appointment[]> {
  return await db.appointments.where('status').equals(status).toArray()
}

/**
 * Get upcoming appointments (scheduled or confirmed, future date)
 */
export async function getUpcomingAppointments(limit: number = 10): Promise<Appointment[]> {
  const today = new Date().toISOString().split('T')[0]
  return await db.appointments
    .where('date')
    .aboveOrEqual(today)
    .filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed')
    .limit(limit)
    .toArray()
}

/**
 * Add a new appointment
 */
export async function addAppointment(appointment: CreateAppointmentInput): Promise<number> {
  const now = new Date().toISOString()
  return await db.appointments.add({
    ...appointment,
    createdAt: now,
    updatedAt: now
  })
}

/**
 * Update an appointment
 */
export async function updateAppointment(id: number, updates: UpdateAppointmentInput): Promise<number> {
  return await db.appointments.update(id, {
    ...updates,
    updatedAt: new Date().toISOString()
  })
}

/**
 * Delete an appointment
 */
export async function deleteAppointment(id: number): Promise<void> {
  await db.appointments.delete(id)
}

/**
 * Get appointment count
 */
export async function getAppointmentCount(): Promise<number> {
  return await db.appointments.count()
}

/**
 * Get today's appointments
 */
export async function getTodayAppointments(): Promise<Appointment[]> {
  const today = new Date().toISOString().split('T')[0]
  return await getAppointmentsByDate(today)
}

// ==================== USERS ====================

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  return await db.users.toArray()
}

/**
 * Get a user by ID
 */
export async function getUserById(id: number): Promise<User | undefined> {
  return await db.users.get(id)
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  return await db.users.where('email').equals(email).first()
}

/**
 * Add a new user
 */
export async function addUser(user: CreateUserInput): Promise<number> {
  return await db.users.add({
    ...user,
    createdAt: new Date().toISOString()
  })
}

/**
 * Delete a user
 */
export async function deleteUser(id: number): Promise<void> {
  await db.users.delete(id)
}

// ==================== SETTINGS ====================

/**
 * Get all settings
 */
export async function getAllSettings(): Promise<Setting[]> {
  return await db.settings.toArray()
}

/**
 * Get a setting by key
 */
export async function getSettingByKey(key: string): Promise<Setting | undefined> {
  return await db.settings.where('key').equals(key).first()
}

/**
 * Get a setting value by key
 */
export async function getSettingValue(key: string): Promise<string | undefined> {
  const setting = await getSettingByKey(key)
  return setting?.value
}

/**
 * Set a setting
 */
export async function setSetting(key: string, value: string): Promise<number> {
  const existing = await getSettingByKey(key)
  if (existing) {
    return await db.settings.update(existing.id!, { value })
  }
  return await db.settings.add({ key, value })
}

/**
 * Delete a setting
 */
export async function deleteSetting(key: string): Promise<void> {
  const setting = await getSettingByKey(key)
  if (setting && setting.id) {
    await db.settings.delete(setting.id)
  }
}

// ==================== UTILITY METHODS ====================

/**
 * Clear all data from the database
 */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.users, db.clients, db.pets, db.appointments, db.settings], async () => {
    await db.users.clear()
    await db.clients.clear()
    await db.pets.clear()
    await db.appointments.clear()
    await db.settings.clear()
  })
}

/**
 * Get database info
 */
export async function getDatabaseInfo(): Promise<{
  users: number
  clients: number
  pets: number
  appointments: number
  settings: number
}> {
  const [users, clients, pets, appointments, settings] = await Promise.all([
    db.users.count(),
    db.clients.count(),
    db.pets.count(),
    db.appointments.count(),
    db.settings.count()
  ])
  return { users, clients, pets, appointments, settings }
}

// Export database instance
export default db
