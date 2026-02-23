// Supabase database layer - replaces Dexie/IndexedDB
// Maps snake_case DB columns to camelCase for app types

import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type {
  Client,
  Pet,
  Appointment,
  Setting,
  InventoryItem,
  MedicalRecord,
  Vaccine,
  SaleItem,
  AppointmentAttachment,
  CreateClientInput,
  UpdateClientInput,
  CreatePetInput,
  UpdatePetInput,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  CreateUserInput,
  CreateInventoryInput,
  UpdateInventoryInput
} from './types'

// Helper: get current user id (required for all operations)
// Uses getUser() which validates with server - can hang if Supabase unreachable.
// Fallback to getSession() (cached) if getUser times out - avoids freeze on correct login.
async function getUserId(): Promise<string> {
  const timeoutMs = 8000
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Auth timeout - Supabase may be unreachable')), timeoutMs))

  try {
    const { data: { user }, error } = await Promise.race([
      supabase.auth.getUser(),
      timeoutPromise
    ]) as Awaited<ReturnType<typeof supabase.auth.getUser>>
    if (error) throw new Error(`Auth error: ${error.message}`)
    if (user) return user.id
  } catch (err) {
    // Timeout or network error: try getSession (reads from localStorage, no network)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) return session.user.id
    throw err instanceof Error ? err : new Error('Not authenticated. Please sign in again.')
  }
  throw new Error('Not authenticated. Please sign in again.')
}

// Helper: map DB row to Client (snake_case -> camelCase)
function mapClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as number,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    email: row.email as string,
    phone: row.phone as string,
    address: row.address as string,
    city: row.city as string,
    state: row.state as string,
    zipCode: row.zip_code as string,
    notes: row.notes as string,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    updatedAt: (row.updated_at as string) || new Date().toISOString()
  }
}

// Helper: map DB row to Pet
function mapPet(row: Record<string, unknown>): Pet {
  return {
    id: row.id as number,
    clientId: row.client_id as number,
    name: row.name as string,
    species: row.species as Pet['species'],
    breed: row.breed as string,
    gender: row.gender as Pet['gender'],
    birthDate: row.birth_date as string,
    weight: Number(row.weight) || 0,
    height: row.height != null ? Number(row.height) : undefined,
    color: row.color as string,
    microchipId: row.microchip_id as string,
    photoUrl: row.photo_url as string,
    treatment: row.treatment as string | undefined,
    lastSurgery: row.last_surgery as string | undefined,
    allergies: row.allergies as string | undefined,
    medicalNotes: row.medical_notes as string | undefined,
    notes: row.notes as string,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    updatedAt: (row.updated_at as string) || new Date().toISOString()
  }
}

// Helper: map DB row to Appointment
function mapAppointment(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as number,
    petId: row.pet_id as number,
    clientId: row.client_id as number,
    date: row.date as string,
    time: row.time as string,
    duration: Number(row.duration) || 30,
    type: row.type as Appointment['type'],
    status: row.status as Appointment['status'],
    veterinarian: row.veterinarian as string,
    notes: row.notes as string,
    totalAmount: row.total_amount != null ? Number(row.total_amount) : undefined,
    amountPaid: row.amount_paid != null ? Number(row.amount_paid) : undefined,
    googleCalendarEventId: row.google_calendar_event_id as string | undefined,
    emailSent: row.email_sent as boolean | undefined,
    reminderSent: row.reminder_sent as boolean | undefined,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    updatedAt: (row.updated_at as string) || new Date().toISOString()
  }
}

// Helper: map DB row to Setting
function mapSetting(row: Record<string, unknown>): Setting {
  return {
    id: row.id as number,
    key: row.key as string,
    value: row.value as string
  }
}

// ==================== CLIENTS ====================

export async function getAllClients(): Promise<Client[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(mapClient)
}

export async function getClientById(id: number): Promise<Client | undefined> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return data ? mapClient(data) : undefined
}

export async function getClientByEmail(email: string): Promise<Client | undefined> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .eq('email', email)
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapClient(data) : undefined
}

export async function searchClients(query: string): Promise<Client[]> {
  const lowerQuery = query.toLowerCase()
  const clients = await getAllClients()
  return clients.filter(
    c =>
      c.firstName.toLowerCase().includes(lowerQuery) ||
      c.lastName.toLowerCase().includes(lowerQuery) ||
      c.email.toLowerCase().includes(lowerQuery)
  )
}

export async function addClient(client: CreateClientInput): Promise<number> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env')
  }
  const userId = await getUserId()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: userId,
      first_name: client.firstName,
      last_name: client.lastName,
      email: client.email,
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      zip_code: client.zipCode || '',
      notes: client.notes || '',
      created_at: now,
      updated_at: now
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  if (!data?.id) throw new Error('Failed to create client: no ID returned')
  return data.id
}

