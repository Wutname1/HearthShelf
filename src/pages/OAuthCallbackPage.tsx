import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// ABS completes the OIDC exchange and returns here. The session token arrives
// as a query/hash param; validate it via authorize() then continue into the app.
export function OAuthCallbackPage() {
  const navigate = useNavigate()
  const { hydrate, isAuthenticated, isHydrating } = useAuth()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!isHydrating) {
      navigate(isAuthenticated ? '/library' : '/login', { replace: true })
    }
  }, [isHydrating, isAuthenticated, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Completing sign in...
    </div>
  )
}
