import { absRequest } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import type { ABSPlaybackSession } from '@/api/types'

const BASE = '/abs-api'

const DEVICE = {
  deviceId: 'hearthshelf-web',
  clientName: 'HearthShelf',
  clientVersion: '0.1.0',
}

// Start (or resume) a playback session. ABS returns the session with audio
// tracks, chapters, and the server-side resume position.
export function startPlay(itemId: string): Promise<ABSPlaybackSession> {
  return absRequest<ABSPlaybackSession>(`/api/items/${itemId}/play`, {
    method: 'POST',
    body: JSON.stringify({
      deviceInfo: DEVICE,
      supportedMimeTypes: [
        'audio/mpeg',
        'audio/mp4',
        'audio/aac',
        'audio/flac',
        'audio/ogg',
      ],
    }),
  })
}

// Episode-scoped play for podcasts. @needs-verify against a live podcast library
// - this ABS instance has only book libraries.
export function startPlayEpisode(
  itemId: string,
  episodeId: string
): Promise<ABSPlaybackSession> {
  return absRequest<ABSPlaybackSession>(
    `/api/items/${itemId}/play/${episodeId}`,
    {
      method: 'POST',
      body: JSON.stringify({
        deviceInfo: DEVICE,
        supportedMimeTypes: [
          'audio/mpeg',
          'audio/mp4',
          'audio/aac',
          'audio/flac',
          'audio/ogg',
        ],
      }),
    }
  )
}

interface SyncPayload {
  currentTime: number
  timeListened: number
  duration: number
}

// Periodic progress sync during playback. Returns void - the body is ignored.
export async function syncSession(
  sessionId: string,
  payload: SyncPayload
): Promise<void> {
  const token = useAuthStore.getState().token
  await fetch(`${BASE}/api/session/${sessionId}/sync`, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })
}

// Close the session (on stop / unload). Final position is persisted.
export async function closeSession(
  sessionId: string,
  payload: SyncPayload
): Promise<void> {
  const token = useAuthStore.getState().token
  await fetch(`${BASE}/api/session/${sessionId}/close`, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })
}

// Synchronous best-effort close for `beforeunload`. sendBeacon can't set an
// Authorization header, so the token rides as a query param (same trick as
// stream/cover URLs).
export function closeSessionBeacon(
  sessionId: string,
  payload: SyncPayload
): void {
  const token = useAuthStore.getState().token
  const params = token ? `?token=${encodeURIComponent(token)}` : ''
  const url = `${BASE}/api/session/${sessionId}/close${params}`
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  navigator.sendBeacon(url, blob)
}

// Build a natively-loadable stream URL from a track's contentUrl.
export function streamUrl(contentUrl: string): string {
  const token = useAuthStore.getState().token
  const sep = contentUrl.includes('?') ? '&' : '?'
  const auth = token ? `${sep}token=${encodeURIComponent(token)}` : ''
  return `${BASE}${contentUrl}${auth}`
}