export async function updateClient(id: number, updates: UpdateClientInput): Promise<number> {
  const userId = await getUserId()
  const updateObj: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.firstName !== undefined) updateObj.first_name = updates.firstName
  if (updates.lastName !== undefined) updateObj.last_name = updates.lastName
  if (updates.email !== undefined) updateObj.email = updates.email
  if (updates.phone !== undefined) updateObj.phone = updates.phone
  if (updates.address !== undefined) updateObj.address = updates.address
  if (updates.city !== undefined) updateObj.city = updates.city
  if (updates.state !== undefined) updateObj.state = updates.state
  if (updates.zipCode !== undefined) updateObj.zip_code = updates.zipCode
  if (updates.notes !== undefined) updateObj.notes = updates.notes

  const { error } = await supabase
    .from('clients')
    .update(updateObj)
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return id
}

export async function deleteClient(id: number): Promise<void> {
  const userId = await getUserId()
  const { error } = await supabase.from('clients').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function getClientCount(): Promise<number> {
  const clients = await getAllClients()
  return clients.length
}

// ==================== PETS ====================

export async function getAllPets(): Promise<Pet[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(mapPet)
}

export async function getPetById(id: number): Promise<Pet | undefined> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return data ? mapPet(data) : undefined
}

export async function getPetsByClientId(clientId: number): Promise<Pet[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', userId)
    .eq('client_id', clientId)

  if (error) throw new Error(error.message)
  return (data || []).map(mapPet)
}

export async function searchPets(query: string): Promise<Pet[]> {
  const lowerQuery = query.toLowerCase()
  const pets = await getAllPets()
  return pets.filter(
    p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.breed.toLowerCase().includes(lowerQuery)
  )
}

export async function addPet(pet: CreatePetInput): Promise<number> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env')
  }
  const userId = await getUserId()
  const now = new Date().toISOString()
  // Base columns only (migration 001) - extended columns added via migration 002/003
  const insertData: Record<string, unknown> = {
    user_id: userId,
    client_id: pet.clientId,
    name: pet.name,
    species: pet.species,
    breed: pet.breed || '',
    gender: pet.gender,
    birth_date: pet.birthDate || '',
    weight: pet.weight ?? 0,
    color: pet.color || '',
    microchip_id: pet.microchipId || '',
    photo_url: pet.photoUrl || '',
    notes: pet.notes || '',
    created_at: now,
    updated_at: now
  }
  const { data, error } = await supabase
    .from('pets')
    .insert(insertData)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  if (!data?.id) throw new Error('Failed to create pet: no ID returned')
  return data.id
}

export async function updatePet(id: number, updates: UpdatePetInput): Promise<number> {
  const userId = await getUserId()
  const updateObj: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.clientId !== undefined) updateObj.client_id = updates.clientId
  if (updates.name !== undefined) updateObj.name = updates.name
  if (updates.species !== undefined) updateObj.species = updates.species
  if (updates.breed !== undefined) updateObj.breed = updates.breed
  if (updates.gender !== undefined) updateObj.gender = updates.gender
  if (updates.birthDate !== undefined) updateObj.birth_date = updates.birthDate
  if (updates.weight !== undefined) updateObj.weight = updates.weight
  if (updates.color !== undefined) updateObj.color = updates.color
  if (updates.microchipId !== undefined) updateObj.microchip_id = updates.microchipId
  if (updates.photoUrl !== undefined) updateObj.photo_url = updates.photoUrl
  if (updates.height !== undefined) updateObj.height = updates.height
  if (updates.treatment !== undefined) updateObj.treatment = updates.treatment
  if (updates.lastSurgery !== undefined) updateObj.last_surgery = updates.lastSurgery
  if (updates.allergies !== undefined) updateObj.allergies = updates.allergies
  if (updates.medicalNotes !== undefined) updateObj.medical_notes = updates.medicalNotes
  if (updates.notes !== undefined) updateObj.notes = updates.notes

  const { error } = await supabase
    .from('pets')
    .update(updateObj)
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return id
}

export async function deletePet(id: number): Promise<void> {
  const userId = await getUserId()
  const { error } = await supabase.from('pets').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function getPetCount(): Promise<number> {
  const pets = await getAllPets()
  return pets.length
}

// ==================== APPOINTMENTS ====================

export async function getAllAppointments(): Promise<Appointment[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(mapAppointment)
}

export async function getAppointmentById(id: number): Promise<Appointment | undefined> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return data ? mapAppointment(data) : undefined
}

