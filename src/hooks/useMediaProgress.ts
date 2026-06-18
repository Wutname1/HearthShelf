import { useQuery } from '@tanstack/react-query'
import { getMe, meKeys } from '@/api/me'
import type { ABSMediaProgress } from '@/api/types'

// Returns a lookup of the user's per-item listening progress, keyed by
// libraryItemId. Backed by /api/me (mediaProgress[]); refreshed when a session
// syncs (useProgress invalidates meKeys.me).
export function useMediaProgress() {
  const { data } = useQuery({
    queryKey: meKeys.me,
    queryFn: getMe,
    staleTime: 60 * 1000,
  })

  const byId = new Map<string, ABSMediaProgress>()
  for (const p of data?.mediaProgress ?? []) byId.set(p.libraryItemId, p)
  return byId
}
