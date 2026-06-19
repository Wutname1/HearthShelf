import { absRequest } from '@/api/client'
import type {
  ABSItemsInProgressResponse,
  ABSUser,
  ABSMediaProgress,
  ABSBookmark,
} from '@/api/types'

export const meKeys = {
  me: ['me'] as const,
  itemsInProgress: ['items-in-progress'] as const,
}

// Full user payload including mediaProgress[] and bookmarks[].
interface ABSMeResponse extends ABSUser {
  mediaProgress: ABSMediaProgress[]
  bookmarks: ABSBookmark[]
}

export function getMe(): Promise<ABSMeResponse> {
  return absRequest<ABSMeResponse>('/api/me')
}

export function getItemsInProgress(): Promise<ABSItemsInProgressResponse> {
  return absRequest<ABSItemsInProgressResponse>('/api/me/items-in-progress')
}

// Mark an item finished / not finished. PATCH /api/me/progress/:id.
export function updateProgress(
  libraryItemId: string,
  body: { isFinished?: boolean; currentTime?: number }
): Promise<void> {
  return absRequest<void>(`/api/me/progress/${libraryItemId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

// --- Bookmarks (user-scoped, per item) ---

export function createBookmark(
  libraryItemId: string,
  time: number,
  title: string
): Promise<ABSBookmark> {
  return absRequest<ABSBookmark>(`/api/me/item/${libraryItemId}/bookmark`, {
    method: 'POST',
    body: JSON.stringify({ time: Math.round(time), title }),
  })
}

export function deleteBookmark(
  libraryItemId: string,
  time: number
): Promise<void> {
  return absRequest<void>(
    `/api/me/item/${libraryItemId}/bookmark/${Math.round(time)}`,
    { method: 'DELETE' }
  )
}
