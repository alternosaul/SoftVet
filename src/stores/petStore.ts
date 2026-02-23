import { create } from 'zustand'
import {
  getAllPets,
  getPetsByClientId,
  addPet as dbAddPet,
  updatePet as dbUpdatePet,
  deletePet as dbDeletePet,
  searchPets as dbSearchPets
} from '../db'
import { Pet, CreatePetInput, UpdatePetInput } from '../db/types'

interface PetState {
  pets: Pet[]
  selectedPet: Pet | null
  isLoading: boolean
  error: string | null
  // Actions
  fetchPets: () => Promise<void>
  fetchPetsByClient: (clientId: number) => Promise<void>
  addPet: (pet: CreatePetInput) => Promise<number>
  updatePet: (id: number, updates: UpdatePetInput) => Promise<void>
  deletePet: (id: number) => Promise<void>
  searchPets: (query: string) => Promise<void>
  setSelectedPet: (pet: Pet | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

export const usePetStore = create<PetState>((set) => ({
  pets: [],
  selectedPet: null,
  isLoading: false,
  error: null,
  
  fetchPets: async () => {
    set({ isLoading: true, error: null })
    try {
      const pets = await getAllPets()
      set({ pets, isLoading: false })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch pets'
      console.error('Failed to fetch pets:', error)
      set({ error: msg, isLoading: false })
    }
  },
  
  fetchPetsByClient: async (clientId: number) => {
    set({ isLoading: true, error: null })
    try {
      const pets = await getPetsByClientId(clientId)
      set({ pets, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch pets:', error)
      set({ error: 'Failed to fetch pets', isLoading: false })
    }
  },
  
  addPet: async (petData: CreatePetInput) => {
    set({ isLoading: true, error: null })
    try {
      const id = await dbAddPet(petData)
      const now = new Date().toISOString()
      // Add to state immediately (avoids slow refetch), refresh in background
      const newPet: Pet = { id, ...petData, createdAt: now, updatedAt: now } as Pet
      set((state) => ({ pets: [newPet, ...state.pets], isLoading: false }))
      getAllPets().then((pets) => set({ pets })).catch(() => {})
      return id
    } catch (error) {
      console.error('Failed to add pet:', error)
      set({ error: 'Failed to add pet', isLoading: false })
      throw error
    }
  },
  
  updatePet: async (id: number, updates: UpdatePetInput) => {
    set({ isLoading: true, error: null })
    try {
      await dbUpdatePet(id, updates)
      // Fetch updated list
      const pets = await getAllPets()
      set({ pets, isLoading: false })
    } catch (error) {
      console.error('Failed to update pet:', error)
      set({ error: 'Failed to update pet', isLoading: false })
      throw error
    }
  },
  
  deletePet: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await dbDeletePet(id)
      // Fetch updated list
      const pets = await getAllPets()
      set({ pets, isLoading: false })
    } catch (error) {
      console.error('Failed to delete pet:', error)
      set({ error: 'Failed to delete pet', isLoading: false })
      throw error
    }
  },
  
  searchPets: async (query: string) => {
    set({ isLoading: true, error: null })
    try {
      if (query.trim() === '') {
        const pets = await getAllPets()
        set({ pets, isLoading: false })
      } else {
        const pets = await dbSearchPets(query)
        set({ pets, isLoading: false })
      }
    } catch (error) {
      console.error('Failed to search pets:', error)
      set({ error: 'Failed to search pets', isLoading: false })
    }
  },
  
  setSelectedPet: (pet: Pet | null) => set({ selectedPet: pet }),
  
  setLoading: (isLoading: boolean) => set({ isLoading }),
  
  setError: (error: string | null) => set({ error })
}))

// Export Pet type for use in other files
export type { Pet }
