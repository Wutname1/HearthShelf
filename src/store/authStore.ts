import { create } from 'zustand'
import type { ABSUser } from '@/api/types'

const TOKEN_KEY = 'hearthshelf.token'

interface AuthState {
  user: ABSUser | null
  token: string | null
  defaultLibraryId: string | null
  isAuthenticated: boolean
  // True until the initial authorize() check resolves on app load.
  isHydrating: boolean
  login: (user: ABSUser, token: string, defaultLibraryId: string) => void
  logout: () => void
  setHydrating: (hydrating: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  defaultLibraryId: null,
  isAuthenticated: false,
  isHydrating: true,
  login: (user, token, defaultLibraryId) => {
    localStorage.setItem(TOKEN_KEY, token)
    set({
      user,
      token,
      defaultLibraryId,
      isAuthenticated: true,
      isHydrating: false,
    })
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({
      user: null,
      token: null,
      defaultLibraryId: null,
      isAuthenticated: false,
      isHydrating: false,
    })
  },
  setHydrating: (isHydrating) => set({ isHydrating }),
}))
