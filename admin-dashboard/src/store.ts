import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light' | 'midnight' | 'ocean'
export type Role  = 'admin' | 'driver' | 'rider'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar: string
}

interface AppState {
  user: User | null
  theme: Theme
  sidebarCollapsed: boolean
  setUser: (u: User | null) => void
  setTheme: (t: Theme) => void
  toggleSidebar: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      theme: 'dark',
      sidebarCollapsed: false,
      setUser: (user) => {
        if (user === null) {
          localStorage.removeItem('ride-platform-admin')
        }
        set({ user })
      },
      setTheme:      (theme) => set({ theme }),
      toggleSidebar: ()      => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'ride-platform-admin' }
  )
)
