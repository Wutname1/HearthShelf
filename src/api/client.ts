import { useAuthStore } from '@/store/authStore'

// All requests go through /abs-api/* which the dev proxy (and nginx in prod)
// forwards to the ABS origin root. Pass the real ABS path - including the
// leading /api for REST routes, or /login, /api/authorize for auth - and this
// prefixes /abs-api so CORS never enters the picture.
const BASE = '/abs-api'

export async function absRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`ABS API error: ${res.status}`)
  return res.json() as Promise<T>
}
