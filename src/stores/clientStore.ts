import { create } from 'zustand'
import {
  getAllClients,
  addClient as dbAddClient,
  updateClient as dbUpdateClient,
  deleteClient as dbDeleteClient,
  searchClients as dbSearchClients
} from '../db'
import { Client, CreateClientInput, UpdateClientInput } from '../db/types'

interface ClientState {
  clients: Client[]
  selectedClient: Client | null
  isLoading: boolean
  error: string | null
  // Actions
  fetchClients: () => Promise<void>
  addClient: (client: CreateClientInput) => Promise<number>
  updateClient: (id: number, updates: UpdateClientInput) => Promise<void>
  deleteClient: (id: number) => Promise<void>
  searchClients: (query: string) => Promise<void>
  setSelectedClient: (client: Client | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

export const useClientStore = create<ClientState>((set) => ({
  clients: [],
  selectedClient: null,
  isLoading: false,
  error: null,
  
  fetchClients: async () => {
    set({ isLoading: true, error: null })
    try {
      const clients = await getAllClients()
      set({ clients, isLoading: false })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch clients'
      console.error('Failed to fetch clients:', error)
      set({ error: msg, isLoading: false })
    }
  },
  
  addClient: async (clientData) => {
    set({ isLoading: true, error: null })
    try {
      const id = await dbAddClient(clientData)
      // Fetch updated list
      const clients = await getAllClients()
      set({ clients, isLoading: false })
      return id
    } catch (error) {
      console.error('Failed to add client:', error)
      set({ error: 'Failed to add client', isLoading: false })
      throw error
    }
  },
  
  updateClient: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      await dbUpdateClient(id, updates)
      // Fetch updated list
      const clients = await getAllClients()
      set({ clients, isLoading: false })
    } catch (error) {
      console.error('Failed to update client:', error)
      set({ error: 'Failed to update client', isLoading: false })
      throw error
    }
  },
  
  deleteClient: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await dbDeleteClient(id)
      // Fetch updated list
      const clients = await getAllClients()
      set({ clients, isLoading: false })
    } catch (error) {
      console.error('Failed to delete client:', error)
      set({ error: 'Failed to delete client', isLoading: false })
      throw error
    }
  },
  
  searchClients: async (query) => {
    set({ isLoading: true, error: null })
    try {
      if (query.trim() === '') {
        const clients = await getAllClients()
        set({ clients, isLoading: false })
      } else {
        const clients = await dbSearchClients(query)
        set({ clients, isLoading: false })
      }
    } catch (error) {
      console.error('Failed to search clients:', error)
      set({ error: 'Failed to search clients', isLoading: false })
    }
  },
  
  setSelectedClient: (client) => set({ selectedClient: client }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error })
}))

// Export Client type for use in other files
export type { Client }
