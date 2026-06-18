import { absRequest } from '@/api/client'
import type { ABSAuthResponse } from '@/api/types'

// Username/password auth. ABS exposes this at the origin root (/login), not
// under /api, so the path passed to absRequest is /login.
export function login(
  username: string,
  password: string
): Promise<ABSAuthResponse> {
  return absRequest<ABSAuthResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

// Validate a persisted token and rehydrate user state. POST, not GET.
export function authorize(): Promise<ABSAuthResponse> {
  return absRequest<ABSAuthResponse>('/api/authorize', { method: 'POST' })
}

// OpenID flow initiation. The browser is redirected to ABS, which hands off to
// the configured OIDC provider, then returns to /oauth/callback.
export function openIdLoginUrl(): string {
  const callback = `${window.location.origin}/oauth/callback`
  const params = new URLSearchParams({ callback })
  return `/abs-api/auth/openid?${params.toString()}`
}
