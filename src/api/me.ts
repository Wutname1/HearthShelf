import { absRequest } from '@/api/client'
import type {
  ABSItemsInProgressResponse,
  ABSUser,
  ABSMediaProgress,
} from '@/api/types'

export const meKeys = {
  me: ['me'] as const,
  itemsInProgress: ['items-in-progress'] as const,
}

// Full user payload including mediaProgress[] - the source for tile progress.
interface ABSMeResponse extends ABSUser {
  mediaProgress: ABSMediaProgress[]
}

export function getMe(): Promise<ABSMeResponse> {
  return absRequest<ABSMeResponse>('/api/me')
}

export function getItemsInProgress(): Promise<ABSItemsInProgressResponse> {
  return absRequest<ABSItemsInProgressResponse>('/api/me/items-in-progress')
}
