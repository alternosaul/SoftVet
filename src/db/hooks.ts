// Database initialization for Supabase
// Called after user is authenticated - sets default settings and optionally seeds demo data

import {
  clearAllData,
  addClient,
  addPet,
  addAppointment,
  getClientCount,
  getSettingByKey,
  setSetting
} from './supabase'
import { CreateClientInput, CreatePetInput, CreateAppointmentInput } from './types'

// Initialize default settings for the current user
async function initializeSettings(): Promise<void> {
  const defaultSettings = [
    { key: 'clinicName', value: 'VetSoft Clinic' },
    { key: 'clinicAddress', value: '' },
    { key: 'clinicPhone', value: '' },
    { key: 'clinicEmail', value: '' },
    { key: 'defaultAppointmentDuration', value: '30' },
    { key: 'currency', value: 'USD' },
    { key: 'dateFormat', value: 'YYYY-MM-DD' },
    { key: 'timeFormat', value: '24h' },
    { key: 'googleCalendarEnabled', value: 'false' },
    { key: 'emailNotificationsEnabled', value: 'false' },
    { key: 'price_consultation', value: '50' },
    { key: 'price_vaccination', value: '35' },
    { key: 'price_surgery', value: '150' },
    { key: 'price_grooming', value: '40' },
    { key: 'price_emergency', value: '100' },
    { key: 'price_follow-up', value: '30' }
  ]

  for (const setting of defaultSettings) {
    const existing = await getSettingByKey(setting.key)
    if (!existing) {
      await setSetting(setting.key, setting.value)
    }
  }
}

// Seed database with demo data for new users
export async function seedDatabase(): Promise<void> {
  try {
    const now = new Date().toISOString()

    const demoClients: CreateClientInput[] = [
      {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '(555) 123-4567',
        address: '123 Main Street',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        notes: 'Regular client since 2020',
        createdAt: now,
        updatedAt: now
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.j@example.com',
        phone: '(555) 234-5678',
        address: '456 Oak Avenue',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62702',
        notes: 'Prefers afternoon appointments',
        createdAt: now,
        updatedAt: now
      },
      {
        firstName: 'Michael',
        lastName: 'Williams',
        email: 'm.williams@example.com',
        phone: '(555) 345-6789',
        address: '789 Pine Road',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62703',
        notes: '',
        createdAt: now,
        updatedAt: now
      }
    ]

    const clientIds: number[] = []
    for (const client of demoClients) {
      const id = await addClient(client)
      clientIds.push(id)
    }

    const demoPets: CreatePetInput[] = [
      {
        clientId: clientIds[0],
        name: 'Max',
        species: 'dog',
        breed: 'Golden Retriever',
        gender: 'male',
        birthDate: '2019-03-15',
        weight: 75,
        color: 'Golden',
        microchipId: '985121012345678',
        photoUrl: '',
        notes: 'Very friendly, loves treats',
        createdAt: now,
        updatedAt: now
      },
      {
        clientId: clientIds[0],
        name: 'Bella',
        species: 'cat',
        breed: 'Persian',
        gender: 'female',
        birthDate: '2020-07-22',
        weight: 8,
        color: 'White',
        microchipId: '985121012345679',
        photoUrl: '',
        notes: 'Indoor cat, shy with strangers',
        createdAt: now,
        updatedAt: now
      },
      {
        clientId: clientIds[1],
        name: 'Charlie',
        species: 'dog',
        breed: 'Labrador',
        gender: 'male',
        birthDate: '2018-11-05',
        weight: 80,
        color: 'Black',
        microchipId: '985121012345680',
        photoUrl: '',
        notes: 'High energy, needs lots of exercise',
        createdAt: now,
        updatedAt: now
      },
      {
        clientId: clientIds[2],
        name: 'Luna',
        species: 'cat',
        breed: 'Siamese',
        gender: 'female',
        birthDate: '2021-02-14',
        weight: 6,
        color: 'Cream',
        microchipId: '985121012345681',
        photoUrl: '',
        notes: 'Very vocal, loves attention',
        createdAt: now,
        updatedAt: now
      }
    ]

    const petIds: number[] = []
    for (const pet of demoPets) {
      const id = await addPet(pet)
      petIds.push(id)
    }

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextWeekStr = nextWeek.toISOString().split('T')[0]

    const demoAppointments: CreateAppointmentInput[] = [
      {
        clientId: clientIds[0],
        petId: petIds[0],
        date: tomorrowStr,
        time: '10:00',
        duration: 30,
        type: 'consultation',
        status: 'scheduled',
        veterinarian: 'Dr. Anderson',
        notes: 'Annual checkup',
        createdAt: now,
        updatedAt: now
      },
      {
        clientId: clientIds[1],
        petId: petIds[2],
        date: tomorrowStr,
        time: '14:30',
        duration: 45,
        type: 'vaccination',
        status: 'confirmed',
        veterinarian: 'Dr. Anderson',
        notes: 'Rabies vaccination due',
        createdAt: now,
        updatedAt: now
      },
      {
        clientId: clientIds[2],
        petId: petIds[3],
        date: nextWeekStr,
        time: '09:00',
        duration: 60,
        type: 'surgery',
        status: 'scheduled',
        veterinarian: 'Dr. Martinez',
        notes: 'Spay procedure',
        createdAt: now,
        updatedAt: now
      },
      {
        clientId: clientIds[0],
        petId: petIds[1],
        date: nextWeekStr,
        time: '11:30',
        duration: 30,
        type: 'follow-up',
        status: 'scheduled',
        veterinarian: 'Dr. Anderson',
        notes: 'Post-surgery checkup',
        createdAt: now,
        updatedAt: now
      }
    ]

    for (const appointment of demoAppointments) {
      await addAppointment(appointment)
    }

    console.log('Database seeded successfully!')
  } catch (error) {
    console.error('Failed to seed database:', error)
    throw error
  }
}

// Initialize database after user is authenticated
// Sets default settings and optionally seeds demo data for new users
export async function initializeDatabase(): Promise<void> {
  try {
    const clientCount = await getClientCount()

    if (clientCount === 0) {
      console.log('Database is empty, seeding with demo data...')
      await seedDatabase()
    } else {
      console.log(`Database already contains ${clientCount} clients`)
    }

    await initializeSettings()
    console.log('Database initialization complete')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

// Reset database (for development/testing)
export async function resetDatabase(): Promise<void> {
  await clearAllData()
  await seedDatabase()
  await initializeSettings()
  console.log('Database reset complete')
}

export const databaseHooks = {
  onInit: initializeDatabase,
  onSeed: seedDatabase,
  onReset: resetDatabase
}

export default databaseHooks
