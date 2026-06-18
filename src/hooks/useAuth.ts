import { useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import * as authApi from '@/api/auth'

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isHydrating = useAuthStore((s) => s.isHydrating)
  const defaultLibraryId = useAuthStore((s) => s.defaultLibraryId)
  const setSession = useAuthStore((s) => s.login)
  const clearSession = useAuthStore((s) => s.logout)
  const setHydrating = useAuthStore((s) => s.setHydrating)

  const signIn = useCallback(
    async (username: string, password: string) => {
      const res = await authApi.login(username, password)
      setSession(res.user, res.user.token, res.userDefaultLibraryId)
      return res
    },
    [setSession]
  )

  // Validate a persisted token on app load. Clears the session on failure.
  const hydrate = useCallback(async () => {
    const persisted = useAuthStore.getState().token
    if (!persisted) {
      setHydrating(false)
      return
    }
    try {
      const res = await authApi.authorize()
      setSession(res.user, res.user.token, res.userDefaultLibraryId)
    } catch {
      clearSession()
    }
  }, [setSession, clearSession, setHydrating])

  return {
    user,
    token,
    isAuthenticated,
    isHydrating,
    defaultLibraryId,
    signIn,
    signOut: clearSession,
    hydrate,
  }
}
