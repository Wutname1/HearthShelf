// Profile photo (avatar) client. The image bytes live on the HearthShelf backend
// (a US-native feature; ABS has no avatar concept). The browser resizes/crops to
// a small square before upload so the backend stays light. See
// server/routes/avatars.js.

import { useAuthStore } from '@/store/authStore'

export const avatarKeys = {
  meta: (userId: string) => ['avatar', userId] as const,
}

// The <img src> for a user's avatar. version (when known) cache-busts after an
// upload. The GET route is public, so no token is needed on the URL.
export function avatarUrl(userId: string, version?: number): string {
  const base = `/hs/avatars/${encodeURIComponent(userId)}`
  return version ? `${base}?v=${version}` : base
}

// Resize + center-crop an image File to a square `size`px, returning webp bytes.
// Done client-side so the backend never needs an image library. Falls back to
// the original type if webp isn't supported by the canvas.
export async function prepareAvatar(file: File, size = 256): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const sx = (bitmap.width - side) / 2
  const sy = (bitmap.height - side) / 2

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/webp', 0.9),
  )
  if (!blob) throw new Error('encode failed')
  return blob
}

// Upload (or replace) a user's avatar. The blob is sent as the raw request body
// with its mime type as Content-Type. Returns the new version for cache-busting.
export async function uploadAvatar(userId: string, blob: Blob): Promise<{ version: number }> {
  const token = useAuthStore.getState().token
  const res = await fetch(`/hs/avatars/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': blob.type || 'image/webp',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: blob,
  })
  if (!res.ok) throw new Error(`avatar upload ${res.status}`)
  return res.json() as Promise<{ version: number }>
}

export async function deleteAvatar(userId: string): Promise<void> {
  const token = useAuthStore.getState().token
  const res = await fetch(`/hs/avatars/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(`avatar delete ${res.status}`)
}
