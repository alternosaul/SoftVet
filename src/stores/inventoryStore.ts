import { create } from 'zustand'
import {
  getAllInventory,
  addInventoryItem as dbAddItem,
  updateInventoryItem as dbUpdateItem,
  deleteInventoryItem as dbDeleteItem
} from '../db'
import type { InventoryItem, CreateInventoryInput, UpdateInventoryInput } from '../db/types'

interface InventoryState {
  items: InventoryItem[]
  isLoading: boolean
  error: string | null
  setError: (error: string | null) => void
  fetchItems: () => Promise<void>
  addItem: (item: CreateInventoryInput) => Promise<number>
  updateItem: (id: number, updates: UpdateInventoryInput) => Promise<void>
  deleteItem: (id: number) => Promise<void>
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  setError: (error) => set({ error }),

  fetchItems: async () => {
    set({ isLoading: true, error: null })
    try {
      const items = await getAllInventory()
      set({ items, isLoading: false })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch inventory'
      console.error('Failed to fetch inventory:', error)
      set({ error: msg, isLoading: false })
    }
  },

  addItem: async (itemData) => {
    set({ isLoading: true, error: null })
    try {
      const id = await dbAddItem(itemData)
      // Add to state immediately, refresh in background
      const newItem: InventoryItem = { id, ...itemData } as InventoryItem
      set((state) => ({ items: [newItem, ...state.items], isLoading: false }))
      getAllInventory().then((items) => set({ items })).catch(() => {})
      return id
    } catch (error) {
      console.error('Failed to add item:', error)
      set({ error: 'Failed to add item', isLoading: false })
      throw error
    }
  },

  updateItem: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      await dbUpdateItem(id, updates)
      const items = await getAllInventory()
      set({ items, isLoading: false })
    } catch (error) {
      console.error('Failed to update item:', error)
      set({ error: 'Failed to update item', isLoading: false })
      throw error
    }
  },

  deleteItem: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await dbDeleteItem(id)
      const items = await getAllInventory()
      set({ items, isLoading: false })
    } catch (error) {
      console.error('Failed to delete item:', error)
      set({ error: 'Failed to delete item', isLoading: false })
      throw error
    }
  }
}))
