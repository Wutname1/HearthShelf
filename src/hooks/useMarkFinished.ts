import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProgress, meKeys } from '@/api/me'

// Mark one or more items finished / not finished via ABS, then refresh the
// progress-derived caches so tiles, shelves, and detail pages update.
export function useMarkFinished() {
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ ids, isFinished }: { ids: string[]; isFinished: boolean }) => {
      await Promise.all(ids.map((id) => updateProgress(id, { isFinished })))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKeys.me })
      qc.invalidateQueries({ queryKey: meKeys.itemsInProgress })
    },
  })

  return {
    markFinished: (ids: string[], isFinished: boolean) => mutation.mutateAsync({ ids, isFinished }),
    isPending: mutation.isPending,
  }
}
