import { create } from 'zustand'

export type Role = 'admin' | 'driver' | 'rider'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

interface AppState {
  user: User | null
  activeTrip: string | null
  setUser:       (u: User | null) => void
  setActiveTrip: (id: string | null) => void
}

export const useStore = create<AppState>()((set) => ({
  user:          null,
  activeTrip:    null,
  setUser:       (user)       => set({ user }),
  setActiveTrip: (activeTrip) => set({ activeTrip }),
}))
