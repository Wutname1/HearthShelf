import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMe, createBookmark, deleteBookmark, meKeys } from '@/api/me'
import type { ABSBookmark } from '@/api/types'

// Real ABS bookmarks for a single item. The list comes from /api/me (bookmarks[]
// filtered by libraryItemId); create/delete mutate ABS and refresh the cache.
export function useBookmarks(libraryItemId: string | null) {
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: meKeys.me,
    queryFn: getMe,
    staleTime: 60 * 1000,
  })

  const bookmarks: ABSBookmark[] = (data?.bookmarks ?? [])
    .filter((b) => b.libraryItemId === libraryItemId)
    .sort((a, b) => a.time - b.time)

  const add = useMutation({
    mutationFn: ({ time, title }: { time: number; title: string }) =>
      createBookmark(libraryItemId as string, time, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: meKeys.me }),
  })

  const remove = useMutation({
    mutationFn: (time: number) => deleteBookmark(libraryItemId as string, time),
    onSuccess: () => qc.invalidateQueries({ queryKey: meKeys.me }),
  })

  return {
    bookmarks,
    addBookmark: (time: number, title: string) => add.mutate({ time, title }),
    removeBookmark: (time: number) => remove.mutate(time),
  }
}