export async function getAppointmentsByClientId(clientId: number): Promise<Appointment[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .eq('client_id', clientId)

  if (error) throw new Error(error.message)
  return (data || []).map(mapAppointment)
}

export async function getAppointmentsByPetId(petId: number): Promise<Appointment[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .eq('pet_id', petId)

  if (error) throw new Error(error.message)
  return (data || []).map(mapAppointment)
}

export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)

  if (error) throw new Error(error.message)
  return (data || []).map(mapAppointment)
}

export async function getAppointmentsByDateRange(
  startDate: string,
  endDate: string
): Promise<Appointment[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map(mapAppointment)
}

export async function getAppointmentsByStatus(
  status: Appointment['status']
): Promise<Appointment[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', status)

  if (error) throw new Error(error.message)
  return (data || []).map(mapAppointment)
}

export async function getUpcomingAppointments(limit: number = 10): Promise<Appointment[]> {
  const today = new Date().toISOString().split('T')[0]
  const appointments = await getAppointmentsByDateRange(today, '9999-12-31')
  return appointments
    .filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed')
    .slice(0, limit)
}

export async function addAppointment(appointment: CreateAppointmentInput): Promise<number> {
  const userId = await getUserId()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      pet_id: appointment.petId,
      client_id: appointment.clientId,
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration ?? 30,
      type: appointment.type,
      status: appointment.status,
      veterinarian: appointment.veterinarian || '',
      notes: appointment.notes || '',
      total_amount: appointment.totalAmount ?? 0,
      amount_paid: appointment.amountPaid ?? 0,
      google_calendar_event_id: appointment.googleCalendarEventId,
      email_sent: appointment.emailSent ?? false,
      reminder_sent: appointment.reminderSent ?? false,
      created_at: now,
      updated_at: now
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id
}

export async function updateAppointment(
  id: number,
  updates: UpdateAppointmentInput
): Promise<number> {
  const userId = await getUserId()
  const updateObj: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.petId !== undefined) updateObj.pet_id = updates.petId
  if (updates.clientId !== undefined) updateObj.client_id = updates.clientId
  if (updates.date !== undefined) updateObj.date = updates.date
  if (updates.time !== undefined) updateObj.time = updates.time
  if (updates.duration !== undefined) updateObj.duration = updates.duration
  if (updates.type !== undefined) updateObj.type = updates.type
  if (updates.status !== undefined) updateObj.status = updates.status
  if (updates.veterinarian !== undefined) updateObj.veterinarian = updates.veterinarian
  if (updates.notes !== undefined) updateObj.notes = updates.notes
  if (updates.googleCalendarEventId !== undefined)
    updateObj.google_calendar_event_id = updates.googleCalendarEventId
  if (updates.emailSent !== undefined) updateObj.email_sent = updates.emailSent
  if (updates.reminderSent !== undefined) updateObj.reminder_sent = updates.reminderSent
  if (updates.totalAmount !== undefined) updateObj.total_amount = updates.totalAmount
  if (updates.amountPaid !== undefined) updateObj.amount_paid = updates.amountPaid

  const { error } = await supabase
    .from('appointments')
    .update(updateObj)
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return id
}

export async function deleteAppointment(id: number): Promise<void> {
  const userId = await getUserId()
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function getAppointmentCount(): Promise<number> {
  const appointments = await getAllAppointments()
  return appointments.length
}

export async function getTodayAppointments(): Promise<Appointment[]> {
  const today = new Date().toISOString().split('T')[0]
  return getAppointmentsByDate(today)
}

// ==================== USERS (Supabase Auth handles users - these are for app profiles if needed) ====================
// Note: We don't have a separate users table - Supabase auth.users is the source
// Keeping these for compatibility but they won't be used with Supabase Auth

export async function getAllUsers(): Promise<never[]> {
  return []
}

export async function getUserById(_id: number): Promise<undefined> {
  return undefined
}

export async function getUserByEmail(_email: string): Promise<undefined> {
  return undefined
}

export async function addUser(_user: CreateUserInput): Promise<number> {
  throw new Error('Use Supabase Auth for user management')
}

export async function deleteUser(_id: number): Promise<void> {
  throw new Error('Use Supabase Auth for user management')
}

// ==================== SETTINGS ====================

export async function getAllSettings(): Promise<Setting[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return (data || []).map(mapSetting)
}

export async function getSettingByKey(key: string): Promise<Setting | undefined> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .eq('key', key)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapSetting(data) : undefined
}

export async function getSettingValue(key: string): Promise<string | undefined> {
  const setting = await getSettingByKey(key)
  return setting?.value
}

