import { useAuthStore } from '@/store/authStore'

// All requests go through /abs-api/* which the dev proxy (and nginx in prod)
// forwards to the ABS origin root. Pass the real ABS path - including the
// leading /api for REST routes, or /login, /api/authorize for auth - and this
// prefixes /abs-api so CORS never enters the picture.
const BASE = '/abs-api'

// Thrown on a non-2xx ABS response. `status` is the HTTP code; `body` is the raw
// response text (ABS often returns a plain-language reason like "Username already
// taken"), so callers can surface a helpful message instead of a bare status.
export class ABSRequestError extends Error {
  status: number
  body: string
  constructor(status: number, body: string) {
    super(body || `ABS API error: ${status}`)
    this.name = 'ABSRequestError'
    this.status = status
    this.body = body
  }
}

export async function absRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new ABSRequestError(res.status, body)
  }
  // Some mutating routes (PATCH progress, DELETE bookmark) return an empty body
  // or a plain "OK" string rather than JSON. Parse JSON only when present.
  const text = await res.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    return undefined as T
  }
}
