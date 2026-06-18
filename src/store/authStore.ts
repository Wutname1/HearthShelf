import { create } from 'zustand'
import type { ABSUser } from '@/api/types'

const TOKEN_KEY = 'hearthshelf.token'

interface AuthState {
  user: ABSUser | null
  token: string | null
  isAuthenticated: boolean
  login: (user: ABSUser, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  isAuthenticated: false,
  login: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token)
    set({ user, token, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
