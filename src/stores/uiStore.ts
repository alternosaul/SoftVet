import { create } from 'zustand'

type Theme = 'light' | 'dark'
type ViewMode = 'grid' | 'list'

interface UIState {
  theme: Theme
  sidebarOpen: boolean
  viewMode: ViewMode
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setViewMode: (mode: ViewMode) => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  sidebarOpen: true,
  viewMode: 'grid',
  
  setTheme: (theme) => set({ theme }),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  setViewMode: (mode) => set({ viewMode: mode })
}))
