import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { absRequest } from '@/api/client'
import { openIdInitUrl } from '@/api/auth'
import { createPkcePair, createState } from '@/lib/pkce'
import { useAuth } from '@/hooks/useAuth'
import { useRuntimeConfig } from '@/hooks/useRuntimeConfig'
import type { ABSStatusResponse } from '@/api/types'

// Survives the provider round-trip (the callback page reads these back).
export const OIDC_VERIFIER_KEY = 'hearthshelf.oidc.verifier'
export const OIDC_STATE_KEY = 'hearthshelf.oidc.state'
import { Wordmark } from '@/components/common/Wordmark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { data: runtime } = useRuntimeConfig()

  const { data: status } = useQuery({
    queryKey: ['server-status'],
    queryFn: () => absRequest<ABSStatusResponse>('/status'),
    staleTime: Infinity,
  })

  // A fresh AIO box that hasn't finished setup belongs in the onboarding wizard,
  // not this bare login form: the wizard reveals the generated root credentials
  // and signs the admin in. Without this redirect a first-run AIO visitor lands
  // here with no idea what to type. Slim is intentionally NOT redirected - its
  // onboarding runs AFTER the admin signs into their own ABS (the wizard sends an
  // unauthenticated slim visitor back here), so redirecting would loop. 'hosted'
  // is control-plane managed and never onboards locally.
  const needsOnboarding =
    runtime && !runtime.onboarded && runtime.mode === 'aio'

  const openIdEnabled = status?.authMethods.includes('openid') ?? false
  const openIdLabel = status?.authFormData.authOpenIDButtonText || 'Login with OpenId'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(username, password)
      navigate('/', { replace: true })
    } catch {
      setError('Login failed. Check your username and password.')
    } finally {
      setSubmitting(false)
    }
  }

  // Start the OpenID PKCE flow: stash the verifier + state, then full-navigate
  // to ABS so it can set its session cookies and redirect to the provider.
  async function startOpenId() {
    setError(null)
    const { verifier, challenge } = await createPkcePair()
    const state = createState()
    sessionStorage.setItem(OIDC_VERIFIER_KEY, verifier)
    sessionStorage.setItem(OIDC_STATE_KEY, state)
    window.location.href = openIdInitUrl(challenge, state)
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Wordmark className="text-3xl" />
          <CardTitle className="mt-2 text-sm font-normal text-muted-foreground">
            Sign in to continue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {openIdEnabled && (
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => void startOpenId()}
              >
                {openIdLabel}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
