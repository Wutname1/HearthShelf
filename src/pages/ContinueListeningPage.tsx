import { useQuery } from '@tanstack/react-query'
import { getItemsInProgress, meKeys } from '@/api/me'
import { BookGrid } from '@/components/library/BookGrid'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'

export function ContinueListeningPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: meKeys.itemsInProgress,
    queryFn: getItemsInProgress,
    staleTime: 30 * 1000,
  })

  const items = data?.libraryItems ?? []

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Continue Listening</h1>

      {isLoading && (
        <LoadingSpinner className="py-12" label="Loading your books..." />
      )}
      {isError && (
        <ErrorState
          message="Could not load your in-progress books."
          onRetry={refetch}
        />
      )}
      {data && items.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          Nothing in progress yet. Start a book from your library.
        </p>
      )}
      {items.length > 0 && <BookGrid items={items} />}
    </div>
  )
}
