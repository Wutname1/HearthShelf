import { useAuthStore } from '@/store/authStore'

// All requests go through /abs-api/* which nginx (prod) or the Vite proxy (dev)
// forwards to the ABS server. This keeps CORS out of the app entirely.
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
