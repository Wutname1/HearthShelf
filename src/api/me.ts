import { absRequest } from '@/api/client'
import type { ABSItemsInProgressResponse } from '@/api/types'

export const meKeys = {
  itemsInProgress: ['items-in-progress'] as const,
}

export function getItemsInProgress(): Promise<ABSItemsInProgressResponse> {
  return absRequest<ABSItemsInProgressResponse>('/api/me/items-in-progress')
}