export async function setSetting(key: string, value: string): Promise<number> {
  const userId = await getUserId()
  const existing = await getSettingByKey(key)
  if (existing) {
    const { error } = await supabase
      .from('settings')
      .update({ value })
      .eq('id', existing.id)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
    return existing.id!
  }
  const { data, error } = await supabase
    .from('settings')
    .insert({ user_id: userId, key, value })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function deleteSetting(key: string): Promise<void> {
  const userId = await getUserId()
  const setting = await getSettingByKey(key)
  if (setting?.id) {
    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('id', setting.id)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
  }
}

// ==================== INVENTORY ====================

function mapInventoryItem(row: Record<string, unknown>): InventoryItem {
  return {
    id: row.id as number,
    name: row.name as string,
    type: row.type as InventoryItem['type'],
    description: row.description as string | undefined,
    quantity: Number(row.quantity) || 0,
    unit: row.unit as string | undefined,
    price: Number(row.price) || 0,
    photoUrl: row.photo_url as string | undefined,
    sku: row.sku as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined
  }
}

export async function getAllInventory(): Promise<InventoryItem[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(mapInventoryItem)
}

export async function getInventoryById(id: number): Promise<InventoryItem | undefined> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return data ? mapInventoryItem(data) : undefined
}

export async function addInventoryItem(item: CreateInventoryInput): Promise<number> {
  const userId = await getUserId()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('inventory')
    .insert({
      user_id: userId,
      name: item.name,
      type: item.type,
      description: item.description || '',
      quantity: item.quantity ?? 0,
      unit: item.unit || 'unit',
      price: item.price ?? 0,
      photo_url: item.photoUrl || '',
      sku: item.sku || '',
      created_at: now,
      updated_at: now
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function updateInventoryItem(id: number, updates: UpdateInventoryInput): Promise<number> {
  const userId = await getUserId()
  const updateObj: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.name !== undefined) updateObj.name = updates.name
  if (updates.type !== undefined) updateObj.type = updates.type
  if (updates.description !== undefined) updateObj.description = updates.description
  if (updates.quantity !== undefined) updateObj.quantity = updates.quantity
  if (updates.unit !== undefined) updateObj.unit = updates.unit
  if (updates.price !== undefined) updateObj.price = updates.price
  if (updates.photoUrl !== undefined) updateObj.photo_url = updates.photoUrl
  if (updates.sku !== undefined) updateObj.sku = updates.sku
  const { error } = await supabase
    .from('inventory')
    .update(updateObj)
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  return id
}

export async function deleteInventoryItem(id: number): Promise<void> {
  const userId = await getUserId()
  const { error } = await supabase.from('inventory').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

// ==================== MEDICAL RECORDS ====================

function mapMedicalRecord(row: Record<string, unknown>): MedicalRecord {
  return {
    id: row.id as number,
    appointmentId: row.appointment_id as number,
    petId: row.pet_id as number,
    symptoms: row.symptoms as string | undefined,
    diagnosis: row.diagnosis as string | undefined,
    treatment: row.treatment as string | undefined,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string | undefined
  }
}

export async function getMedicalRecordsByAppointment(appointmentId: number): Promise<MedicalRecord[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('user_id', userId)
    .eq('appointment_id', appointmentId)
  if (error) throw new Error(error.message)
  return (data || []).map(mapMedicalRecord)
}

export async function getMedicalRecordsByPet(petId: number): Promise<MedicalRecord[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('user_id', userId)
    .eq('pet_id', petId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(mapMedicalRecord)
}

export async function addMedicalRecord(record: Omit<MedicalRecord, 'id' | 'createdAt'>): Promise<number> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('medical_records')
    .insert({
      user_id: userId,
      appointment_id: record.appointmentId,
      pet_id: record.petId,
      symptoms: record.symptoms || '',
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      notes: record.notes || ''
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function updateMedicalRecord(
  id: number,
  updates: Partial<Pick<MedicalRecord, 'symptoms' | 'diagnosis' | 'treatment' | 'notes'>>
): Promise<void> {
  const userId = await getUserId()
  const updateObj: Record<string, unknown> = {}
  if (updates.symptoms !== undefined) updateObj.symptoms = updates.symptoms
  if (updates.diagnosis !== undefined) updateObj.diagnosis = updates.diagnosis
  if (updates.treatment !== undefined) updateObj.treatment = updates.treatment
  if (updates.notes !== undefined) updateObj.notes = updates.notes
  if (Object.keys(updateObj).length === 0) return
  const { error } = await supabase
    .from('medical_records')
    .update(updateObj)
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}

// ==================== VACCINES ====================

function mapVaccine(row: Record<string, unknown>): Vaccine {
  return {
    id: row.id as number,
    petId: row.pet_id as number,
    name: row.name as string,
    dateAdministered: row.date_administered as string,
    nextDueDate: row.next_due_date as string | undefined,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string | undefined
  }
}

export async function getVaccinesByPet(petId: number): Promise<Vaccine[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('vaccines')
    .select('*')
    .eq('user_id', userId)
    .eq('pet_id', petId)
    .order('date_administered', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(mapVaccine)
}

export async function addVaccine(vaccine: Omit<Vaccine, 'id' | 'createdAt'>): Promise<number> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('vaccines')
    .insert({
      user_id: userId,
      pet_id: vaccine.petId,
      name: vaccine.name,
      date_administered: vaccine.dateAdministered,
      next_due_date: vaccine.nextDueDate || '',
      notes: vaccine.notes || ''
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function deleteVaccine(id: number): Promise<void> {
  const userId = await getUserId()
  const { error } = await supabase.from('vaccines').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

// ==================== SALE ITEMS (medications sold in appointment) ====================

export async function getSaleItemsByAppointment(appointmentId: number): Promise<SaleItem[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('sale_items')
    .select('*')
    .eq('user_id', userId)
    .eq('appointment_id', appointmentId)
  if (error) throw new Error(error.message)
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as number,
    appointmentId: row.appointment_id as number,
    inventoryId: row.inventory_id as number,
    quantity: Number(row.quantity) || 1,
    unitPrice: Number(row.unit_price) || 0,
    createdAt: row.created_at as string | undefined
  }))
}

export async function addSaleItem(item: Omit<SaleItem, 'id' | 'createdAt'>): Promise<number> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('sale_items')
    .insert({
      user_id: userId,
      appointment_id: item.appointmentId,
      inventory_id: item.inventoryId,
      quantity: item.quantity,
      unit_price: item.unitPrice
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function deleteSaleItem(id: number): Promise<void> {
  const userId = await getUserId()
  const { error } = await supabase.from('sale_items').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

// ==================== APPOINTMENT ATTACHMENTS ====================

export async function getAppointmentAttachments(appointmentId: number): Promise<AppointmentAttachment[]> {
  try {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('appointment_attachments')
      .select('*')
      .eq('user_id', userId)
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false })
    if (error) return []
    return (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as number,
      appointmentId: row.appointment_id as number,
      fileUrl: row.file_url as string,
      fileName: row.file_name as string,
      fileType: row.file_type as string | undefined,
      createdAt: row.created_at as string | undefined
    }))
  } catch {
    return []
  }
}

export async function addAppointmentAttachment(
  appointmentId: number,
  fileUrl: string,
  fileName: string,
  fileType?: string
): Promise<number> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('appointment_attachments')
    .insert({
      user_id: userId,
      appointment_id: appointmentId,
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType || ''
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function deleteAppointmentAttachment(id: number): Promise<void> {
  const userId = await getUserId()
  const { error } = await supabase
    .from('appointment_attachments')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}

// Upload file to Supabase Storage - requires bucket 'appointment-attachments' (create in Dashboard)
export async function uploadAppointmentAttachment(
  appointmentId: number,
  file: File
): Promise<AppointmentAttachment> {
  const userId = await getUserId()
  const ext = file.name.split('.').pop() || 'bin'
  const path = `${userId}/${appointmentId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('appointment-attachments')
    .upload(path, file, { upsert: false })
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
  const { data: { publicUrl } } = supabase.storage.from('appointment-attachments').getPublicUrl(uploadData.path)
  const id = await addAppointmentAttachment(appointmentId, publicUrl, file.name, file.type)
  return { id, appointmentId, fileUrl: publicUrl, fileName: file.name, fileType: file.type }
}

// ==================== UTILITY ====================

export async function clearAllData(): Promise<void> {
  const userId = await getUserId()
  await supabase.from('appointments').delete().eq('user_id', userId)
  await supabase.from('pets').delete().eq('user_id', userId)
  await supabase.from('clients').delete().eq('user_id', userId)
  await supabase.from('inventory').delete().eq('user_id', userId)
  await supabase.from('settings').delete().eq('user_id', userId)
}

export async function getDatabaseInfo(): Promise<{
  users: number
  clients: number
  pets: number
  appointments: number
  settings: number
}> {
  const [clients, pets, appointments, settings] = await Promise.all([
    getClientCount(),
    getPetCount(),
    getAppointmentCount(),
    getAllSettings().then(s => s.length)
  ])
  return { users: 0, clients, pets, appointments, settings }
}
